import {
  NotificationPriority,
  NotificationSlug,
  PrismaClient,
} from '../../../../../generated/prisma/client';

export async function seedNotificationTypes(prisma: PrismaClient) {
  console.log('🔔 Seeding Notification Types...');

  await prisma.notificationType.createMany({
    data: [
      {
        slug: NotificationSlug.NEW_LOGIN_DETECTED,
        title: 'New Login Detected',
        template:
          'A new login was detected on your account from {{platform}} at {{time}} with ip {{ip_address}}.',
        priority: NotificationPriority.HIGH,
      },
      {
        slug: NotificationSlug.PASSWORD_CHANGED,
        title: 'Password Changed',
        template:
          "Your account password was successfully changed. If this wasn't you, contact admin.",
        priority: NotificationPriority.URGENT,
      },
    ],
    skipDuplicates: true,
  });

  console.log('✅ Notification Types seeded successfully.');
}
