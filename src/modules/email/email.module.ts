import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { EmailService } from './email.service';
import { EmailProcessor } from './email.processor';
import { VerifyAccountMail } from './content/verify.content';
import { ResetPasswordMail } from './content/reset.content';
import { EmergencyAlertMail } from './content/emergency.content';
import { BrevoEmailService } from '../../integrations/brevo-email/brevo-email.service';
import { QueueNames } from '../../types/queue.types';

@Module({
  imports: [
    BullModule.registerQueue({
      name: QueueNames.EMAIL,
    }),
  ],
  providers: [
    EmailService,
    EmailProcessor,
    VerifyAccountMail,
    ResetPasswordMail,
    EmergencyAlertMail,
    BrevoEmailService,
  ],
  exports: [EmailService],
})
export class EmailModule {}
