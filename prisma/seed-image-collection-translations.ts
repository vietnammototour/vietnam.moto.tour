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

type Entry = {
  namespace: string;
  key: string;
  valueEn: string;
  valueVi: string;
};

const entries: Entry[] = [
  {
    namespace: 'admin.imageCollections',
    key: 'title',
    valueEn: 'Image Collections',
    valueVi: 'Bộ sưu tập ảnh',
  },
  {
    namespace: 'admin.imageCollections',
    key: 'newTitle',
    valueEn: 'New Image Collection',
    valueVi: 'Bộ sưu tập ảnh mới',
  },
  {
    namespace: 'admin.imageCollections',
    key: 'new',
    valueEn: 'New collection',
    valueVi: 'Bộ sưu tập mới',
  },
  {
    namespace: 'admin.imageCollections',
    key: 'empty',
    valueEn: 'No collections yet.',
    valueVi: 'Chưa có bộ sưu tập nào.',
  },
  {
    namespace: 'admin.imageCollections',
    key: 'label',
    valueEn: 'Label',
    valueVi: 'Nhãn',
  },
  {
    namespace: 'admin.imageCollections',
    key: 'key',
    valueEn: 'Key',
    valueVi: 'Khoá',
  },
  {
    namespace: 'admin.imageCollections',
    key: 'imageCount',
    valueEn: 'Images',
    valueVi: 'Số ảnh',
  },
  {
    namespace: 'admin.imageCollections',
    key: 'addImage',
    valueEn: 'Add image',
    valueVi: 'Thêm ảnh',
  },
  {
    namespace: 'admin.imageCollections',
    key: 'altEn',
    valueEn: 'Alt text (EN)',
    valueVi: 'Mô tả ảnh (EN)',
  },
  {
    namespace: 'admin.imageCollections',
    key: 'altVi',
    valueEn: 'Alt text (VI)',
    valueVi: 'Mô tả ảnh (VI)',
  },
  {
    namespace: 'admin.imageCollections',
    key: 'replace',
    valueEn: 'Replace',
    valueVi: 'Thay thế',
  },
  {
    namespace: 'admin.imageCollections',
    key: 'confirmDelete',
    valueEn: 'Delete this collection? This is irreversible.',
    valueVi: 'Xoá bộ sưu tập này? Không thể hoàn tác.',
  },
  {
    namespace: 'admin.imageCollections',
    key: 'confirmDeleteImage',
    valueEn: 'Delete this image?',
    valueVi: 'Xoá ảnh này?',
  },
  {
    namespace: 'admin.imageCollections',
    key: 'uploadHint',
    valueEn: 'Upload .webp',
    valueVi: 'Tải lên .webp',
  },
  {
    namespace: 'admin.imageCollections',
    key: 'dragHandle',
    valueEn: 'Drag to reorder',
    valueVi: 'Kéo để sắp xếp',
  },
  {
    namespace: 'admin.imageCollections',
    key: 'countHint',
    valueEn: '{count} of {max} images',
    valueVi: '{count} trên {max} ảnh',
  },
];

async function main(): Promise<void> {
  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const entry of entries) {
    const existing = await prisma.translation.findUnique({
      where: {
        namespace_key: {namespace: entry.namespace, key: entry.key},
      },
    });

    if (!existing) {
      await prisma.translation.create({data: entry});
      created++;
      console.log(`  + ${entry.namespace}.${entry.key}`);
      continue;
    }

    const isEmpty =
      (existing.valueEn ?? '') === '' && (existing.valueVi ?? '') === '';

    if (isEmpty) {
      await prisma.translation.update({
        where: {id: existing.id},
        data: {valueEn: entry.valueEn, valueVi: entry.valueVi},
      });
      updated++;
      console.log(`  ~ ${entry.namespace}.${entry.key} (filled empty values)`);
    } else {
      skipped++;
      console.log(
        `  = ${entry.namespace}.${entry.key} (already populated, skipped)`,
      );
    }
  }

  console.log(
    `\nDone. Created: ${created}, updated: ${updated}, skipped: ${skipped}.`,
  );
}

main()
  .catch((e) => {
    console.error('Seed image-collection translations failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
