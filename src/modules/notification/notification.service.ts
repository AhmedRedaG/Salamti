import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../core/database/prisma/prisma.service';
import { PaginationQueryFilter } from '../../common/filters/pagination-query.filter';
import { getPaginationParams } from '../../common/utils/pagination.utils';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { QueueNames } from '../../types/queue.types';
import { SendNotificationPayload } from '../../types/notification.types';
import { NotificationWhereInput } from '../../../generated/prisma/models';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue(QueueNames.NOTIFICATION) private notificationQueue: Queue,
  ) {}

  async queueNotification(payload: SendNotificationPayload): Promise<void> {
    const job = await this.notificationQueue.add('sendNotification', payload);

    this.logger.log(
      `queued notification job ${job.id} for recipient ${payload.recipientId}`,
    );
  }

  async getNotificationsForUser(
    userId: string,
    inPagination: PaginationQueryFilter,
    unreadOnly: boolean,
  ) {
    const { page, limit, offset } = getPaginationParams(
      inPagination.page,
      inPagination.limit,
    );

    const where: NotificationWhereInput = {
      recipientId: userId,
      isRead: unreadOnly ? false : undefined,
    };

    const [notifications, totalCount] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit,
      }),
      this.prisma.notification.count({ where }),
    ]);

    const pagination = {
      page,
      limit,
      total: totalCount,
      pages: Math.ceil(totalCount / limit),
    };

    return {
      success: true,
      data: {
        pagination,
        notifications,
      },
    };
  }

  async getUnreadCount(userId: string) {
    const unreadCount = await this.prisma.notification.count({
      where: {
        recipientId: userId,
        isRead: false,
      },
    });

    return { success: true, data: { count: unreadCount } };
  }

  async markAsRead(userId: string, notificationId: string) {
    const notification = await this.prisma.notification.findUnique({
      where: { id: notificationId, recipientId: userId },
    });
    if (!notification) {
      throw new NotFoundException('notifications.NOTIFICATION_NOT_FOUND');
    }

    if (notification.isRead) {
      return { success: true, data: { notification } };
    }

    const updated = await this.prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true, readAt: new Date() },
    });

    return { success: true, data: { notification: updated } };
  }

  async markAllAsRead(userId: string) {
    await this.prisma.notification.updateMany({
      where: { recipientId: userId, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });

    return { success: true };
  }

  async cleanOldNotifications() {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const result = await this.prisma.notification.deleteMany({
      where: {
        createdAt: { lt: thirtyDaysAgo },
      },
    });

    this.logger.log(`cleaned ${result.count} old notifications`);
  }
}
