import { Module, forwardRef } from '@nestjs/common';
import { AccidentsService } from './accidents.service';
import { AccidentsController } from './accidents.controller';
import { BullModule } from '@nestjs/bullmq';
import { QueueNames } from '../../types/queue.types';
import { AccidentWorker } from './accidents.worker';
import { DispatchModule } from '../dispatch/dispatch.module';
import { ObusModule } from '../obus/obus.module';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [
    BullModule.registerQueue({
      name: QueueNames.ACCIDENT,
    }),
    forwardRef(() => DispatchModule),
    forwardRef(() => ObusModule),
    NotificationModule,
  ],
  controllers: [AccidentsController],
  providers: [AccidentsService, AccidentWorker],
  exports: [AccidentsService],
})
export class AccidentsModule {}
