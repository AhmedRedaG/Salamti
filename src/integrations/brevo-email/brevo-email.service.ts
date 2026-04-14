import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BrevoClient } from '@getbrevo/brevo';
import { BrevoMailOptions } from '../../types/email-options.types';

@Injectable()
export class BrevoEmailService implements OnModuleInit {
  private brevoClient!: BrevoClient;

  constructor(private configService: ConfigService) {}

  async onModuleInit(): Promise<void> {
    await this.initializeBrevoApi();
  }

  async initializeBrevoApi(): Promise<void> {
    try {
      const apiKey = this.configService.get<string>('email.brevoApiKey');
      if (!apiKey) {
        throw new Error('Brevo API Key is missing in configuration');
      }

      this.brevoClient = new BrevoClient({ apiKey });
    } catch (error) {
      throw new Error(`failed to initialize Brevo API: ${error}`);
    }
  }

  async sendMail(mailOptions: BrevoMailOptions): Promise<any> {
    if (!this.brevoClient) {
      throw new Error('Brevo API not initialized');
    }
    return await this.brevoClient.transactionalEmails.sendTransacEmail(
      mailOptions as any,
    );
  }
}
