import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../core/database/prisma/prisma.service';
import { CreateAccidentDto } from './dto/create-accident.dto';
import { ObusService } from '../obus/obus.service';
import { AccidentLevel, AccidentStatus } from '../../../generated/prisma/enums';
import { InjectQueue } from '@nestjs/bullmq';
import { QueueNames } from '../../types/queue.types';
import { Queue } from 'bullmq';
import { Prisma } from '../../../generated/prisma/client';
import { createPoint } from '../../common/utils/postgis.utils';

@Injectable()
export class AccidentsService {
  private readonly logger = new Logger(AccidentsService.name);

  constructor(
    @InjectQueue(QueueNames.ACCIDENT) private accidentQueue: Queue,
    private readonly prismaService: PrismaService,
    @Inject(forwardRef(() => ObusService))
    private readonly obusService: ObusService,
  ) {}

  async queueCreateAccident(payload: CreateAccidentDto) {
    const job = await this.accidentQueue.add('createAccident', payload);

    this.logger.log(`queued accident job ${job.id}`);
  }

  async createAccident(dto: CreateAccidentDto) {
    const { obuInst, type, ...sensorData } = dto;

    const now = new Date();
    const obu = await this.obusService.findOrThrow(
      {
        instNumber: obuInst,
      },
      {
        id: true,
        driverId: true,
        vehicleId: true,
      },
    );

    if (!obu.driverId || !obu.vehicleId) {
      this.logger.warn(`accident from obu ${obuInst} has no driver or vehicle`);
      return;
    }

    // TODO: use ML model to detect accident level
    const level = this.calculateAccidentLevel(dto.peakG, dto.gyroX, dto.gyroY);

    const accident = await this.prismaService.accident.create({
      data: {
        driverId: obu.driverId,
        vehicleId: obu.vehicleId,
        obuId: obu.id,
        time: now,
        type: type,
        level,
        // create sensor data
        sensorData: {
          create: sensorData,
        },
      },
    });

    // set accident location
    await this.prismaService.$executeRaw(Prisma.sql`
          UPDATE "accidents"
          SET "location" = ${createPoint(dto.lng, dto.lat)}
          WHERE "id" = ${accident.id}
        `);

    this.logger.log(`accident ${accident.id} created`);

    // schedule confirmation job after 20 seconds
    await this.accidentQueue.add(
      'confirmAccident',
      { accidentId: accident.id },
      { delay: 20000 },
    );

    this.logger.log(`queued confirmAccident job for accident ${accident.id}`);
  }

  async cancelAccident(obuInstNumber: string) {
    // only allow cancelling if accident is recorded
    const accident = await this.prismaService.accident.findFirst({
      where: {
        obu: { instNumber: obuInstNumber },
        status: AccidentStatus.RECORDED,
      },
      select: {
        id: true,
      },
    });

    if (!accident) {
      this.logger.warn(
        `accident for obu ${obuInstNumber} not found or not recorded`,
      );
      return;
    }

    await this.prismaService.accident.update({
      where: {
        id: accident.id,
        status: AccidentStatus.RECORDED,
      },
      data: {
        status: AccidentStatus.CANCELED,
      },
    });

    this.logger.log(`accident ${accident.id} canceled`);
  }

  async confirmAccident(accidentId: string): Promise<boolean> {
    const accident = await this.prismaService.accident.findUnique({
      where: { id: accidentId, status: AccidentStatus.RECORDED },
      select: { id: true },
    });

    if (!accident) {
      this.logger.warn(`accident ${accidentId} not found or not recorded`);
      return false;
    }

    await this.prismaService.accident.update({
      where: { id: accidentId },
      data: { status: AccidentStatus.CONFIRMED },
    });

    this.logger.log(`accident ${accidentId} confirmed`);
    return true;
  }

  // =============== helper functions ===============

  async findOrThrow<T extends Prisma.AccidentSelect | undefined>(
    where: Prisma.AccidentWhereInput,
    select?: T,
  ) {
    try {
      return (await this.prismaService.accident.findFirstOrThrow({
        where,
        select,
      })) as Prisma.AccidentGetPayload<{ select: T }>;
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      )
        throw new NotFoundException('accidents.ACCIDENT_NOT_FOUND');
      throw error;
    }
  }

  async findIncludeOrThrow<T extends Prisma.AccidentInclude | undefined>(
    where: Prisma.AccidentWhereInput,
    include?: T,
  ) {
    try {
      return (await this.prismaService.accident.findFirstOrThrow({
        where,
        include,
      })) as Prisma.AccidentGetPayload<{ include: T }>;
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      )
        throw new NotFoundException('accidents.ACCIDENT_NOT_FOUND');
      throw error;
    }
  }

  private calculateAccidentLevel(
    peakG?: number,
    gyroX?: number,
    gyroY?: number,
  ): AccidentLevel {
    if (peakG == null || gyroX == null || gyroY == null) {
      return AccidentLevel.UNKNOWN;
    }

    const gScore = Math.min(peakG / 8, 1);

    const gyroMagnitude = Math.sqrt(gyroX ** 2 + gyroY ** 2);
    const gyroScore = Math.min(gyroMagnitude / 300, 1);

    const score = 0.7 * gScore + 0.3 * gyroScore;

    if (score >= 0.75) return AccidentLevel.HIGH;
    if (score >= 0.4) return AccidentLevel.MEDIUM;
    if (score > 0) return AccidentLevel.LOW;

    return AccidentLevel.UNKNOWN;
  }

  // private calculateAccidentLevel(
  //   peakG?: number,
  //   gyroX?: number,
  //   gyroY?: number,
  // ): AccidentLevel {
  //   if (peakG == null || gyroX == null || gyroY == null) {
  //     return AccidentLevel.UNKNOWN;
  //   }

  //   const rotationalMagnitude = Math.sqrt(gyroX ** 2 + gyroY ** 2);

  //   const score = peakG * 0.75 + rotationalMagnitude * 0.25;

  //   if (score >= 18) return AccidentLevel.HIGH;
  //   if (score >= 10) return AccidentLevel.MEDIUM;
  //   if (score >= 4) return AccidentLevel.LOW;

  //   return AccidentLevel.UNKNOWN;
  // }
}
