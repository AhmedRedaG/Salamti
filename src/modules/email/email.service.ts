import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { VerifyAccountMail } from './content/verify.content';
import { ResetPasswordMail } from './content/reset.content';
import {
  BrevoMailOptions,
  CreateResetMailData,
  CreateVerifyMailData,
} from '../../types/email-options.types';

@Injectable()
export class EmailService {
  constructor(
    @InjectQueue('email') private emailQueue: Queue,
    private verifyAccountMail: VerifyAccountMail,
    private resetPasswordMail: ResetPasswordMail,
  ) {}

  async sendVerifyTokenMail(mailData: CreateVerifyMailData): Promise<any> {
    const mailOptions: BrevoMailOptions =
      this.verifyAccountMail.createMail(mailData);

    return await this.emailQueue.add('sendMail', mailOptions);
  }

  async sendResetOtpMail(mailData: CreateResetMailData): Promise<any> {
    const mailOptions: BrevoMailOptions =
      this.resetPasswordMail.createMail(mailData);

    return await this.emailQueue.add('sendMail', mailOptions);
  }
}
