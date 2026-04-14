import 'dotenv/config';
import { defineConfig, env } from 'prisma/config';

export default defineConfig({
  schema: './src/core/database/prisma/schema.prisma',
  migrations: {
    path: './src/core/database/migrations',
    seed: 'tsx src/core/database/seeds/seed.ts',
  },
  datasource: {
    url: env('DATABASE_URL'),
  },
});
