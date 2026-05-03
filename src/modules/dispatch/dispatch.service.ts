import { Injectable, Logger } from '@nestjs/common';
import { Server } from 'socket.io';
import { PrismaService } from '../../core/database/prisma/prisma.service';
import {
  AccidentStatus,
  ParamedicStatus,
  PatientStatus,
} from '../../../generated/prisma/client';
import { getLongLat, orderByDistance } from '../../common/utils/postgis.utils';

@Injectable()
export class DispatchService {
  private readonly logger = new Logger(DispatchService.name);
  private server!: Server;

  // real time state mapping: paramedicId -> socketId
  private activeParamedics = new Map<string, string>();
  // inverse mapping: socketId -> paramedicId
  private socketToParamedic = new Map<string, string>();

  constructor(private readonly prismaService: PrismaService) {}

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

  async handleConfirmedAccident(accidentId: string) {
    this.logger.log(`handling confirmed accident dispatch: ${accidentId}`);

    // get accident details and location
    const accidentLocationResult = (await this.prismaService.$queryRaw`
      SELECT id, level, type, ${getLongLat('location')}
      FROM "accidents"
      WHERE id = ${accidentId}::uuid
    `) as any[];

    if (!accidentLocationResult || accidentLocationResult.length === 0) {
      this.logger.error(`accident ${accidentId} not found during dispatch`);
    }

    const accidentInfo = accidentLocationResult[0];
    const { longitude, latitude } = accidentInfo;

    // get available paramedics ordered by distance
    const availableParamedics = (await this.prismaService.$queryRaw`
      SELECT 
        id,
        status,
        ${orderByDistance('location', longitude, latitude)} AS "distance"
      FROM "paramedics"
      WHERE status = 'available'
        AND location IS NOT NULL
      ORDER BY "distance"
      LIMIT 10
    `) as any[];

    if (availableParamedics.length === 0) {
      this.logger.warn(
        `no available paramedics found for accident ${accidentId}`,
      );
      return { success: false };
    }

    // emit 'accident:confirmed' to the connected ones among the top available
    for (const paramedic of availableParamedics) {
      const socketId = this.activeParamedics.get(paramedic.id);
      if (socketId && this.server) {
        this.logger.log(
          `dispatching accident ${accidentId} to paramedic ${paramedic.id} (distance: ${paramedic.distance})`,
        );
        this.server.to(socketId).emit('accident:confirmed', {
          accidentId: accidentInfo.id,
          type: accidentInfo.type,
          level: accidentInfo.level,
          longitude,
          latitude,
          distance: paramedic.distance,
        });
      }
    }

    return { success: true };
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

    return { success: true, data: { accidentId, responseId } };
  }
}
