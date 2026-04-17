import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AuthModule } from './modules/auth/auth.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UsersModule } from './modules/users/users.module';
import appConfig from './config/app.config';
import { PrismaModule } from './core/database/prisma/prisma.module';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { RolesModule } from './modules/roles/roles.module';
import { HttpExceptionFilter } from './common/exceptions-filters/http-exception.filter';
import { UploadModule } from './modules/upload/upload.module';
import { CloudinaryUploadModule } from './integrations/cloudinary-upload/cloudinary-upload.module';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { TaskSchedulerModule } from './jobs/task-scheduler/task-scheduler.module';
import { BullModule } from '@nestjs/bullmq';
import { NotificationModule } from './modules/notification/notification.module';
import { LoggerModule } from 'nestjs-pino';
import { randomUUID } from 'crypto';
import { GoogleAuthModule } from './integrations/google-auth/google-auth.module';
import { EmailModule } from './modules/email/email.module';
import { BrevoEmailModule } from './integrations/brevo-email/brevo-email.module';
import { EmergencyContactsModule } from './modules/emergency-contacts/emergency-contacts.module';
import { VehiclesModule } from './modules/vehicles/vehicles.module';
import { ObusModule } from './modules/obus/obus.module';
import { ParamedicsModule } from './modules/paramedics/paramedics.module';

@Module({
  imports: [
    LoggerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const environment = config.get<string>('NODE_ENV');
        const isDev = environment === 'development';
        return {
          pinoHttp: {
            level: isDev ? 'debug' : 'info',
            genReqId(req: any) {
              const existing = req.headers['x-request-id'];
              if (existing)
                return Array.isArray(existing) ? existing[0] : existing;
              return randomUUID();
            },
            formatters: {
              level: (label: string) => ({ level: label }),
            },
            redact: {
              paths: [
                'req.headers.authorization',
                'req.headers.cookie',
                'req.body.password',
              ],
              censor: '[Redacted]',
            },
            base: {
              pid: process.pid,
              env: environment,
            },
            timestamp: () => `,"time":"${new Date().toISOString()}"`,
            autoLogging: {
              ignore: (req) => req.url === '/health' || req.url === '/metrics',
            },
            customProps: (req: any, res: any) => ({
              userId: req.user?.sub || 'unauthenticated',
              role: req.user?.ur || 'unauthenticated',
              deviceId: req.user?.did || 'unauthenticated',
              responseMessage: res.errorMessage || 'system.REQUEST_COMPLETED',
            }),
            customLogLevel: (req, res, err) => {
              if (res.statusCode >= 500 || err) return 'error';
              if (res.statusCode >= 400) return 'warn';
              return 'info';
            },
            customErrorMessage: (req: any, res: any, error: any) => {
              return res.errorMessage || error.message;
            },
            customSuccessMessage(req: any, res: any, responseTime) {
              if (res.statusCode >= 400) {
                if (Array.isArray(res.errorMessage)) {
                  return res.errorMessage.join(' & ');
                }
                return res.errorMessage;
              }
              return 'Request completed successfully';
            },

            ...(isDev
              ? {
                  transport: {
                    // target: require.resolve('pino-pretty'),
                    target: 'pino-pretty',
                    options: {
                      colorize: true,
                      translateTime: 'SYS:HH:MM:ss.l',
                    },
                  },
                }
              : {}),
          },
        };
      },
    }),

    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        throttlers: [
          {
            name: 'short',
            ttl: config.get<number>('auth.rateLimit.short.windowMs')!,
            limit: config.get<number>('auth.rateLimit.short.maxRequests')!,
          },
          {
            name: 'medium',
            ttl: config.get<number>('auth.rateLimit.medium.windowMs')!,
            limit: config.get<number>('auth.rateLimit.medium.maxRequests')!,
          },
          {
            name: 'long',
            ttl: config.get<number>('auth.rateLimit.long.windowMs')!,
            limit: config.get<number>('auth.rateLimit.long.maxRequests')!,
          },
        ],
      }),
    }),

    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig],
    }),

    ScheduleModule.forRoot(),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        connection: {
          username: config.get<string | undefined>('redis.username'),
          password: config.get<string | undefined>('redis.password'),
          host: config.get<string>('redis.host'),
          port: config.get<number>('redis.port'),
        },
        defaultJobOptions: {
          attempts: config.get<number>('redis.attempts'),
          backoff: {
            type: 'exponential',
            delay: config.get<number>('redis.delay'),
          },
          removeOnComplete: config.get<number | boolean>(
            'redis.removeOnComplete',
          ),
          removeOnFail: config.get<number | boolean>('redis.removeOnFail'),
        },
      }),
    }),

    PrismaModule,
    AuthModule,
    UsersModule,
    RolesModule,
    CloudinaryUploadModule,
    UploadModule,
    TaskSchedulerModule,
    NotificationModule,
    GoogleAuthModule,
    BrevoEmailModule,
    EmailModule,
    EmergencyContactsModule,
    VehiclesModule,
    ObusModule,
    ParamedicsModule,
  ],
  controllers: [AppController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
  ],
})
export class AppModule {}
