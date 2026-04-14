import {
  CurrentRoles,
  PrismaClient,
} from '../../../../../generated/prisma/client';

const rolesData = [
  {
    name: CurrentRoles.ADMIN,
    description: 'Administrator who manages area managers',
    isActive: true,
    canAccessWeb: true,
  },
  {
    name: CurrentRoles.DRIVER,
    description: 'Driver who transports patients',
    isActive: true,
    canAccessWeb: false,
  },
  {
    name: CurrentRoles.PARAMEDIC,
    description: 'Paramedic who provides medical care',
    isActive: true,
    canAccessWeb: false,
  },
];

export async function seedRoles(prisma: PrismaClient) {
  console.log('🔐 Seeding Roles...');

  for (const role of rolesData) {
    await prisma.role.upsert({
      where: { name: role.name },
      update: {
        description: role.description,
        isActive: role.isActive,
        canAccessWeb: role.canAccessWeb,
      },
      create: role,
    });
  }

  console.log('✅ Roles seeded successfully.');
}
