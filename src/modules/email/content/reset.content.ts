import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  BrevoMailOptions,
  CreateResetMailData,
} from '../../../types/email-options.types';

@Injectable()
export class ResetPasswordMail {
  constructor(private configService: ConfigService) {}

  createMail(mailData: CreateResetMailData): BrevoMailOptions {
    const senderEmail = this.configService.get<string>('email.senderEmail')!;
    const supportEmail = this.configService.get<string>('email.supportEmail')!;
    const companyName = this.configService.get<string>('company.name')!;
    const firstName = mailData.fullName.split(' ')[0] || 'there';
    const userMail = mailData.email;
    const otp = mailData.code;
    const expiresInMS = this.configService.get<number>('otp.expiresInMS')!;
    const expiresInMinutes = Math.ceil(expiresInMS / 60000);

    return {
      sender: {
        email: senderEmail,
        name: companyName,
      },
      to: [{ email: userMail, name: firstName }],
      subject: `Your ${companyName} Password Reset Code`,
      textContent: this.generatePlainTextContent(
        supportEmail,
        companyName,
        firstName,
        otp,
        expiresInMinutes,
      ),
      htmlContent: this.generateHtmlContent(
        supportEmail,
        companyName,
        firstName,
        otp,
        expiresInMinutes,
      ),
    };
  }

  private generatePlainTextContent(
    supportEmail: string,
    companyName: string,
    firstName: string,
    otp: number,
    expiresInMinutes: number,
  ) {
    return `
Hi ${firstName},

We received a request to reset your password for your ${companyName} account.

Use this one-time code to reset your password:
${otp}

This code will expire in ${expiresInMinutes} minutes. If you did not request this, please ignore this email.

Thanks,  
The ${companyName} Team  

Need help? Contact us at ${supportEmail}`;
  }

  private generateHtmlContent(
    supportEmail: string,
    companyName: string,
    firstName: string,
    otp: number,
    expiresInMinutes: number,
  ) {
    return `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 30px; border: 1px solid #e0e0e0; border-radius: 10px; background-color: #f9f9f9;">
  <h2 style="text-align: center; color: #333;">Reset Your Password</h2>
  
  <p style="font-size: 16px; color: #555;">
    Hi <strong>${firstName}</strong>,
  </p>
  
  <p style="font-size: 16px; color: #555;">
    Use the following one-time code to reset your password:
  </p>

  <div style="text-align: center; margin: 24px 0;">
    <div style="display: inline-block; letter-spacing: 4px; font-size: 28px; font-weight: 700; padding: 12px 20px; border-radius: 8px; background-color: #111827; color: #ffffff;">
      ${otp}
    </div>
  </div>

  <p style="font-size: 14px; color: #555; text-align: center;">
    This code expires in <strong>${expiresInMinutes} minutes</strong>.
  </p>

  <p style="font-size: 12px; color: #888; text-align: center;">
    If you didn't request a password reset, you can safely ignore this email.
  </p>

  <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
  
  <p style="font-size: 12px; color: #aaa; text-align: center;">
    © ${new Date().getFullYear()} ${companyName}. All rights reserved.<br>
    Need help? Contact us at <a href="mailto:${supportEmail}" style="color: #888;">${supportEmail}</a>
  </p>
</div>`;
  }
}
