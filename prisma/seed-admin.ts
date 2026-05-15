import {PrismaClient} from '@prisma/client';
import {PrismaPg} from '@prisma/adapter-pg';
import bcrypt from 'bcrypt';
import * as fs from 'fs';
import * as path from 'path';

// Load .env file if DATABASE_URL is not set
if (!process.env.DATABASE_URL) {
  const envPath = path.join(__dirname, '..', '.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    for (const line of envContent.split('\n')) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const eqIndex = trimmed.indexOf('=');
        if (eqIndex > 0) {
          const key = trimmed.substring(0, eqIndex);
          let value = trimmed.substring(eqIndex + 1);
          if (
            (value.startsWith('"') && value.endsWith('"')) ||
            (value.startsWith("'") && value.endsWith("'"))
          ) {
            value = value.slice(1, -1);
          }
          process.env[key] = value;
        }
      }
    }
  }
}

if (!process.env.DATABASE_URL) {
  console.error('ERROR: DATABASE_URL environment variable is required.');
  process.exit(1);
}

// Strip Prisma-specific query params (like ?schema=public) that pg doesn't understand
const dbUrl = process.env.DATABASE_URL.split('?')[0];
const adapter = new PrismaPg(dbUrl);
const prisma = new PrismaClient({adapter});

async function main(): Promise<void> {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  const name = process.env.ADMIN_NAME;

  if (!email || !password || !name) {
    console.error(
      'ERROR: ADMIN_EMAIL, ADMIN_PASSWORD, and ADMIN_NAME environment variables are required.',
    );
    console.error(
      'Usage: ADMIN_EMAIL=admin@example.com ADMIN_PASSWORD=changeme123 ADMIN_NAME=Admin pnpm db:seed-admin',
    );
    process.exit(1);
  }

  const adminRole = await prisma.orgRole.upsert({
    where: {key: 'admin'},
    update: {labelVi: 'Quản trị', labelEn: 'Admin', order: 0},
    create: {key: 'admin', labelVi: 'Quản trị', labelEn: 'Admin', order: 0},
  });

  // Check for duplicate email
  const existing = await prisma.user.findUnique({
    where: {email},
  });

  if (existing) {
    console.log(
      `Admin user with email "${email}" already exists (id: ${existing.id}). Skipping.`,
    );
    return;
  }

  // Hash password with bcrypt (12 rounds)
  const passwordHash = await bcrypt.hash(password, 12);

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      name,
      orgRoleId: adminRole.id,
      allowAuth: true,
      isCoreTeam: false,
    },
  });

  console.log(`Admin user created successfully:`);
  console.log(`  ID:    ${user.id}`);
  console.log(`  Email: ${user.email}`);
  console.log(`  Name:  ${user.name}`);
}

main()
  .catch((e) => {
    console.error('Seed admin failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
