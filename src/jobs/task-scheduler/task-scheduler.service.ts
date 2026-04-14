import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { QueueNames } from '../../types/queue.types';
import { TaskSchedulerJobs } from '../../types/task-scheduler.types';

@Injectable()
export class TaskSchedulerService {
  private readonly logger = new Logger(TaskSchedulerService.name);

  constructor(
    @InjectQueue(QueueNames.TASK_SCHEDULER)
    private readonly taskSchedulerQueue: Queue,
  ) {}

  @Cron('0 30 2 * * *', { timeZone: 'Africa/Cairo' })
  async handleCleanExpiredUsersSessions() {
    await this.enqueue(TaskSchedulerJobs.CLEAN_EXPIRED_SESSIONS);
  }

  @Cron('0 0 3 * * *', { timeZone: 'Africa/Cairo' })
  async handleCleanExpiredOtps() {
    await this.enqueue(TaskSchedulerJobs.CLEAN_EXPIRED_OTPS);
  }

  @Cron('0 0 4 * * *', { timeZone: 'Africa/Cairo' })
  async handleCleanOldNotifications() {
    await this.enqueue(TaskSchedulerJobs.CLEAN_OLD_NOTIFICATIONS);
  }

  private async enqueue(jobName: TaskSchedulerJobs) {
    const today = new Date().toISOString().slice(0, 10);
    this.logger.log(`scheduling job: ${jobName}`);
    await this.taskSchedulerQueue.add(
      jobName,
      {},
      { jobId: `${jobName}-${today}` }, // prevents duplicate runs on restart
    );
  }
}
