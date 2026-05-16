import { forwardRef, Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Server } from 'socket.io';
import { PrismaService } from '../../core/database/prisma/prisma.service';
import {
  AccidentLevel,
  AccidentStatus,
  AccidentType,
  ParamedicStatus,
  PatientStatus,
  NotificationSlug,
} from '../../../generated/prisma/client';
import { NotificationService } from '../notification/notification.service';
import { getLongLat, orderByDistance } from '../../common/utils/postgis.utils';
import { AccidentsService } from '../accidents/accidents.service';

@Injectable()
export class DispatchService {
  private readonly logger = new Logger(DispatchService.name);
  private server!: Server;

  // real time state mapping: paramedicId -> socketId
  private activeParamedics = new Map<string, string>();
  // inverse mapping: socketId -> paramedicId
  private socketToParamedic = new Map<string, string>();

  constructor(
    private readonly prismaService: PrismaService,
    private readonly notificationService: NotificationService,
    @Inject(forwardRef(() => AccidentsService))
    private readonly accidentsService: AccidentsService,
    private readonly configService: ConfigService,
  ) {}

  setServer(server: Server) {
    this.server = server;
  }

  handleParamedicConnect(socketId: string, paramedicId: string) {
    this.activeParamedics.set(paramedicId, socketId);
    this.socketToParamedic.set(socketId, paramedicId);
    this.logger.log(
      `paramedic ${paramedicId} connected with socket ${socketId}`,
    );
  }

  handleParamedicDisconnect(socketId: string) {
    const paramedicId = this.socketToParamedic.get(socketId);
    if (paramedicId) {
      this.activeParamedics.delete(paramedicId);
      this.socketToParamedic.delete(socketId);
      this.logger.log(`paramedic ${paramedicId} disconnected (${socketId})`);
    }
  }

  async handleConfirmedAccident(accidentId: string, retryCount: number) {
    this.logger.log(`handling confirmed accident dispatch: ${accidentId}`);

    // get accident details and location
    const [accidentInfo] = (await this.prismaService.$queryRaw`
      SELECT id, level, type, status, ${getLongLat('location')}
      FROM "accidents"
      WHERE id = ${accidentId}::uuid
      LIMIT 1
    `) as {
      longitude: number;
      latitude: number;
      id: string;
      level: AccidentLevel;
      type: AccidentType;
      status: AccidentStatus;
    }[];

    if (!accidentInfo) {
      this.logger.error(`accident ${accidentId} not found during dispatch`);
      return false;
    }

    // because of using $queryRaw, it stores enums as lowercase strings
    if (accidentInfo.status !== AccidentStatus.CONFIRMED.toLocaleLowerCase()) {
      this.logger.warn(`accident ${accidentId} not in confirmed state`);
      return false;
    }

    // get nearest available paramedics
    const { longitude, latitude } = accidentInfo;
    const availableParamedics = await this.getAvailableParamedics(
      longitude,
      latitude,
    );

    if (availableParamedics.length === 0) {
      this.logger.warn(
        `no available paramedics found for accident ${accidentId}`,
      );
    }

    // get top nearest available paramedics
    const nearestParamedicsCount = this.configService.getOrThrow<number>(
      'accident.dispatch.nearestParamedicsCount',
    );
    const topAvailableParamedics = availableParamedics.slice(
      0,
      nearestParamedicsCount,
    );

    let atLeastOneOnlineParamedic = false;
    // emit 'accident:confirmed' to the connected ones among the top available
    for (const paramedic of topAvailableParamedics) {
      const socketId = this.activeParamedics.get(paramedic.id);
      if (socketId && this.server) {
        this.logger.log(
          `dispatching accident ${accidentId} to paramedic ${paramedic.id} (distance: ${paramedic.distance})`,
        );
        atLeastOneOnlineParamedic = true;
        this.server.to(socketId).emit('accident:confirmed', {
          accidentId,
          longitude,
          latitude,
          type: accidentInfo.type,
          level: accidentInfo.level,
          distance: paramedic.distance,
        });
      } else {
        this.logger.warn(
          `paramedic ${paramedic.id} is not online for accident ${accidentId}, trying next of ${topAvailableParamedics.length} paramedics`,
        );
      }
    }

    // retry logic for dispatching if it was not accepted yet
    const maxRetries = atLeastOneOnlineParamedic
      ? this.configService.getOrThrow<number>('accident.dispatch.maxRetries.online')
      : this.configService.getOrThrow<number>('accident.dispatch.maxRetries.offline');

    if (retryCount >= maxRetries) {
      this.logger.warn(
        `accident ${accidentId} reached maximum retries (${maxRetries}) without acceptance, marking as FAILED`,
      );
      await this.prismaService.accident.update({
        where: { id: accidentId },
        data: {
          status: AccidentStatus.FAILED,
        },
      });
    } else {
      // delay logic:
      // if someone is online, wait for them to accept, then re-alert
      // if no one is online, use exponential backoff
      const onlineDelay = this.configService.getOrThrow<number>(
        'accident.dispatch.delay.online',
      );
      const offlineBaseDelay = this.configService.getOrThrow<number>(
        'accident.dispatch.delay.offlineBase',
      );
      const delay = atLeastOneOnlineParamedic
        ? onlineDelay
        : offlineBaseDelay * retryCount ** 2;

      await this.accidentsService.queueHandleConfirmedAccident({
        accidentId,
        retryCount: retryCount + 1,
        delay,
      });

      this.logger.log(
        `scheduled next dispatch attempt for accident ${accidentId} in ${
          delay / 1000
        }s (retry: ${retryCount + 1}/${maxRetries})`,
      );
    }

    return true;
  }

  async acceptAccident(paramedicId: string, accidentId: string) {
    this.logger.log(
      `paramedic ${paramedicId} attempting to accept accident ${accidentId}`,
    );

    // atomic update to ensure race conditions are handled safely
    const updatedAccident = await this.prismaService.accident.updateMany({
      where: {
        id: accidentId,
        status: AccidentStatus.CONFIRMED,
      },
      data: {
        status: AccidentStatus.IN_PROGRESS,
      },
    });

    // if count is 0, the accident was already accepted or not in CONFIRMED state
    if (updatedAccident.count === 0) {
      this.logger.log(
        `accident ${accidentId} already taken or not confirmed. paramedic ${paramedicId} failed to accept.`,
      );
      return { success: false };
    }

    // get the accident's driverId to notify the driver
    const accident = await this.prismaService.accident.findUnique({
      where: { id: accidentId },
      select: { driverId: true },
    });

    // create accident response
    const { id: responseId } = await this.prismaService.accidentResponse.create(
      {
        data: {
          accidentId,
          paramedicId,
          patientStatus: PatientStatus.UNKNOWN,
        },
        select: {
          id: true,
        },
      },
    );

    // update paramedic status
    await this.prismaService.paramedic.update({
      where: { id: paramedicId },
      data: { status: ParamedicStatus.ON_MISSION },
    });

    this.logger.log(
      `accident ${accidentId} successfully accepted by paramedic ${paramedicId}`,
    );

    // notify the winner
    const winnerSocketId = this.activeParamedics.get(paramedicId);
    if (winnerSocketId && this.server) {
      this.server.to(winnerSocketId).emit('accident:assigned', { accidentId });
    }

    // notify others that it was taken
    if (this.server) {
      this.server.emit('accident:taken', { accidentId });
    }

    if (accident) {
      // notify driver
      await this.notificationService.queueNotification({
        recipientId: accident.driverId,
        typeSlug: NotificationSlug.PARAMEDIC_DISPATCHED,
        referenceId: accidentId,
        referenceTable: 'accidents',
      });
    }

    // notify paramedic
    await this.notificationService.queueNotification({
      recipientId: paramedicId,
      typeSlug: NotificationSlug.PARAMEDIC_DISPATCHED,
      referenceId: accidentId,
      referenceTable: 'accidents',
    });

    return { success: true, data: { accidentId, responseId } };
  }

  // ============ helper function ==========

  async getAvailableParamedics(longitude: number, latitude: number) {
    return (await this.prismaService.$queryRaw`
      SELECT 
        id,
        status,
        ${orderByDistance('location', longitude, latitude)} AS "distance"
      FROM "paramedics"
      WHERE status = 'available'
        AND location IS NOT NULL
      ORDER BY "distance"
      LIMIT ${this.configService.getOrThrow<number>(
        'accident.dispatch.maxParamedicsToFetch',
      )}
    `) as { id: string; status: ParamedicStatus; distance: number }[];
  }
}
