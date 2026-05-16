import {
  BadRequestException,
  ConflictException,
  forwardRef,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../core/database/prisma/prisma.service';
import { CreateAccidentDto } from './dto/create-accident.dto';
import { ObusService } from '../obus/obus.service';
import {
  AccidentLevel,
  AccidentStatus,
  AccidentType,
  CurrentRoles,
  NotificationSlug,
} from '../../../generated/prisma/enums';
import { NotificationService } from '../notification/notification.service';
import { InjectQueue } from '@nestjs/bullmq';
import { QueueNames } from '../../types/queue.types';
import { Queue } from 'bullmq';
import { Prisma } from '../../../generated/prisma/client';
import {
  createPoint,
  getLongLat,
  orderByDistance,
} from '../../common/utils/postgis.utils';
import { getPaginationParams } from '../../common/utils/pagination.utils';
import { PaginationQueryFilter } from '../../common/filters/pagination-query.filter';
import { AccidentsFindOptionsQueryFilter } from './filter/accidents-find-options-query-filter';
import { JwtPayload } from '../../types/auth.types';
import { accidentFindOneInclude } from './constant/accidents.constant';
import { OrderDirection } from '../../common/filters/main-find-options-query.filter';
import { EmailService } from '../email/email.service';

@Injectable()
export class AccidentsService {
  private readonly logger = new Logger(AccidentsService.name);

  constructor(
    @InjectQueue(QueueNames.ACCIDENT) private accidentQueue: Queue,
    private readonly prismaService: PrismaService,
    @Inject(forwardRef(() => ObusService))
    private readonly obusService: ObusService,
    private readonly notificationService: NotificationService,
    private readonly emailService: EmailService,
    private readonly configService: ConfigService,
  ) {}

  async findAll(
    userPayload: JwtPayload,
    pagination: PaginationQueryFilter,
    findOptions: AccidentsFindOptionsQueryFilter,
  ) {
    const { page, limit, offset } = getPaginationParams(
      pagination.page,
      pagination.limit,
    );

    const {
      driverId,
      vehicleId,
      obuId,
      status,
      type,
      level,
      gpsLongitude,
      gpsLatitude,
      orderDirection,
    } = findOptions;

    const conditions: Prisma.Sql[] = [];
    if (userPayload.ur === CurrentRoles.DRIVER) {
      conditions.push(Prisma.sql`a.driver_id = ${userPayload.sub}::uuid`);
    } else if (driverId) {
      conditions.push(Prisma.sql`a.driver_id = ${driverId}::uuid`);
    }

    if (vehicleId)
      conditions.push(Prisma.sql`a.vehicle_id = ${vehicleId}::uuid`);
    if (obuId) conditions.push(Prisma.sql`a.obu_id = ${obuId}::uuid`);
    if (status)
      conditions.push(
        Prisma.sql`a.status = CAST(${status.toLowerCase()} AS "AccidentStatus")`,
      );
    if (type)
      conditions.push(
        Prisma.sql`a.type = CAST(${type.toLowerCase()} AS "AccidentType")`,
      );
    if (level)
      conditions.push(
        Prisma.sql`a.level = CAST(${level.toLowerCase()} AS "AccidentLevel")`,
      );

    const whereClause =
      conditions.length > 0
        ? Prisma.sql`WHERE ${Prisma.join(conditions, ' AND ')}`
        : Prisma.empty;

    let orderByClause;
    if (gpsLongitude && gpsLatitude) {
      orderByClause = Prisma.sql`ORDER BY "distance" ASC`;
    } else {
      const finalOrderBy = 'created_at';
      const finalOrderDir =
        orderDirection === OrderDirection.ASC
          ? Prisma.sql`ASC`
          : Prisma.sql`DESC`;

      orderByClause = Prisma.sql`ORDER BY a.${Prisma.raw(finalOrderBy)} ${finalOrderDir}`;
    }

    const distanceSql =
      gpsLongitude && gpsLatitude
        ? Prisma.sql`${orderByDistance('a.location', gpsLongitude, gpsLatitude)}`
        : Prisma.sql`0`;

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const rawAccidents = (await this.prismaService.$queryRaw`
      SELECT 
        a.id AS "id",
        a.driver_id AS "driverId",
        a.vehicle_id AS "vehicleId",
        a.obu_id AS "obuId",
        a.time AS "time",
        a.type AS "type",
        a.level AS "level",
        a.status AS "status",
        a.created_at AS "createdAt",
        ${getLongLat('a.location')},
        ${distanceSql} AS "distance",
        COUNT(*) OVER()::int AS "total"
      FROM "accidents" AS a
      ${whereClause}
      ${orderByClause}
      LIMIT ${limit}
      OFFSET ${offset}
    `) as any;

    const total = rawAccidents[0]?.total ?? 0;
    const cleanedData = rawAccidents.map(({ total, ...rest }: any) => rest);

    return {
      success: true,
      data: {
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
        accidents: cleanedData,
      },
    };
  }

  async findOne(userPayload: JwtPayload, id: string) {
    const where: Prisma.AccidentWhereInput = { id };
    if (userPayload.ur === CurrentRoles.DRIVER) {
      where.driverId = userPayload.sub;
    }

    const accident = await this.findIncludeOrThrow(
      where,
      accidentFindOneInclude,
    );

    // fetch the location specifically
    // const locationData = await this.prismaService.$queryRaw<
    //   Array<{ longitude: number; latitude: number }>
    // >`
    //   SELECT ${getLongLat('location')}
    //   FROM "accidents"
    //   WHERE "id" = ${id}::uuid
    // `;

    return {
      success: true,
      data: {
        accident,
      },
    };
  }

  async cancelAccidentManual(id: string) {
    const accident = await this.findOrThrow(
      { id },
      { id: true, status: true, driverId: true },
    );

    if (accident.status === AccidentStatus.IN_PROGRESS) {
      throw new BadRequestException('accidents.IN_PROGRESS');
    }

    if (accident.status === AccidentStatus.CANCELED) {
      throw new ConflictException('accidents.ALREADY_CANCELED');
    }

    await this.prismaService.accident.update({
      where: { id: accident.id },
      data: { status: AccidentStatus.CANCELED },
    });

    await this.notificationService.queueNotification({
      recipientId: accident.driverId,
      typeSlug: NotificationSlug.ACCIDENT_CANCELED,
      referenceId: accident.id,
      referenceTable: 'accidents',
    });

    this.logger.log(`accident ${id} manually canceled by admin`);

    return { success: true };
  }

  // =============== internal functions ===============

  async queueCreateAccident(payload: CreateAccidentDto) {
    const job = await this.accidentQueue.add('createAccident', payload, {
      jobId: `create-accident-${payload.obuInst}`,
    });

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
      return { success: false };
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

    await this.notificationService.queueNotification({
      recipientId: obu.driverId,
      typeSlug: NotificationSlug.ACCIDENT_DETECTED,
      referenceId: accident.id,
      referenceTable: 'accidents',
      variables: {
        obuInst: obuInst,
      },
    });

    this.logger.log(`accident ${accident.id} created`);

    // set delay for confirmation job
    // if accident is type: accident -> 20 seconds
    // else -> 10 seconds
    const delay =
      type === AccidentType.ACCIDENTS
        ? this.configService.get<number>('accident.confirmationDelay.accident')
        : this.configService.get<number>('accident.confirmationDelay.alert');

    // schedule confirmation job
    await this.accidentQueue.add(
      'confirmAccident',
      { accidentId: accident.id },
      {
        delay,
        jobId: `confirm-accident-${accident.id}`,
      },
    );

    this.logger.log(`queued confirmAccident job for accident ${accident.id}`);
    return { success: true };
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
        driverId: true,
      },
    });

    if (!accident) {
      this.logger.warn(
        `accident for obu ${obuInstNumber} not found or not recorded`,
      );
      return { success: false };
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

    await this.notificationService.queueNotification({
      recipientId: accident.driverId,
      typeSlug: NotificationSlug.ACCIDENT_CANCELED,
      referenceId: accident.id,
      referenceTable: 'accidents',
    });

    this.logger.log(`accident ${accident.id} canceled`);
    return { success: true };
  }

  async confirmAccident(accidentId: string): Promise<boolean> {
    const accident = await this.prismaService.accident.findUnique({
      where: { id: accidentId, status: AccidentStatus.RECORDED },
      select: {
        id: true,
        driverId: true,
        level: true,
        time: true,
        driver: {
          select: {
            user: { select: { fullName: true, phone: true } },
            emergencyContacts: {
              where: { autoNotify: true },
              select: { fullName: true, email: true },
            },
          },
        },
      },
    });

    if (!accident) {
      this.logger.warn(`accident ${accidentId} not found or not recorded`);
      return false;
    }

    await this.prismaService.accident.update({
      where: { id: accidentId },
      data: { status: AccidentStatus.CONFIRMED },
    });

    await this.notificationService.queueNotification({
      recipientId: accident.driverId,
      typeSlug: NotificationSlug.ACCIDENT_CONFIRMED,
      referenceId: accidentId,
      referenceTable: 'accidents',
    });

    this.logger.log(`accident ${accidentId} confirmed`);

    // fetch accident location
    const locationData = await this.prismaService.$queryRaw<
      Array<{ longitude: number; latitude: number }>
    >`
      SELECT ${getLongLat('location')}
      FROM "accidents"
      WHERE "id" = ${accidentId}::uuid
    `;

    const location = locationData[0]
      ? { lat: locationData[0].latitude, lng: locationData[0].longitude }
      : null;

    // TODO: uncomment this after dev phase
    // send emails to emergency contacts
    // const contacts = accident.driver?.emergencyContacts || [];
    // for (const contact of contacts) {
    //   if (contact.email) {
    //     await this.emailService.sendEmergencyAlertMail({
    //       contactName: contact.fullName,
    //       contactEmail: contact.email,
    //       driverName: accident.driver.user.fullName,
    //       driverPhone: accident.driver.user.phone,
    //       accidentTime: accident.time,
    //       accidentLevel: accident.level,
    //       accidentStatus: 'CONFIRMED',
    //       location,
    //     });
    //   }
    // }

    // queue to confirmed accident handler
    await this.queueHandleConfirmedAccident({
      accidentId,
      retryCount: this.configService.getOrThrow<number>(
        'accident.dispatch.initialRetryCount',
      ),
    });

    return true;
  }

  async queueHandleConfirmedAccident({
    accidentId,
    retryCount,
    delay,
  }: {
    accidentId: string;
    retryCount: number;
    delay?: number;
  }) {
    await this.accidentQueue.add(
      'handleConfirmedAccident',
      { accidentId, retryCount },
      {
        ...(delay && { delay }),
        jobId: `confirmed-accident-${accidentId}-retry-${retryCount}`,
      },
    );

    this.logger.log(
      `queued handleConfirmedAccident job for accident ${accidentId}, retry count: ${retryCount}`,
    );
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

    const gDivisor = this.configService.getOrThrow<number>(
      'accident.scoring.gDivisor',
    );
    const gyroDivisor = this.configService.getOrThrow<number>(
      'accident.scoring.gyroDivisor',
    );
    const gWeight = this.configService.getOrThrow<number>(
      'accident.scoring.gWeight',
    );
    const gyroWeight = this.configService.getOrThrow<number>(
      'accident.scoring.gyroWeight',
    );

    const gScore = Math.min(peakG / gDivisor, 1);

    const gyroMagnitude = Math.sqrt(gyroX ** 2 + gyroY ** 2);
    const gyroScore = Math.min(gyroMagnitude / gyroDivisor, 1);

    const score = gWeight * gScore + gyroWeight * gyroScore;

    const thresholds = this.configService.getOrThrow<{
      high: number;
      medium: number;
      low: number;
    }>('accident.scoring.thresholds');

    if (score >= thresholds.high) return AccidentLevel.HIGH;
    if (score >= thresholds.medium) return AccidentLevel.MEDIUM;
    if (score > thresholds.low) return AccidentLevel.LOW;

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
