import { forwardRef, Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { QueueNames } from '../../types/queue.types';
import { FirebaseNotificationModule } from '../../integrations/firebase-notification/firebase-notification.module';
import { NotificationController } from './notification.controller';
import { NotificationService } from './notification.service';
import { NotificationWorker } from './notification.worker';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    FirebaseNotificationModule,
    forwardRef(() => UsersModule),
    BullModule.registerQueue({
      name: QueueNames.NOTIFICATION,
    }),
  ],
  controllers: [NotificationController],
  providers: [NotificationService, NotificationWorker],
  exports: [NotificationService],
})
export class NotificationModule {}
