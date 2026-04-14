import { NotificationSlug } from '../../generated/prisma/enums';

export interface FirebaseNotificationPayload {
  title: string;
  body: string;
  data?: Record<string, string>;
}

export interface SendNotificationPayload {
  recipientId: string;
  actorId?: string;
  typeSlug: NotificationSlug;
  referenceId?: string;
  referenceTable?: string;
  variables?: Record<string, string | number>;
}
