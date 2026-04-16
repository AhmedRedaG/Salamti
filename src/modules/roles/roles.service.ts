import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../core/database/prisma/prisma.service';
import { roleFindOneSelect } from './constant/roles.constant';
import { Prisma } from '../../../generated/prisma/client';

@Injectable()
export class RolesService {
  private readonly logger = new Logger(RolesService.name);

  constructor(private readonly prismaService: PrismaService) {}

  async findAll() {
    const roles = await this.prismaService.role.findMany();
    return { success: true, data: { roles } };
  }

  async findOne(id: string) {
    const role = await this.findOrThrow({ id }, roleFindOneSelect);
    return { success: true, data: { role } };
  }

  async findOrThrow<T extends Prisma.RoleSelect | undefined>(
    where: Prisma.RoleWhereInput,
    select?: T,
  ) {
    try {
      return (await this.prismaService.role.findFirstOrThrow({
        where,
        select,
      })) as Prisma.RoleGetPayload<{ select: T }>;
    } catch {
      throw new NotFoundException('role.ROLE_NOT_FOUND');
    }
  }
}
