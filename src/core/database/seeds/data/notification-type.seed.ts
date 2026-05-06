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
      {
        slug: NotificationSlug.ACCIDENT_DETECTED,
        title: 'Accident Detected',
        template: 'An accident has been recorded by your OBU unit {{obuInst}}.',
        priority: NotificationPriority.HIGH,
      },
      {
        slug: NotificationSlug.ACCIDENT_CONFIRMED,
        title: 'Accident Confirmed',
        template:
          'Your accident has been confirmed and we are finding a paramedic.',
        priority: NotificationPriority.URGENT,
      },
      {
        slug: NotificationSlug.PARAMEDIC_DISPATCHED,
        title: 'Paramedic Dispatched',
        template:
          'A paramedic has accepted the accident response and is on the way.',
        priority: NotificationPriority.URGENT,
      },
      {
        slug: NotificationSlug.PARAMEDIC_ARRIVED,
        title: 'Paramedic Arrived',
        template: 'The paramedic has arrived at the accident location.',
        priority: NotificationPriority.HIGH,
      },
      {
        slug: NotificationSlug.ACCIDENT_COMPLETED,
        title: 'Accident Completed',
        template: 'Your accident response has been completed.',
        priority: NotificationPriority.NORMAL,
      },
      {
        slug: NotificationSlug.ACCIDENT_CANCELED,
        title: 'Accident Canceled',
        template: 'The accident has been canceled.',
        priority: NotificationPriority.NORMAL,
      },
      {
        slug: NotificationSlug.OBU_CLAIMED,
        title: 'OBU Claimed',
        template: 'You have successfully claimed OBU {{obuInst}}.',
        priority: NotificationPriority.NORMAL,
      },
      {
        slug: NotificationSlug.OBU_CONNECTED,
        title: 'OBU Connected',
        template:
          'OBU {{obuInst}} is now connected to vehicle {{vehicleLicense}}.',
        priority: NotificationPriority.NORMAL,
      },
      {
        slug: NotificationSlug.OBU_DISCONNECTED,
        title: 'OBU Disconnected',
        template: 'OBU {{obuInst}} was disconnected from your vehicle.',
        priority: NotificationPriority.NORMAL,
      },
      {
        slug: NotificationSlug.OBU_ACTIVATED,
        title: 'OBU Activated',
        template: 'OBU {{obuInst}} is now active.',
        priority: NotificationPriority.NORMAL,
      },
      {
        slug: NotificationSlug.OBU_DEACTIVATED,
        title: 'OBU Deactivated',
        template: 'OBU {{obuInst}} has been deactivated.',
        priority: NotificationPriority.NORMAL,
      },
      {
        slug: NotificationSlug.OBU_UPDATED,
        title: 'OBU Updated',
        template: 'Your OBU {{obuInst}} details have been updated.',
        priority: NotificationPriority.LOW,
      },
      {
        slug: NotificationSlug.VEHICLE_CREATED,
        title: 'Vehicle Added',
        template: 'Vehicle {{vehicleLicense}} has been added to your profile.',
        priority: NotificationPriority.NORMAL,
      },
      {
        slug: NotificationSlug.VEHICLE_UPDATED,
        title: 'Vehicle Updated',
        template: 'Vehicle {{vehicleLicense}} details have been updated.',
        priority: NotificationPriority.LOW,
      },
      {
        slug: NotificationSlug.VEHICLE_DELETED,
        title: 'Vehicle Removed',
        template: 'Vehicle {{vehicleLicense}} was removed from your profile.',
        priority: NotificationPriority.NORMAL,
      },
    ],
    skipDuplicates: true,
  });

  console.log('✅ Notification Types seeded successfully.');
}
