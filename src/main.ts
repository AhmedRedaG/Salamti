process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception: ');
  console.error({
    timestamp: new Date().toISOString(),
    level: 'fatal',
    pid: process.pid,
    msg: error?.message || 'unknown error',
    stack: error,
  });
});

process.on('unhandledRejection', (error: any) => {
  console.error('Unhandled Rejection: ');
  console.error({
    timestamp: new Date().toISOString(),
    level: 'fatal',
    pid: process.pid,
    msg: error?.message || 'unknown error',
    stack: error,
  });
});

import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import helmet from 'helmet';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import { Logger } from 'nestjs-pino';
import { Request, Response } from 'express';
import { join } from 'node:path';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true,
  });

  app.useLogger(app.get(Logger));
  app.flushLogs();

  // attach and start MQTT microservice
  // note that iam not using TLS because my obu network module doesn't support it
  // and its processing power is limited to apply encryption on the data
  // in real world app i will use private mqtt with TLS
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.MQTT,
    options: {
      url: `mqtt://${process.env.MQTT_HOST}:${process.env.MQTT_PORT}`,
      subscribeOptions: { qos: 1 },
    },
  });
  await app.startAllMicroservices();

  // set view engine
  app.setBaseViewsDir(join(__dirname, '..', 'views'));
  app.setViewEngine('ejs');

  // trust first proxy to get real client IP
  app.set('trust proxy', 1);

  app.use(cookieParser());
  app.use(compression());
  app.use(helmet());

  app.enableCors({
    origin: ['https://salamti.com'],
    methods: 'GET,POST,PUT,PATCH,DELETE',
    credentials: true,
  });

  app.enableShutdownHooks();

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  // add health check endpoint
  app.use('/health', (req: Request, res: Response) => {
    return res.json({
      success: true,
      data: {
        status: 'ok',
        time: new Date().toISOString(),
        env: process.env.NODE_ENV,
      },
    });
  });
  // ignore favicon requests
  app.use(
    ['/favicon.ico', '/favicon.png', '/robots.txt'],
    (req: Request, res: Response) => res.status(204).end(),
  );

  app.setGlobalPrefix('api', {
    // this affects pino logger (when used no get requests logged) ????
    // exclude: [{ path: '/', method: RequestMethod.GET }],
  });
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  await app.listen(process.env.PORT ?? 3000);
}

bootstrap().catch((error) => {
  console.error({
    timestamp: new Date().toISOString(),
    level: 'fatal',
    pid: process.pid,
    msg: error?.message,
    stack: error,
  });
  process.exit(1);
});
