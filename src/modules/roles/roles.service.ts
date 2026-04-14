import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../core/database/prisma/prisma.service';
import {
  RoleGetPayload,
  RoleSelect,
  RoleWhereInput,
} from '../../../generated/prisma/models';

@Injectable()
export class RolesService {
  private readonly logger = new Logger(RolesService.name);

  constructor(private readonly prismaService: PrismaService) {}

  async findAll() {
    const roles = await this.prismaService.role.findMany();
    return { success: true, data: { roles } };
  }

  async findOne(id: string) {
    const role = await this.findOrThrow(
      { id },
      {
        id: true,
        name: true,
        canAccessWeb: true,
        description: true,
        isActive: true,
        createdAt: true,
        users: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
            image: true,
          },
        },
      },
    );
    return { success: true, data: { role } };
  }

  async findOrThrow<T extends RoleSelect | undefined>(
    where: RoleWhereInput,
    select?: T,
  ) {
    try {
      return (await this.prismaService.role.findFirstOrThrow({
        where,
        select,
      })) as RoleGetPayload<{ select: T }>;
    } catch {
      throw new NotFoundException('role.ROLE_NOT_FOUND');
    }
  }
}
