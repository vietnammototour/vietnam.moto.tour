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

type Entry = {namespace: string; key: string; valueVi: string; valueEn: string};

const ENTRIES: Entry[] = [
  {
    namespace: 'admin',
    key: 'roles.title',
    valueVi: 'Vai trò',
    valueEn: 'Roles',
  },
  {
    namespace: 'admin',
    key: 'roles.new',
    valueVi: 'Thêm vai trò',
    valueEn: 'Add role',
  },
  {
    namespace: 'admin',
    key: 'roles.edit',
    valueVi: 'Sửa vai trò',
    valueEn: 'Edit role',
  },
  {
    namespace: 'admin',
    key: 'roles.keyLabel',
    valueVi: 'Khóa',
    valueEn: 'Key',
  },
  {
    namespace: 'admin',
    key: 'roles.labelLabel',
    valueVi: 'Nhãn',
    valueEn: 'Label',
  },
  {
    namespace: 'admin',
    key: 'roles.labelViLabel',
    valueVi: 'Nhãn (VI)',
    valueEn: 'Label (VI)',
  },
  {
    namespace: 'admin',
    key: 'roles.labelEnLabel',
    valueVi: 'Nhãn (EN)',
    valueEn: 'Label (EN)',
  },
  {
    namespace: 'admin',
    key: 'roles.count',
    valueVi:
      '{count, plural, =0 {Không có vai trò} one {# vai trò} other {# vai trò}}',
    valueEn: '{count, plural, =0 {No roles} one {# role} other {# roles}}',
  },
  {
    namespace: 'admin',
    key: 'roles.orderLabel',
    valueVi: 'Thứ tự',
    valueEn: 'Order',
  },
  {
    namespace: 'admin',
    key: 'roles.save',
    valueVi: 'Lưu',
    valueEn: 'Save',
  },
  {
    namespace: 'admin',
    key: 'roles.cancel',
    valueVi: 'Hủy',
    valueEn: 'Cancel',
  },
  {
    namespace: 'admin',
    key: 'roles.delete',
    valueVi: 'Xóa',
    valueEn: 'Delete',
  },
  {
    namespace: 'admin',
    key: 'roles.deleteConfirm',
    valueVi: 'Xóa vai trò "{label}"?',
    valueEn: 'Delete role "{label}"?',
  },
  {
    namespace: 'admin',
    key: 'roles.deleteInUse',
    valueVi: 'Vai trò đang được sử dụng và không thể xóa',
    valueEn: 'Role is in use and cannot be deleted',
  },
  {
    namespace: 'admin',
    key: 'roles.usersCount',
    valueVi: 'Số người dùng có vai trò',
    valueEn: 'Users with role',
  },
  {
    namespace: 'admin',
    key: 'roles.validation.keyFormat',
    valueVi: 'Khóa phải ở định dạng snake_case viết thường',
    valueEn: 'key must be lowercase snake_case',
  },
  {
    namespace: 'admin',
    key: 'roles.validation.labelViRequired',
    valueVi: 'Nhãn tiếng Việt bắt buộc',
    valueEn: 'Vietnamese label required',
  },
  {
    namespace: 'admin',
    key: 'roles.validation.labelEnRequired',
    valueVi: 'Nhãn tiếng Anh bắt buộc',
    valueEn: 'English label required',
  },
];

async function main() {
  for (const entry of ENTRIES) {
    await prisma.translation.upsert({
      where: {namespace_key: {namespace: entry.namespace, key: entry.key}},
      update: {valueVi: entry.valueVi, valueEn: entry.valueEn},
      create: entry,
    });
  }
  console.log(`Seeded ${ENTRIES.length} admin.roles.* translations.`);
}

main()
  .catch((err) => {
    console.error('Seed admin-roles-translations failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
