import {
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../../core/database/prisma/prisma.service';
import { UpdateDriverDto } from './dto/update-driver.dto';
import { JwtPayload } from '../../types/auth.types';
import { CurrentRoles } from '../../../generated/prisma/enums';
import { Prisma } from '../../../generated/prisma/client';

@Injectable()
export class DriversService {
  private readonly logger = new Logger(DriversService.name);

  constructor(private readonly prismaService: PrismaService) {}

  async update(
    userPayload: JwtPayload,
    driverId: string,
    dto: UpdateDriverDto,
  ) {
    // verify authorization
    if (userPayload.sub !== driverId) {
      if (userPayload.ur !== CurrentRoles.ADMIN) {
        throw new UnauthorizedException(
          'drivers.UNAUTHORIZED_TO_UPDATE_DRIVER',
        );
      }
    }

    await this.findOrThrow({ id: driverId }, { id: true });

    const updatedDriver = await this.prismaService.driver.update({
      where: { id: driverId },
      data: dto,
    });

    this.logger.log(
      `updated driver id: ${driverId} data: ${JSON.stringify(dto)}`,
    );

    return {
      success: true,
      data: {
        driver: updatedDriver,
      },
    };
  }

  // ================= helper methods =================

  async findOrThrow<T extends Prisma.DriverSelect | undefined>(
    where: Prisma.DriverWhereInput,
    select?: T,
  ) {
    try {
      return (await this.prismaService.driver.findFirstOrThrow({
        where,
        select,
      })) as Prisma.DriverGetPayload<{ select: T }>;
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      )
        throw new NotFoundException('drivers.DRIVER_NOT_FOUND');
      throw error;
    }
  }

  async findIncludeOrThrow<T extends Prisma.DriverInclude | undefined>(
    where: Prisma.DriverWhereInput,
    include?: T,
  ) {
    try {
      return (await this.prismaService.driver.findFirstOrThrow({
        where,
        include,
      })) as Prisma.DriverGetPayload<{ include: T }>;
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      )
        throw new NotFoundException('drivers.DRIVER_NOT_FOUND');
      throw error;
    }
  }
}
