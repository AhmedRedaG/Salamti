import { Module } from '@nestjs/common';
import { TaskSchedulerService } from './task-scheduler.service';
import { AuthModule } from '../../modules/auth/auth.module';
import { BullModule } from '@nestjs/bullmq';
import { QueueNames } from '../../types/queue.types';
import { TaskSchedulerWorker } from './task-scheduler.worker';
import { NotificationModule } from '../../modules/notification/notification.module';

@Module({
  imports: [
    AuthModule,
    NotificationModule,
    BullModule.registerQueue({
      name: QueueNames.TASK_SCHEDULER,
    }),
  ],
  providers: [TaskSchedulerService, TaskSchedulerWorker],
  exports: [TaskSchedulerService],
})
export class TaskSchedulerModule {}
