import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { QueueNames } from '../../types/queue.types';
import { TaskSchedulerJobs } from '../../types/task-scheduler.types';
import { AuthHelperService } from '../../modules/auth/auth-helper.service';
import { NotificationService } from '../../modules/notification/notification.service';

@Processor(QueueNames.TASK_SCHEDULER)
export class TaskSchedulerWorker extends WorkerHost {
  private readonly logger = new Logger(TaskSchedulerWorker.name);

  constructor(
    private readonly authHelperService: AuthHelperService,
    private readonly notificationsService: NotificationService,
  ) {
    super();
  }

  async process(
    job: Job<Record<string, never>, void, TaskSchedulerJobs>,
  ): Promise<void> {
    const handlers: Record<TaskSchedulerJobs, () => Promise<void>> = {
      [TaskSchedulerJobs.CLEAN_EXPIRED_SESSIONS]: () =>
        this.authHelperService.cleanExpiredUsersSessions(),
      [TaskSchedulerJobs.CLEAN_EXPIRED_OTPS]: () =>
        this.authHelperService.cleanExpiredOtps(),
      [TaskSchedulerJobs.CLEAN_OLD_NOTIFICATIONS]: () =>
        this.notificationsService.cleanOldNotifications(),
    };

    const handler = handlers[job.name];

    if (!handler) {
      this.logger.warn(`no handler found for job: ${job.name}`);
      return;
    }

    await this.runTask(job.name, handler);
  }

  private async runTask(
    name: TaskSchedulerJobs,
    task: () => Promise<void>,
  ): Promise<void> {
    this.logger.log(`starting scheduled task: ${name}`);
    const startTime = Date.now();
    try {
      await task();
      this.logger.log(
        `completed: ${name} — duration: ${Date.now() - startTime}ms`,
      );
    } catch (error: unknown) {
      this.logger.error(
        `failed: ${name}`,
        error instanceof Error ? error.stack : error,
      );
      throw error;
    }
  }
}
