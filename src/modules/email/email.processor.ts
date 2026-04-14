import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { BrevoEmailService } from '../../integrations/brevo-email/brevo-email.service';
import { BrevoMailOptions } from '../../types/email-options.types';
import { Logger } from '@nestjs/common';
import { QueueNames } from '../../types/queue.types';

@Processor(QueueNames.EMAIL)
export class EmailProcessor extends WorkerHost {
  private readonly logger = new Logger(EmailProcessor.name);

  constructor(private readonly brevoEmailService: BrevoEmailService) {
    super();
  }

  async process(job: Job<BrevoMailOptions, any, string>): Promise<any> {
    this.logger.log(`processing email job ${job.id} of type ${job.name}...`);

    switch (job.name) {
      case 'sendMail': {
        try {
          const result = await this.brevoEmailService.sendMail(job.data);
          this.logger.log(`successfully sent email job ${job.id}`);
          return result;
        } catch (error) {
          this.logger.error(`failed to send email job ${job.id}: ${error}`);
          throw error;
        }
      }
      default: {
        this.logger.warn(`unknown job name: ${job.name}`);
      }
    }
  }
}
