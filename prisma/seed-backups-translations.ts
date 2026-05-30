import {PrismaClient} from '@prisma/client';
import {PrismaPg} from '@prisma/adapter-pg';
import * as fs from 'fs';
import * as path from 'path';

if (!process.env.DATABASE_URL) {
  const candidatePaths = [
    path.join(__dirname, '..', '.env'),
    path.join(__dirname, '..', '..', '..', '.env'),
  ];
  let envPath: string | null = null;
  for (const p of candidatePaths) {
    if (fs.existsSync(p)) {
      envPath = p;
      break;
    }
  }
  if (envPath) {
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

const dbUrl = process.env.DATABASE_URL.split('?')[0];
const adapter = new PrismaPg(dbUrl);
const prisma = new PrismaClient({adapter});

type Entry = {namespace: string; key: string; valueVi: string; valueEn: string};

const entries: Entry[] = [
  {namespace: 'admin.backups', key: 'title', valueEn: 'Backups', valueVi: 'Sao lưu'},
  {
    namespace: 'admin.backups',
    key: 'subtitle',
    valueEn: 'Keeps the last {count} backups; the oldest is removed automatically.',
    valueVi: 'Giữ {count} bản sao lưu gần nhất; bản cũ nhất sẽ tự động bị xóa.',
  },
  {namespace: 'admin.backups', key: 'create', valueEn: 'Create backup', valueVi: 'Tạo bản sao lưu'},
  {namespace: 'admin.backups', key: 'empty', valueEn: 'No backups yet.', valueVi: 'Chưa có bản sao lưu nào.'},
  {namespace: 'admin.backups', key: 'sourceLabel', valueEn: 'Source', valueVi: 'Nguồn'},
  {namespace: 'admin.backups', key: 'sourceManual', valueEn: 'Manual', valueVi: 'Thủ công'},
  {namespace: 'admin.backups', key: 'sourceScheduled', valueEn: 'Scheduled', valueVi: 'Tự động'},
  {namespace: 'admin.backups', key: 'createError', valueEn: 'Failed to create backup', valueVi: 'Tạo bản sao lưu thất bại'},
  {namespace: 'admin.backups', key: 'kindDb', valueEn: 'Database', valueVi: 'Cơ sở dữ liệu'},
  {namespace: 'admin.backups', key: 'kindMedia', valueEn: 'Media', valueVi: 'Tệp phương tiện'},
  {namespace: 'common', key: 'created', valueEn: 'Created', valueVi: 'Ngày tạo'},
  {namespace: 'common', key: 'size', valueEn: 'Size', valueVi: 'Kích thước'},
  {namespace: 'common', key: 'download', valueEn: 'Download', valueVi: 'Tải xuống'},
];

async function main() {
  for (const e of entries) {
    await prisma.translation.upsert({
      where: {namespace_key: {namespace: e.namespace, key: e.key}},
      update: {valueVi: e.valueVi, valueEn: e.valueEn},
      create: e,
    });
  }
  console.log(`Seeded ${entries.length} backups translations.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
