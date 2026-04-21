import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { CreateObuDto } from './dto/create-obu.dto';
import { UpdateObuDto } from './dto/update-obu.dto';
import { ClaimObuDto } from './dto/claim-obu.dto';
import { ConnectObuDto } from './dto/connect-obu.dto';
import { PrismaService } from '../../core/database/prisma/prisma.service';
import { getPaginationParams } from '../../common/utils/pagination.utils';
import { PaginationQueryFilter } from '../../common/filters/pagination-query.filter';
import { ObusFindOptionsQueryFilter } from './filter/obus-find-options-query-filter';
import { JwtPayload } from '../../types/auth.types';
import { CurrentRoles, ObuStatus } from '../../../generated/prisma/enums';
import { Prisma } from '../../../generated/prisma/client';
import { obuFindOneInclude } from './constant/obus.constant';
import { VehiclesService } from '../vehicles/vehicles.service';
import { UsersService } from '../users/users.service';
import { ObuMqttService } from '../obu-mqtt/obu-mqtt.service';
import { ObuMqttCommands } from '../../types/obu-mqtt.types';

@Injectable()
export class ObusService {
  private readonly logger = new Logger(ObusService.name);

  constructor(
    private readonly prismaService: PrismaService,
    private readonly vehiclesService: VehiclesService,
    private readonly usersService: UsersService,
    private readonly obuMqttService: ObuMqttService,
  ) {}

  async create(dto: CreateObuDto) {
    await this.checkConflict(dto.instNumber, dto.simCardNumber);

    const obu = await this.prismaService.obu.create({
      data: dto,
    });

    this.logger.log(`created obu id: ${obu.id}`);

    return {
      success: true,
      data: {
        obu,
      },
    };
  }

  async claim(userId: string, dto: ClaimObuDto) {
    const obu = await this.findOrThrow(
      {
        instNumber: dto.instNumber,
        simCardNumber: dto.simCardNumber,
      },
      { id: true, driverId: true },
    );
    if (obu.driverId) {
      throw new ConflictException('obus.OBU_ALREADY_CLAIMED');
    }

    // sure that user is verified
    const user = await this.usersService.findOrThrow(
      { id: userId },
      { isVerified: true },
    );
    if (!user || !user.isVerified) {
      throw new BadRequestException('users.USER_IS_NOT_VERIFIED');
    }

    const updatedObu = await this.prismaService.obu.update({
      where: { id: obu.id },
      data: { driverId: userId },
    });

    this.logger.log(`obu ${obu.id} claimed by driver ${userId}`);

    return {
      success: true,
      data: {
        obu: updatedObu,
      },
    };
  }

  async connectToVehicle(userId: string, obuId: string, dto: ConnectObuDto) {
    const obu = await this.findOrThrow(
      {
        id: obuId,
        driverId: userId,
      },
      { id: true, vehicleId: true, isValid: true },
    );

    if (!obu.isValid) {
      throw new BadRequestException('obus.OBU_IS_NOT_VALID');
    }

    if (obu.vehicleId) {
      throw new BadRequestException('obus.OBU_IS_ALREADY_CONNECTED_TO_VEHICLE');
    }

    await this.vehiclesService.findOrThrow(
      { id: dto.vehicleId, driverId: userId },
      { id: true },
    );

    const updatedObu = await this.prismaService.obu.update({
      where: { id: obuId },
      data: { vehicleId: dto.vehicleId },
    });

    this.logger.log(
      `obu ${obuId} connected to vehicle ${dto.vehicleId} by driver ${userId}`,
    );

    return {
      success: true,
      data: {
        obu: updatedObu,
      },
    };
  }

  async disconnectFromVehicle(userId: string, obuId: string) {
    const obu = await this.findOrThrow(
      {
        id: obuId,
        driverId: userId,
      },
      { id: true, vehicleId: true, isValid: true, status: true },
    );

    if (!obu.isValid) {
      throw new BadRequestException('obus.OBU_IS_NOT_VALID');
    }

    if (!obu.vehicleId) {
      throw new BadRequestException('obus.OBU_IS_NOT_CONNECTED_TO_VEHICLE');
    }

    // need user first to deactivate the obi
    if (obu.status === ObuStatus.ACTIVE) {
      throw new BadRequestException('obus.OBU_IS_ACTIVE');
    }

    const updatedObu = await this.prismaService.obu.update({
      where: { id: obuId },
      data: { vehicleId: null },
    });

    this.logger.log(
      `obu ${obuId} disconnected from vehicle ${obu.vehicleId} by driver ${userId}`,
    );

    return {
      success: true,
      data: {
        obu: updatedObu,
      },
    };
  }

  async findAll(
    userPayload: JwtPayload,
    pagination: PaginationQueryFilter,
    findOptions: ObusFindOptionsQueryFilter,
  ) {
    const { page, limit, offset } = getPaginationParams(
      pagination.page,
      pagination.limit,
    );

    const {
      vehicleId,
      driverId,
      status,
      isValid,
      search,
      orderBy,
      orderDirection,
    } = findOptions;

    const where: Prisma.ObuWhereInput = {
      ...(isValid !== undefined && { isValid }),
      vehicleId,
      driverId,
      status,
    };

    // to allow driver to see only his obus
    if (userPayload.ur === CurrentRoles.DRIVER) {
      where.driverId = userPayload.sub;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { instNumber: { contains: search, mode: 'insensitive' } },
        { simCardNumber: { contains: search, mode: 'insensitive' } },
        { version: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (!(orderBy in Prisma.ObuScalarFieldEnum)) {
      throw new BadRequestException('obus.INVALID_ORDERBY_FIELD');
    }

    const [obus, total] = await this.prismaService.$transaction([
      this.prismaService.obu.findMany({
        where,
        skip: offset,
        take: limit,
        orderBy: { [orderBy]: orderDirection },
      }),
      this.prismaService.obu.count({ where }),
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
        obus,
      },
    };
  }

  async findOne(userPayload: JwtPayload, obuId: string) {
    const where: Prisma.ObuWhereInput = { id: obuId };

    if (userPayload.ur === CurrentRoles.DRIVER) {
      where.driverId = userPayload.sub;
    }

    const obu = await this.findIncludeOrThrow(where, obuFindOneInclude);

    return {
      success: true,
      data: {
        obu,
      },
    };
  }

  async update(obuId: string, dto: UpdateObuDto) {
    const obu = await this.findOrThrow(
      { id: obuId },
      { instNumber: true, simCardNumber: true },
    );

    if (
      (dto.instNumber && dto.instNumber !== obu.instNumber) ||
      (dto.simCardNumber && dto.simCardNumber !== obu.simCardNumber)
    ) {
      await this.checkConflict(
        dto.instNumber || obu.instNumber,
        dto.simCardNumber || obu.simCardNumber,
        obuId,
      );
    }

    const data: Prisma.ObuUncheckedUpdateInput = {
      ...dto,
    };

    // if obu status is broken or outdated then it is not valid and can not be connected to any vehicle
    const invalidStatuses: ObuStatus[] = [ObuStatus.BROKEN, ObuStatus.OUTDATED];
    if (dto.status) {
      if (invalidStatuses.includes(dto.status)) {
        data.isValid = false;
        data.vehicleId = null;
      }

      // if obu status is ready then it is valid and can be connected to a vehicle
      if (dto.status === ObuStatus.READY) {
        data.isValid = true;
        data.vehicleId = null;
      }
    }

    const updatedObu = await this.prismaService.obu.update({
      where: { id: obuId },
      data,
    });

    this.logger.log(`updated obu id: ${obuId} data: ${JSON.stringify(dto)}`);

    return {
      success: true,
      data: {
        obu: updatedObu,
      },
    };
  }

  async remove(obuId: string) {
    await this.findOrThrow({ id: obuId }, { id: true });

    try {
      await this.prismaService.obu.delete({
        where: { id: obuId },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2003'
      )
        throw new BadRequestException('obus.CAN_NOT_DELETE_THIS_OBU');
      throw error;
    }

    this.logger.log(`deleted obu id: ${obuId}`);

    return {
      success: true,
    };
  }

  async activate(userId: string, obuId: string) {
    const obu = await this.findOrThrow(
      {
        id: obuId,
        driverId: userId,
      },
      {
        instNumber: true,
        isValid: true,
        vehicleId: true,
      },
    );

    if (!obu.isValid) {
      throw new BadRequestException('obus.OBU_IS_NOT_VALID');
    }

    if (!obu.vehicleId) {
      throw new BadRequestException('obus.OBU_IS_NOT_CONNECTED_TO_VEHICLE');
    }

    const topicName = this.obuMqttService.generatePublishTopicName(
      obu.instNumber,
    );

    // send command to obu to activate it
    // and if it fails or no response from obu throw error
    try {
      await this.obuMqttService.sendSingleCommand(
        topicName,
        ObuMqttCommands.ACTIVATE,
      );
    } catch {
      throw new BadRequestException('obus.CAN_NOT_ACTIVATE_THIS_OBU_NOW');
    }

    // update obu status to active
    await this.prismaService.obu.update({
      where: { id: obuId },
      data: { status: ObuStatus.ACTIVE },
    });

    return {
      success: true,
    };
  }

  async deactivate(userId: string, obuId: string) {
    const obu = await this.findOrThrow(
      {
        id: obuId,
        driverId: userId,
      },
      {
        instNumber: true,
        isValid: true,
        vehicleId: true,
      },
    );

    if (!obu.isValid) {
      throw new BadRequestException('obus.OBU_IS_NOT_VALID');
    }

    const topicName = this.obuMqttService.generatePublishTopicName(
      obu.instNumber,
    );

    // send command to obu to deactivate it
    // and if it fails or no response from obu throw error
    try {
      await this.obuMqttService.sendSingleCommand(
        topicName,
        ObuMqttCommands.DEACTIVATE,
      );
    } catch {
      throw new BadRequestException('obus.CAN_NOT_DEACTIVATE_THIS_OBU_NOW');
    }

    // update obu status to ready
    await this.prismaService.obu.update({
      where: { id: obuId },
      data: { status: ObuStatus.READY },
    });

    return {
      success: true,
    };
  }

  // ================= helper methods =================

  async checkConflict(
    instNumber: string,
    simCardNumber: string,
    excludeId?: string,
  ) {
    const existingObu = await this.prismaService.obu.findFirst({
      where: {
        OR: [{ instNumber }, { simCardNumber }],
        ...(excludeId && { id: { not: excludeId } }),
      },
    });
    if (existingObu) {
      if (existingObu.instNumber === instNumber) {
        throw new ConflictException('obus.INST_NUMBER_ALREADY_EXISTS');
      }
      throw new ConflictException('obus.SIM_CARD_NUMBER_ALREADY_EXISTS');
    }
  }

  async findOrThrow<T extends Prisma.ObuSelect | undefined>(
    where: Prisma.ObuWhereInput,
    select?: T,
  ) {
    try {
      return (await this.prismaService.obu.findFirstOrThrow({
        where,
        select,
      })) as Prisma.ObuGetPayload<{ select: T }>;
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      )
        throw new NotFoundException('obus.OBU_NOT_FOUND');
      throw error;
    }
  }

  async findIncludeOrThrow<T extends Prisma.ObuInclude | undefined>(
    where: Prisma.ObuWhereInput,
    include?: T,
  ) {
    try {
      return (await this.prismaService.obu.findFirstOrThrow({
        where,
        include,
      })) as Prisma.ObuGetPayload<{ include: T }>;
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      )
        throw new NotFoundException('obus.OBU_NOT_FOUND');
      throw error;
    }
  }
}
