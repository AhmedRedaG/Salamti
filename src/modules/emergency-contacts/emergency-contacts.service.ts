import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { CreateEmergencyContactDto } from './dto/create-emergency-contact.dto';
import { UpdateEmergencyContactDto } from './dto/update-emergency-contact.dto';
import { PrismaService } from '../../core/database/prisma/prisma.service';
import { getPaginationParams } from '../../common/utils/pagination.utils';
import { PaginationQueryFilter } from '../../common/filters/pagination-query.filter';
import { EmergencyContactFindOptionsQueryFilter } from './filter/emergency-contacts-find-options-query-filter';
import { JwtPayload } from '../../types/auth.types';
import { CurrentRoles } from '../../../generated/prisma/enums';
import { Prisma } from '../../../generated/prisma/client';
import { emergencyContactFindOneInclude } from './constant/emergency-contacts.constant';

@Injectable()
export class EmergencyContactsService {
  private readonly logger = new Logger(EmergencyContactsService.name);

  constructor(private readonly prismaService: PrismaService) {}

  async create(userId: string, dto: CreateEmergencyContactDto) {
    // check if the contact already exists
    await this.checkConflict(userId, dto.email, dto.phone);

    const contact = await this.prismaService.emergencyContact.create({
      data: {
        driverId: userId,
        ...dto,
      },
    });

    this.logger.log(
      `create emergency contact id: ${contact.id} driverId: ${userId}`,
    );

    return {
      success: true,
      data: {
        contact,
      },
    };
  }

  async findAll(
    userPayload: JwtPayload,
    pagination: PaginationQueryFilter,
    findOptions: EmergencyContactFindOptionsQueryFilter,
  ) {
    const { page, limit, offset } = getPaginationParams(
      pagination.page,
      pagination.limit,
    );

    const {
      driverId,
      relationship,
      search,
      orderBy,
      orderDirection,
      autoNotify,
      instantSms,
      voiceCall,
    } = findOptions;

    const where: Prisma.EmergencyContactWhereInput = {
      driverId,
      relationship,
      ...(autoNotify !== undefined && { autoNotify }),
      ...(instantSms !== undefined && { instantSms }),
      ...(voiceCall !== undefined && { voiceCall }),
    };

    // if the user is a driver only get their contacts
    // (Iam filtering roles that can access in the controller so i dont need to check here)
    if (userPayload.ur === CurrentRoles.DRIVER) {
      where.driverId = userPayload.sub;
    }

    if (search) {
      where.OR = [
        { phone: { contains: search, mode: 'insensitive' } },
        { fullName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (!(orderBy in Prisma.EmergencyContactScalarFieldEnum)) {
      throw new BadRequestException('emergency-contacts.INVALID_ORDERBY_FIELD');
    }

    const [contacts, total] = await this.prismaService.$transaction([
      this.prismaService.emergencyContact.findMany({
        where,
        skip: offset,
        take: limit,
        orderBy: { [orderBy]: orderDirection },
      }),
      this.prismaService.emergencyContact.count({ where }),
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
        contacts,
      },
    };
  }

  async findOne(userPayload: JwtPayload, contactId: string) {
    const where: Prisma.EmergencyContactWhereInput = {
      id: contactId,
    };

    // if the user is a driver only get their contacts
    if (userPayload.ur === CurrentRoles.DRIVER) {
      where.driverId = userPayload.sub;
    }

    const contact = await this.findIncludeOrThrow(
      where,
      emergencyContactFindOneInclude,
    );

    return {
      success: true,
      data: {
        contact,
      },
    };
  }

  async update(
    userId: string,
    contactId: string,
    dto: UpdateEmergencyContactDto,
  ) {
    const contact = await this.findOrThrow(
      { id: contactId, driverId: userId },
      { email: true, phone: true },
    );

    // check unique constraint
    if (
      (dto.email && dto.email !== contact.email) ||
      (dto.phone && dto.phone !== contact.phone)
    ) {
      const emailToCheck = dto.email || contact.email;
      const phoneToCheck = dto.phone || contact.phone;

      await this.checkConflict(userId, emailToCheck, phoneToCheck);
    }

    const updatedContact = await this.prismaService.emergencyContact.update({
      where: { id: contactId },
      data: dto,
    });

    this.logger.log(
      `updated emergency contact id: ${contactId} data: ${JSON.stringify(dto)}`,
    );

    return {
      success: true,
      data: {
        contact: updatedContact,
      },
    };
  }

  async remove(userId: string, contactId: string) {
    await this.findOrThrow({ id: contactId, driverId: userId }, { id: true });

    await this.prismaService.emergencyContact.delete({
      where: { id: contactId },
    });

    this.logger.log(`deleted emergency contact id: ${contactId}`);

    return {
      success: true,
    };
  }

  // ================= helper methods =================

  async checkConflict(driverId: string, email: string, phone: string) {
    const existingContact =
      await this.prismaService.emergencyContact.findUnique({
        where: {
          driverId_email_phone: {
            driverId,
            email,
            phone,
          },
        },
      });
    if (existingContact) {
      throw new ConflictException('emergency-contacts.CONTACT_ALREADY_EXISTS');
    }
  }

  async findOrThrow<T extends Prisma.EmergencyContactSelect | undefined>(
    where: Prisma.EmergencyContactWhereInput,
    select?: T,
  ) {
    try {
      return (await this.prismaService.emergencyContact.findFirstOrThrow({
        where,
        select,
      })) as Prisma.EmergencyContactGetPayload<{ select: T }>;
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      )
        throw new NotFoundException('emergency-contacts.CONTACT_NOT_FOUND');
      throw error;
    }
  }

  async findIncludeOrThrow<
    T extends Prisma.EmergencyContactInclude | undefined,
  >(where: Prisma.EmergencyContactWhereInput, include?: T) {
    try {
      return (await this.prismaService.emergencyContact.findFirstOrThrow({
        where,
        include,
      })) as Prisma.EmergencyContactGetPayload<{ include: T }>;
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      )
        throw new NotFoundException('emergency-contacts.CONTACT_NOT_FOUND');
      throw error;
    }
  }
}
