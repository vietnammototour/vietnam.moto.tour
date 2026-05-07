import {PrismaClient} from '@prisma/client';
import {PrismaPg} from '@prisma/adapter-pg';
import * as fs from 'fs';
import * as path from 'path';

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

const dbUrl = process.env.DATABASE_URL.split('?')[0];
const adapter = new PrismaPg(dbUrl);
const prisma = new PrismaClient({adapter});

type Entry = {namespace: string; key: string; valueVi: string; valueEn: string};

const entries: Entry[] = [
  // admin.perks — list/create/edit pages
  {
    namespace: 'admin.perks',
    key: 'title',
    valueEn: 'Perks',
    valueVi: 'Tiện ích',
  },
  {
    namespace: 'admin.perks',
    key: 'new',
    valueEn: 'New perk',
    valueVi: 'Thêm mới',
  },
  {
    namespace: 'admin.perks',
    key: 'edit',
    valueEn: 'Edit perk',
    valueVi: 'Chỉnh sửa tiện ích',
  },
  {
    namespace: 'admin.perks',
    key: 'empty',
    valueEn: 'No perks yet.',
    valueVi: 'Chưa có tiện ích nào.',
  },
  {
    namespace: 'admin.perks',
    key: 'notFound',
    valueEn: 'Perk not found.',
    valueVi: 'Không tìm thấy tiện ích.',
  },
  {
    namespace: 'admin.perks',
    key: 'deleteConfirm',
    valueEn: 'Delete perk "{label}"?',
    valueVi: 'Xóa tiện ích "{label}"?',
  },

  // admin.perks.category.* — must match VMT.PerkCategory enum values
  {
    namespace: 'admin.perks',
    key: 'category.TRANSPORT',
    valueEn: 'Transport',
    valueVi: 'Di chuyển',
  },
  {
    namespace: 'admin.perks',
    key: 'category.FOOD',
    valueEn: 'Food',
    valueVi: 'Ăn uống',
  },
  {
    namespace: 'admin.perks',
    key: 'category.ACCOMMODATION',
    valueEn: 'Accommodation',
    valueVi: 'Lưu trú',
  },
  {
    namespace: 'admin.perks',
    key: 'category.GUIDE',
    valueEn: 'Guide',
    valueVi: 'Hướng dẫn viên',
  },
  {
    namespace: 'admin.perks',
    key: 'category.SUPPORT',
    valueEn: 'Support',
    valueVi: 'Hỗ trợ',
  },
  {
    namespace: 'admin.perks',
    key: 'category.OTHER',
    valueEn: 'Other',
    valueVi: 'Khác',
  },

  // admin.tours.perksTab — tour edit perks tab
  {
    namespace: 'admin.tours.perksTab',
    key: 'available',
    valueEn: 'Available',
    valueVi: 'Có sẵn',
  },
  {
    namespace: 'admin.tours.perksTab',
    key: 'included',
    valueEn: 'Included',
    valueVi: 'Đã bao gồm',
  },
  {
    namespace: 'admin.tours.perksTab',
    key: 'excluded',
    valueEn: 'Excluded',
    valueVi: 'Không bao gồm',
  },
  {
    namespace: 'admin.tours.perksTab',
    key: 'noneAvailable',
    valueEn: 'No perks available.',
    valueVi: 'Không có tiện ích nào.',
  },
  {
    namespace: 'admin.tours.perksTab',
    key: 'saveGeneralFirst',
    valueEn: 'Save the tour first before assigning perks.',
    valueVi: 'Lưu tour trước khi gán tiện ích.',
  },
  {
    namespace: 'admin.tours.perksTab',
    key: 'saveFailed',
    valueEn: 'Failed to save perks.',
    valueVi: 'Lưu tiện ích thất bại.',
  },
  {
    namespace: 'admin.tours.perksTab',
    key: 'save',
    valueEn: 'Save perks',
    valueVi: 'Lưu tiện ích',
  },

  // common.form.* — used by PerkForm; safe upsert (skip if already present)
  {
    namespace: 'common',
    key: 'form.labelEn',
    valueEn: 'Label (EN)',
    valueVi: 'Nhãn (EN)',
  },
  {
    namespace: 'common',
    key: 'form.labelVi',
    valueEn: 'Label (VI)',
    valueVi: 'Nhãn (VI)',
  },
  {
    namespace: 'common',
    key: 'form.category',
    valueEn: 'Category',
    valueVi: 'Danh mục',
  },
  {
    namespace: 'common',
    key: 'form.icon',
    valueEn: 'Icon',
    valueVi: 'Biểu tượng',
  },
  {
    namespace: 'common',
    key: 'form.archived',
    valueEn: 'Archived',
    valueVi: 'Đã lưu trữ',
  },
  {namespace: 'common', key: 'form.save', valueEn: 'Save', valueVi: 'Lưu'},
  {
    namespace: 'common',
    key: 'form.saving',
    valueEn: 'Saving...',
    valueVi: 'Đang lưu...',
  },
];

async function main(): Promise<void> {
  let created = 0;
  let skipped = 0;
  for (const e of entries) {
    const existing = await prisma.translation.findUnique({
      where: {namespace_key: {namespace: e.namespace, key: e.key}},
    });
    if (existing) {
      skipped++;
      continue;
    }
    await prisma.translation.create({data: e});
    created++;
    console.log(`+ ${e.namespace}::${e.key}`);
  }
  console.log(
    `\nDone. created=${created} skipped=${skipped} total=${entries.length}`,
  );
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
