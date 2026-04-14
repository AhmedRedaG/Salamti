import {
  CurrentRoles,
  PrismaClient,
} from '../../../../../generated/prisma/client';

export async function seedUsers(prisma: PrismaClient) {
  console.log('👤 Seeding Admin User...');

  const adminFullName = 'Ahmed Reda';
  const adminEmail = 'ahmedfarok2@gmail.com';
  const adminPhone = '+201014821864';
  const adminPasswordHash =
    '$2a$12$eCoW9FoAJmGB084KpX56jufJvevgV6sr7J7f3mZabT.MsAbY.cXb6';
  const adminInstitution = 'Central System Manager';

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      fullName: adminFullName,
      phone: adminPhone,
      email: adminEmail,
    },
    create: {
      fullName: adminFullName,
      email: adminEmail,
      phone: adminPhone,
      // [PASSWORD]: New#01000000001
      passwordHash: adminPasswordHash,
      isActive: true,

      role: {
        connect: { name: CurrentRoles.ADMIN },
      },

      authAttempts: {
        create: {},
      },

      admin: {
        create: {
          institution: adminInstitution,
        },
      },
    },
  });

  console.log('✅ Admin User seeded successfully.');
}
