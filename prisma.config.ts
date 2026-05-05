import path from 'node:path';
import {loadEnvFile} from 'node:process';
import {defineConfig, env} from 'prisma/config';

loadEnvFile();

export default defineConfig({
  schema: path.join(__dirname, 'prisma', 'schema.prisma'),
  datasource: {
    url: env('DATABASE_URL'),
  },
  migrations: {
    seed: 'npx tsx prisma/seed.ts',
  },
});
