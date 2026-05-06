import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';
import { PrismaService } from '../../core/database/prisma/prisma.service';
import { getPaginationParams } from '../../common/utils/pagination.utils';
import { PaginationQueryFilter } from '../../common/filters/pagination-query.filter';
import { VehiclesFindOptionsQueryFilter } from './filter/vehicles-find-options-query-filter';
import { JwtPayload } from '../../types/auth.types';
import {
  CurrentRoles,
  NotificationSlug,
} from '../../../generated/prisma/enums';
import { NotificationService } from '../notification/notification.service';
import { Prisma } from '../../../generated/prisma/client';
import { vehicleFindOneInclude } from './constant/vehicles.constant';

@Injectable()
export class VehiclesService {
  private readonly logger = new Logger(VehiclesService.name);

  constructor(
    private readonly prismaService: PrismaService,
    private readonly notificationService: NotificationService,
  ) {}

  async create(userId: string, dto: CreateVehicleDto) {
    await this.checkConflict(dto.licensePlate);

    const vehicle = await this.prismaService.vehicle.create({
      data: {
        driverId: userId,
        ...dto,
      },
    });

    this.logger.log(`created vehicle id: ${vehicle.id} driverId: ${userId}`);

    await this.notificationService.queueNotification({
      recipientId: userId,
      typeSlug: NotificationSlug.VEHICLE_CREATED,
      referenceId: vehicle.id,
      referenceTable: 'vehicles',
      variables: {
        vehicleLicense: vehicle.licensePlate,
      },
    });

    return {
      success: true,
      data: {
        vehicle,
      },
    };
  }

  async findAll(
    userPayload: JwtPayload,
    pagination: PaginationQueryFilter,
    findOptions: VehiclesFindOptionsQueryFilter,
  ) {
    const { page, limit, offset } = getPaginationParams(
      pagination.page,
      pagination.limit,
    );

    const { driverId, search, orderBy, orderDirection } = findOptions;

    const where: Prisma.VehicleWhereInput = {
      ...(driverId && { driverId }),
    };

    // if user is driver only return his vehicles
    if (userPayload.ur === CurrentRoles.DRIVER) {
      where.driverId = userPayload.sub;
    }

    if (search) {
      where.OR = [
        { licensePlate: { contains: search, mode: 'insensitive' } },
        { maker: { contains: search, mode: 'insensitive' } },
        { model: { contains: search, mode: 'insensitive' } },
        { color: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (!(orderBy in Prisma.VehicleScalarFieldEnum)) {
      throw new BadRequestException('vehicles.INVALID_ORDERBY_FIELD');
    }

    const [vehicles, total] = await this.prismaService.$transaction([
      this.prismaService.vehicle.findMany({
        where,
        skip: offset,
        take: limit,
        orderBy: { [orderBy]: orderDirection },
      }),
      this.prismaService.vehicle.count({ where }),
    ]);

    return {
      success: true,
      data: {
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
        vehicles,
      },
    };
  }

  async findOne(userPayload: JwtPayload, vehicleId: string) {
    const where: Prisma.VehicleWhereInput = { id: vehicleId };

    if (userPayload.ur === CurrentRoles.DRIVER) {
      where.driverId = userPayload.sub;
    }

    const vehicle = await this.findIncludeOrThrow(where, vehicleFindOneInclude);

    return {
      success: true,
      data: {
        vehicle,
      },
    };
  }

  async update(userId: string, vehicleId: string, dto: UpdateVehicleDto) {
    const vehicle = await this.findOrThrow(
      { id: vehicleId, driverId: userId },
      { licensePlate: true },
    );

    // check if license plate is changed
    if (dto.licensePlate && dto.licensePlate !== vehicle.licensePlate) {
      await this.checkConflict(dto.licensePlate, vehicleId);
    }

    const updatedVehicle = await this.prismaService.vehicle.update({
      where: { id: vehicleId },
      data: dto,
    });

    this.logger.log(
      `updated vehicle id: ${vehicleId} data: ${JSON.stringify(dto)}`,
    );

    await this.notificationService.queueNotification({
      recipientId: userId,
      typeSlug: NotificationSlug.VEHICLE_UPDATED,
      referenceId: vehicleId,
      referenceTable: 'vehicles',
      variables: {
        vehicleLicense: updatedVehicle.licensePlate,
      },
    });

    return {
      success: true,
      data: {
        vehicle: updatedVehicle,
      },
    };
  }

  async remove(userId: string, vehicleId: string) {
    const vehicle = await this.findOrThrow(
      { id: vehicleId, driverId: userId },
      { id: true, licensePlate: true },
    );

    try {
      await this.prismaService.vehicle.delete({
        where: { id: vehicleId },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2003'
      )
        throw new BadRequestException('vehicles.CAN_NOT_DELETE_THIS_VEHICLE');
      throw error;
    }

    this.logger.log(`deleted vehicle id: ${vehicleId}`);

    await this.notificationService.queueNotification({
      recipientId: userId,
      typeSlug: NotificationSlug.VEHICLE_DELETED,
      referenceId: vehicleId,
      referenceTable: 'vehicles',
      variables: {
        vehicleLicense: vehicle.licensePlate,
      },
    });

    return {
      success: true,
    };
  }

  // ================= helper methods =================

  async checkConflict(licensePlate: string, excludeId?: string) {
    const existingVehicle = await this.prismaService.vehicle.findFirst({
      where: { licensePlate, ...(excludeId && { id: { not: excludeId } }) },
    });
    if (existingVehicle) {
      throw new ConflictException('vehicles.LICENSE_PLATE_ALREADY_EXISTS');
    }
  }

  async findOrThrow<T extends Prisma.VehicleSelect | undefined>(
    where: Prisma.VehicleWhereInput,
    select?: T,
  ) {
    try {
      return (await this.prismaService.vehicle.findFirstOrThrow({
        where,
        select,
      })) as Prisma.VehicleGetPayload<{ select: T }>;
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      )
        throw new NotFoundException('vehicles.VEHICLE_NOT_FOUND');
      throw error;
    }
  }

  async findIncludeOrThrow<T extends Prisma.VehicleInclude | undefined>(
    where: Prisma.VehicleWhereInput,
    include?: T,
  ) {
    try {
      return (await this.prismaService.vehicle.findFirstOrThrow({
        where,
        include,
      })) as Prisma.VehicleGetPayload<{ include: T }>;
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      )
        throw new NotFoundException('vehicles.VEHICLE_NOT_FOUND');
      throw error;
    }
  }
}
