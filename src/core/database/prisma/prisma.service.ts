import { Injectable, Logger } from '@nestjs/common';
import { PrismaClient } from '../../../../generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

@Injectable()
export class PrismaService extends PrismaClient {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    const pool = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
    super({
      adapter: pool,
      // to exclude passwordHash field globally
      omit: {
        user: {
          passwordHash: true,
        },
      },
    } as const);
  }
  async onModuleInit() {
    await this.$connect();
    this.logger.log('database connected');
  }
  async onModuleDestroy() {
    await this.$disconnect();
    this.logger.log('database disconnected');
  }
}
