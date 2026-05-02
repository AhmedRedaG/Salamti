import { Injectable, Logger } from '@nestjs/common';
import { Server } from 'socket.io';
import { PrismaService } from '../../core/database/prisma/prisma.service';
import {
  AccidentStatus,
  ParamedicStatus,
  Prisma,
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

  async updateParamedicLocation(paramedicId: string, lng: number, lat: number) {
    // We update the DB via Prisma using the same logic as ParamedicsService
    await this.prismaService.$executeRaw(Prisma.sql`
      UPDATE "paramedics"
      SET "location" = ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)
      WHERE "id" = ${paramedicId}
    `);
    this.logger.log(
      `Paramedic ${paramedicId} location updated to ${lng}, ${lat}`,
    );
  }

  async updateParamedicStatus(
    paramedicId: string,
    status: ParamedicStatus | undefined,
  ) {
    const paramedic = await this.prismaService.paramedic.update({
      where: { id: paramedicId },
      data: { status },
    });
    this.logger.log(`Paramedic ${paramedicId} status updated to ${status}`);
    return { success: true, data: { paramedic } };
  }

  async handleConfirmedAccident(accidentId: string) {
    this.logger.log(`Handling confirmed accident dispatch: ${accidentId}`);

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
        p.id AS "id",
        p.status AS "status",
        ${orderByDistance('p.location', longitude, latitude)} AS "distance"
      FROM "paramedics" AS p
      WHERE p.status = 'available'
        AND p.location IS NOT NULL
      ORDER BY "distance"
      LIMIT 10
    `) as any[];

    if (availableParamedics.length === 0) {
      this.logger.warn(
        `no available paramedics found for accident ${accidentId}`,
      );
      return;
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
  }

  async acceptAccident(
    paramedicId: string,
    accidentId: string,
  ): Promise<boolean> {
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
      return false;
    }

    // create accident response
    await this.prismaService.accidentResponse.create({
      data: {
        accidentId,
        paramedicId,
        patientStatus: PatientStatus.UNKNOWN,
      },
    });

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

    return true;
  }
}
