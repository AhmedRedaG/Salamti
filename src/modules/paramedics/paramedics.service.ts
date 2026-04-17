import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../core/database/prisma/prisma.service';
import { ParamedicStatus, Prisma } from '../../../generated/prisma/client';
import { AvailableParamedicDto } from './dto/available-paramedic.dto';
import {
  createPoint,
  getLongLat,
  orderByDistance,
} from '../../common/utils/postgis.utils';
import { ParamedicsLocationFindOptionsQueryFilter } from './filter/users-find-options-query-filter';
import { PaginationQueryFilter } from '../../common/filters/pagination-query.filter';
import { getPaginationParams } from '../../common/utils/pagination.utils';

@Injectable()
export class ParamedicsService {
  constructor(private readonly prismaService: PrismaService) {}

  async paramedicAuthorization(id: string, isAuthorized: boolean) {
    const paramedic = await this.findOrThrow(
      { id },
      { id: true, status: true },
    );

    // cant change authorization if on mission
    if (paramedic.status === ParamedicStatus.ON_MISSION)
      throw new ConflictException('paramedics.PARAMEDIC_ON_MISSION');

    await this.prismaService.paramedic.update({
      where: { id },
      data: {
        isAuthorized,
        // set status to unavailable if unauthorized
        ...(!isAuthorized && { status: ParamedicStatus.UNAVAILABLE }),
      },
    });

    return { success: true };
  }

  async paramedicAvailable(userId: string, dto: AvailableParamedicDto) {
    const paramedic = await this.findOrThrow(
      { id: userId },
      {
        id: true,
        status: true,
        isAuthorized: true,
        user: { select: { isVerified: true } },
      },
    );

    if (paramedic.status === ParamedicStatus.AVAILABLE)
      throw new ConflictException('paramedics.PARAMEDIC_ALREADY_AVAILABLE');
    if (paramedic.status === ParamedicStatus.ON_MISSION)
      throw new ConflictException('paramedics.PARAMEDIC_ON_MISSION');

    // check if the paramedic is verified and authorized
    if (!paramedic.user.isVerified)
      throw new ConflictException('users.USER_IS_NOT_VERIFIED');
    if (!paramedic.isAuthorized)
      throw new ConflictException('paramedics.PARAMEDIC_NOT_AUTHORIZED');

    const { gpsLongitude, gpsLatitude } = dto;

    // set location and status to available
    await this.prismaService.$executeRaw(Prisma.sql`
      UPDATE "paramedics"
      SET "status" = 'available', 
          "location" = ${createPoint(gpsLongitude, gpsLatitude)}
      WHERE "id" = ${userId}
    `);

    return { success: true };
  }

  async paramedicUnavailable(userId: string) {
    const paramedic = await this.findOrThrow(
      { id: userId },
      {
        id: true,
        status: true,
        isAuthorized: true,
        user: { select: { isVerified: true } },
      },
    );

    if (paramedic.status === ParamedicStatus.UNAVAILABLE)
      throw new ConflictException('paramedics.PARAMEDIC_ALREADY_UNAVAILABLE');
    if (paramedic.status === ParamedicStatus.ON_MISSION)
      throw new ConflictException('paramedics.PARAMEDIC_ON_MISSION');

    // check if the paramedic is verified and authorized
    if (!paramedic.user.isVerified)
      throw new ConflictException('users.USER_IS_NOT_VERIFIED');
    if (!paramedic.isAuthorized)
      throw new ConflictException('paramedics.PARAMEDIC_NOT_AUTHORIZED');

    await this.prismaService.paramedic.update({
      where: { id: userId },
      data: { status: ParamedicStatus.UNAVAILABLE },
    });

    return { success: true };
  }

  async findAllParamedicsLocations(
    pagination: PaginationQueryFilter,
    findOptions: ParamedicsLocationFindOptionsQueryFilter,
  ) {
    const defaultLimit = 50; // force limit items per page
    const { page, limit, offset } = getPaginationParams(
      pagination.page,
      defaultLimit,
    );

    const { status, gpsLongitude, gpsLatitude } = findOptions;

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const paramedicsLocations = (await this.prismaService.$queryRaw`
      SELECT 
        p.id AS "id",
        u.full_name AS "fullName",
        u.phone AS "phone",
        p.is_authorized AS "isAuthorized",
        p.status AS "status",
        ${getLongLat('p.location')},
        ${orderByDistance('p.location', gpsLongitude, gpsLatitude)} AS "distance",
        COUNT(*) OVER()::int AS "total"
      FROM "paramedics" AS p INNER JOIN "users" AS u USING(id)
      WHERE p.location IS NOT NULL
      ${status ? Prisma.sql`AND p.status = ${status.toLowerCase()}` : Prisma.empty}
      ORDER BY "distance"
      LIMIT ${limit}
      OFFSET ${offset}
    `) as any;

    const total = paramedicsLocations[0]?.total ?? 0;

    // remove the repeated total field
    const cleanedData = paramedicsLocations.map(({ total, ...rest }) => rest);

    return {
      success: true,
      data: {
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
        paramedicsLocations: cleanedData,
      },
    };
  }

  async findParamedicLocation(id: string) {
    const paramedicLocation = await this.prismaService.$queryRaw`
      SELECT 
        p.id AS "id",
        u.full_name AS "fullName",
        u.phone AS "phone",
        p.is_authorized AS "isAuthorized",
        p.status AS "status",
        ${getLongLat('p.location')}
      FROM "paramedics" AS p INNER JOIN "users" AS u USING(id)
      WHERE p.id = ${id}
    `;

    if (!paramedicLocation)
      throw new NotFoundException('paramedics.PARAMEDIC_NOT_FOUND');

    return {
      success: true,
      data: {
        paramedicLocation,
      },
    };
  }

  // =============== helper methods ===============

  async findOrThrow<T extends Prisma.ParamedicSelect | undefined>(
    where: Prisma.ParamedicWhereInput,
    select?: T,
  ) {
    try {
      return (await this.prismaService.paramedic.findFirstOrThrow({
        where,
        select,
      })) as Prisma.ParamedicGetPayload<{ select: T }>;
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      )
        throw new NotFoundException('paramedics.PARAMEDIC_NOT_FOUND');
      throw error;
    }
  }
}
