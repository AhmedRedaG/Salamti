import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { initializeApp, cert, getApps, getApp, App } from 'firebase-admin/app';
import {
  getMessaging,
  Messaging,
  Message,
  MulticastMessage,
} from 'firebase-admin/messaging';
import { FirebaseNotificationPayload } from '../../types/notification.types';

@Injectable()
export class FirebaseNotificationService implements OnModuleInit {
  private readonly logger = new Logger(FirebaseNotificationService.name);
  private messaging!: Messaging;

  constructor(private readonly configService: ConfigService) {}

  onModuleInit(): void {
    this.messaging = getMessaging(this.initializeApp());
    this.logger.log('firebase messaging initialized');
  }

  private initializeApp(): App {
    if (getApps().length > 0) return getApp();

    const projectId = this.getRequiredConfig('firebase.projectId');
    const clientEmail = this.getRequiredConfig('firebase.clientEmail');
    const privateKey = this.parsePrivateKey(
      this.getRequiredConfig('firebase.privateKey'),
    );

    return initializeApp({
      credential: cert({ projectId, clientEmail, privateKey }),
    });
  }

  private getRequiredConfig(key: string): string {
    const value = this.configService.get<string>(key);
    if (!value) throw new Error(`Missing required Firebase config: "${key}"`);
    return value;
  }

  private parsePrivateKey(raw: string): string {
    // handles both escaped \\n (env vars) and literal \n (file-based secrets)
    return raw.replace(/\\\\n/g, '\n').replace(/\\n/g, '\n');
  }

  private buildSingleMessage(
    token: string,
    payload: FirebaseNotificationPayload,
  ): Message {
    const { title, body, data = {} } = payload;

    return {
      token,
      notification: { title, body },
      data,
      android: {
        priority: 'high' as const,
        ttl: 1000 * 60 * 60 * 24 * 7, // 7 days in seconds
        notification: {
          sound: 'default',
          channelId: 'default',
        },
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: 1,
          },
        },
      },
    };
  }

  async sendToDevice(token: string, payload: FirebaseNotificationPayload) {
    const message = this.buildSingleMessage(token, payload);
    await this.messaging.send(message);
  }

  private buildMulticastMessage(
    tokens: string[],
    payload: FirebaseNotificationPayload,
  ): MulticastMessage {
    const { title, body, data = {} } = payload;

    return {
      tokens,
      notification: { title, body },
      data,
      android: {
        priority: 'high' as const,
        ttl: 1000 * 60 * 60 * 24 * 7, // 7 days in seconds
        notification: {
          sound: 'default',
          channelId: 'default',
        },
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: 1,
          },
        },
      },
    };
  }

  async sendToMultipleDevices(
    tokens: string[],
    payload: FirebaseNotificationPayload,
  ): Promise<void> {
    const message = this.buildMulticastMessage(tokens, payload);
    const response = await this.messaging.sendEachForMulticast(message);

    response.responses.forEach((res, idx) => {
      if (!res.success) {
        this.logger.warn(
          `failed pushing to token ${tokens[idx]}`,
          res.error?.stack,
        );
      }
    });
  }
}
