import {PrismaClient} from '@prisma/client';
import {PrismaPg} from '@prisma/adapter-pg';
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

type RoleSeed = {key: string; labelVi: string; labelEn: string; order: number};

const ROLES: RoleSeed[] = [
  {key: 'admin', labelVi: 'Quản trị', labelEn: 'Admin', order: 0},
  {key: 'founder', labelVi: 'Người sáng lập', labelEn: 'Founder', order: 1},
  {
    key: 'tour_guide',
    labelVi: 'Hướng dẫn viên',
    labelEn: 'Tour Guide',
    order: 2,
  },
  {
    key: 'tour_guide_mechanic',
    labelVi: 'Hướng dẫn viên & Kỹ sư',
    labelEn: 'Tour Guide & Mechanic',
    order: 3,
  },
  {
    key: 'driver_support',
    labelVi: 'Tài xế hỗ trợ',
    labelEn: 'Driver Support',
    order: 4,
  },
];

type StaffSeed = {name: string; roleKey: string; teamOrder: number};

const STAFF: StaffSeed[] = [
  {name: 'Thomas', roleKey: 'founder', teamOrder: 0},
  {name: 'Tino', roleKey: 'tour_guide', teamOrder: 1},
  {name: 'Chan', roleKey: 'tour_guide_mechanic', teamOrder: 2},
  {name: 'Hai', roleKey: 'tour_guide', teamOrder: 3},
  {name: 'Phi', roleKey: 'driver_support', teamOrder: 4},
];

async function main() {
  await prisma.imageCollection.upsert({
    where: {key: 'team'},
    update: {label: 'Team Photos'},
    create: {key: 'team', label: 'Team Photos'},
  });

  const roleByKey = new Map<string, {id: string}>();
  for (const role of ROLES) {
    const row = await prisma.orgRole.upsert({
      where: {key: role.key},
      update: {labelVi: role.labelVi, labelEn: role.labelEn, order: role.order},
      create: role,
    });
    roleByKey.set(role.key, {id: row.id});
  }

  for (const s of STAFF) {
    const role = roleByKey.get(s.roleKey);
    if (!role) throw new Error(`Missing role ${s.roleKey}`);
    const existing = await prisma.user.findFirst({
      where: {name: s.name, allowAuth: false},
    });
    if (existing) {
      await prisma.user.update({
        where: {id: existing.id},
        data: {orgRoleId: role.id, teamOrder: s.teamOrder, isCoreTeam: true},
      });
    } else {
      await prisma.user.create({
        data: {
          name: s.name,
          email: null,
          passwordHash: null,
          orgRoleId: role.id,
          teamOrder: s.teamOrder,
          isCoreTeam: true,
          allowAuth: false,
        },
      });
    }
  }

  console.log(`Seeded ${ROLES.length} roles and ${STAFF.length} staff users.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
