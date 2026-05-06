import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../core/database/prisma/prisma.service';
import { getPaginationParams } from '../../common/utils/pagination.utils';
import { PaginationQueryFilter } from '../../common/filters/pagination-query.filter';
import { AccidentResponsesFindOptionsQueryFilter } from './filter/accident-responses-find-options-query-filter';
import { JwtPayload } from '../../types/auth.types';
import {
  CurrentRoles,
  ResponseStatus,
  ParamedicStatus,
  AccidentStatus,
  NotificationSlug,
} from '../../../generated/prisma/enums';
import { NotificationService } from '../notification/notification.service';
import { Prisma } from '../../../generated/prisma/client';
import {
  accidentResponseFindAllSelect,
  accidentResponseFindOneInclude,
} from './constant/accident-responses.constant';
import { CompleteAccidentResponseDto } from './dto/complete-accident-response.dto';

@Injectable()
export class AccidentResponsesService {
  private readonly logger = new Logger(AccidentResponsesService.name);

  constructor(
    private readonly prismaService: PrismaService,
    private readonly notificationService: NotificationService,
  ) {}

  async findAll(
    userPayload: JwtPayload,
    pagination: PaginationQueryFilter,
    findOptions: AccidentResponsesFindOptionsQueryFilter,
  ) {
    const { page, limit, offset } = getPaginationParams(
      pagination.page,
      pagination.limit,
    );

    const {
      accidentId,
      paramedicId,
      responseStatus,
      patientStatus,
      orderBy,
      orderDirection,
    } = findOptions;

    const where: Prisma.AccidentResponseWhereInput = {
      ...(accidentId && { accidentId }),
      ...(paramedicId && { paramedicId }),
      ...(responseStatus && { responseStatus }),
      ...(patientStatus && { patientStatus }),
    };

    if (userPayload.ur === CurrentRoles.PARAMEDIC) {
      where.paramedicId = userPayload.sub;
    }

    if (!(orderBy in Prisma.AccidentResponseScalarFieldEnum)) {
      throw new BadRequestException('accident-responses.INVALID_ORDERBY_FIELD');
    }

    const [responses, total] = await this.prismaService.$transaction([
      this.prismaService.accidentResponse.findMany({
        where,
        skip: offset,
        take: limit,
        orderBy: { [orderBy]: orderDirection },
        select: accidentResponseFindAllSelect,
      }),
      this.prismaService.accidentResponse.count({ where }),
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
        responses,
      },
    };
  }

  async findOne(userPayload: JwtPayload, responseId: string) {
    const where: Prisma.AccidentResponseWhereInput = {
      id: responseId,
    };

    if (userPayload.ur === CurrentRoles.PARAMEDIC) {
      where.paramedicId = userPayload.sub;
    }

    const response = await this.findIncludeOrThrow(
      where,
      accidentResponseFindOneInclude,
    );

    return {
      success: true,
      data: {
        response,
      },
    };
  }

  async markArrived(userId: string, responseId: string) {
    const where: Prisma.AccidentResponseWhereInput = {
      id: responseId,
      paramedicId: userId,
    };

    const response = await this.findOrThrow(where, {
      id: true,
      responseStatus: true,
      accident: { select: { driverId: true } },
    });

    if (response.responseStatus !== ResponseStatus.DISPATCHED) {
      throw new BadRequestException(
        'accident-responses.INVALID_STATUS_TRANSITION',
      );
    }

    const now = new Date();
    const updatedResponse = await this.prismaService.accidentResponse.update({
      where: { id: responseId },
      data: {
        responseStatus: ResponseStatus.ARRIVED,
        arrivedAt: now,
      },
    });

    await this.notificationService.queueNotification({
      recipientId: response.accident.driverId,
      typeSlug: NotificationSlug.PARAMEDIC_ARRIVED,
      referenceId: response.id,
      referenceTable: 'accident_responses',
    });

    this.logger.log(`response id: ${responseId} marked as arrived`);

    return {
      success: true,
      data: {
        response: updatedResponse,
      },
    };
  }

  async markCompleted(
    userId: string,
    responseId: string,
    dto: CompleteAccidentResponseDto,
  ) {
    const where: Prisma.AccidentResponseWhereInput = {
      id: responseId,
      paramedicId: userId,
    };

    const response = await this.findOrThrow(where, {
      id: true,
      responseStatus: true,
      accidentId: true,
      accident: { select: { driverId: true } },
    });

    if (response.responseStatus !== ResponseStatus.ARRIVED) {
      throw new BadRequestException(
        'accident-responses.MUST_BE_ARRIVED_TO_COMPLETE',
      );
    }

    const now = new Date();
    const [updatedResponse] = await this.prismaService.$transaction([
      this.prismaService.accidentResponse.update({
        where: { id: responseId },
        data: {
          responseStatus: ResponseStatus.COMPLETED,
          completedAt: now,
          patientStatus: dto.patientStatus,
          paramedicObservations: dto.paramedicObservations,
          transportingToHospital: dto.transportingToHospital,
        },
      }),
      this.prismaService.accident.update({
        where: { id: response.accidentId },
        data: {
          status: AccidentStatus.COMPLETED,
        },
      }),
      this.prismaService.paramedic.update({
        where: { id: userId },
        data: {
          status: ParamedicStatus.AVAILABLE,
        },
      }),
    ]);

    await this.notificationService.queueNotification({
      recipientId: response.accident.driverId,
      typeSlug: NotificationSlug.ACCIDENT_COMPLETED,
      referenceId: response.accidentId,
      referenceTable: 'accidents',
    });

    this.logger.log(`response id: ${responseId} marked as completed`);

    return {
      success: true,
      data: {
        response: updatedResponse,
      },
    };
  }

  // ================= helper methods =================

  async findOrThrow<T extends Prisma.AccidentResponseSelect | undefined>(
    where: Prisma.AccidentResponseWhereInput,
    select?: T,
  ) {
    try {
      return (await this.prismaService.accidentResponse.findFirstOrThrow({
        where,
        select,
      })) as Prisma.AccidentResponseGetPayload<{ select: T }>;
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      )
        throw new NotFoundException('accident-responses.RESPONSE_NOT_FOUND');
      throw error;
    }
  }

  async findIncludeOrThrow<
    T extends Prisma.AccidentResponseInclude | undefined,
  >(where: Prisma.AccidentResponseWhereInput, include?: T) {
    try {
      return (await this.prismaService.accidentResponse.findFirstOrThrow({
        where,
        include,
      })) as Prisma.AccidentResponseGetPayload<{ include: T }>;
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      )
        throw new NotFoundException('accident-responses.RESPONSE_NOT_FOUND');
      throw error;
    }
  }
}
