import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { QueueNames } from '../../types/queue.types';
import { PrismaService } from '../../core/database/prisma/prisma.service';
import { FirebaseNotificationService } from '../../integrations/firebase-notification/firebase-notification.service';
import {
  FirebaseNotificationPayload,
  SendNotificationPayload,
} from '../../types/notification.types';
import { UsersService } from '../users/users.service';

@Processor(QueueNames.NOTIFICATION)
export class NotificationWorker extends WorkerHost {
  private readonly logger = new Logger(NotificationWorker.name);

  constructor(
    private readonly prismaService: PrismaService,
    private readonly firebaseNotificationService: FirebaseNotificationService,
    private readonly usersService: UsersService,
  ) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    this.logger.log(`processing notification job: ${job.id}`);

    const {
      recipientId,
      actorId,
      typeSlug,
      referenceId,
      referenceTable,
      variables,
    } = job.data as SendNotificationPayload;

    try {
      // fetch Notification Type Config
      const notificationType =
        await this.prismaService.notificationType.findUnique({
          where: { slug: typeSlug },
        });

      if (!notificationType) {
        this.logger.warn(`notification type slug '${typeSlug}' not found.`);
        return;
      }

      // fetch Recipient details with session details
      const recipient = await this.usersService.findOrThrow(
        {
          id: recipientId,
        },
        {
          userSessions: {
            select: { deviceToken: true, expiresAt: true },
          },
        },
      );

      // filter tokens depends on the session is active
      const now = new Date();
      const activeDeviceTokens: string[] = [];
      if (recipient?.userSessions) {
        for (const session of recipient.userSessions) {
          if (session.deviceToken && session.expiresAt > now) {
            activeDeviceTokens.push(session.deviceToken);
          }
        }
      }

      // evaluate templates (interpolate `variables` into the templates)
      const evaluateTemplate = (template: string, vars: any = {}) => {
        if (!template) return '';
        return template.replace(/{{(.*?)}}/g, (match, key) => {
          return vars[key.trim()] !== undefined
            ? String(vars[key.trim()])
            : match;
        });
      };
      const finalBody = evaluateTemplate(
        notificationType.template || '',
        variables,
      );

      // save to db
      const notification = await this.prismaService.notification.create({
        data: {
          recipientId,
          actorId,
          typeId: notificationType.id,
          referenceId,
          referenceTable,
          titleSnapshot: notificationType.title,
          bodySnapshot: finalBody,
        },
      });

      // push to firebase active tokens
      if (activeDeviceTokens.length > 0) {
        const payload: FirebaseNotificationPayload = {
          title: notificationType.title || 'Notification',
          body: finalBody || '',
          data: {
            slug: typeSlug,
            referenceId: referenceId || '',
            notificationId: notification.id,
          },
        };

        try {
          await this.firebaseNotificationService.sendToMultipleDevices(
            activeDeviceTokens,
            payload,
          );
        } catch (firebaseErr: any) {
          this.logger.error(
            `failed pushing notifications for recipient ${recipientId}`,
            firebaseErr.stack,
          );
        }
      }

      if (activeDeviceTokens.length === 0) {
        this.logger.log(`no active device tokens for recipient ${recipientId}`);
      }

      this.logger.log(`completed notification job: ${job.id}`);
    } catch (error: any) {
      this.logger.error(
        `error processing notification job ${job.id}`,
        error.stack,
      );
      throw error;
    }
  }
}
