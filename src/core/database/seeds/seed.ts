import { PrismaClient } from '../../../../generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { seedUsers } from './data/user.seed';
import { seedRoles } from './data/role.seed';
import { seedNotificationTypes } from './data/notification-type.seed';

const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: process.env.DATABASE_URL,
  }),
});

async function main() {
  console.log('--- Starting Global Seed ---');

  await seedNotificationTypes(prisma);
  await seedRoles(prisma);
  await seedUsers(prisma);

  console.log('--- Seeding Completed Successfully ---');
}

main()
  .catch((e) => {
    console.error('Seed Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
