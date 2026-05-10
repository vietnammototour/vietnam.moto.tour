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
  // Destination edit tabs
  {
    namespace: 'admin.destinations.tabs',
    key: 'general',
    valueEn: 'General',
    valueVi: 'Chung',
  },
  {
    namespace: 'admin.destinations.tabs',
    key: 'heroImage',
    valueEn: 'Hero image',
    valueVi: 'Ảnh bìa',
  },
  {
    namespace: 'admin.destinations.tabs',
    key: 'cardImage',
    valueEn: 'Card image',
    valueVi: 'Ảnh thẻ',
  },
  {
    namespace: 'admin.destinations.tabs',
    key: 'highlights',
    valueEn: 'Highlights',
    valueVi: 'Điểm nổi bật',
  },

  // Tour edit tabs
  {
    namespace: 'admin.tours.tabs',
    key: 'general',
    valueEn: 'General',
    valueVi: 'Chung',
  },
  {namespace: 'admin.tours.tabs', key: 'card', valueEn: 'Card', valueVi: 'Thẻ'},
  {
    namespace: 'admin.tours.tabs',
    key: 'itinerary',
    valueEn: 'Itinerary',
    valueVi: 'Lịch trình',
  },
  {
    namespace: 'admin.tours.tabs',
    key: 'pricing',
    valueEn: 'Pricing',
    valueVi: 'Giá',
  },
  {
    namespace: 'admin.tours.tabs',
    key: 'highlights',
    valueEn: 'Highlights',
    valueVi: 'Điểm nổi bật',
  },
  {
    namespace: 'admin.tours.tabs',
    key: 'perks',
    valueEn: 'Perks',
    valueVi: 'Tiện ích',
  },

  // Image collections
  {
    namespace: 'admin.imageCollections',
    key: 'title',
    valueEn: 'Image collections',
    valueVi: 'Bộ sưu tập ảnh',
  },
  {
    namespace: 'admin.imageCollections',
    key: 'newTitle',
    valueEn: 'New image collection',
    valueVi: 'Bộ sưu tập ảnh mới',
  },
  {
    namespace: 'admin.imageCollections',
    key: 'new',
    valueEn: 'New collection',
    valueVi: 'Tạo bộ sưu tập',
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
    valueVi: 'Tên hiển thị',
  },
  {
    namespace: 'admin.imageCollections',
    key: 'key',
    valueEn: 'Key',
    valueVi: 'Mã định danh',
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
    key: 'replace',
    valueEn: 'Replace',
    valueVi: 'Thay ảnh',
  },
  {
    namespace: 'admin.imageCollections',
    key: 'altEn',
    valueEn: 'Alt text (English)',
    valueVi: 'Mô tả ảnh (tiếng Anh)',
  },
  {
    namespace: 'admin.imageCollections',
    key: 'altVi',
    valueEn: 'Alt text (Vietnamese)',
    valueVi: 'Mô tả ảnh (tiếng Việt)',
  },
  {
    namespace: 'admin.imageCollections',
    key: 'dragHandle',
    valueEn: 'Drag to reorder',
    valueVi: 'Kéo để sắp xếp',
  },
  {
    namespace: 'admin.imageCollections',
    key: 'uploadHint',
    valueEn: 'Upload an image',
    valueVi: 'Tải ảnh lên',
  },
  {
    namespace: 'admin.imageCollections',
    key: 'countHint',
    valueEn: '{count} of {max} images',
    valueVi: '{count}/{max} ảnh',
  },
  {
    namespace: 'admin.imageCollections',
    key: 'confirmDelete',
    valueEn: 'Delete this collection? This cannot be undone.',
    valueVi: 'Xoá bộ sưu tập này? Không thể hoàn tác.',
  },
  {
    namespace: 'admin.imageCollections',
    key: 'confirmDeleteImage',
    valueEn: 'Delete this image?',
    valueVi: 'Xoá ảnh này?',
  },

  // Destination detail — Show more highlights pagination
  {
    namespace: 'destinationDetail',
    key: 'showMoreHighlights',
    valueEn: 'Show more {count}',
    valueVi: 'Xem thêm {count}',
  },
  {
    namespace: 'destinationDetail',
    key: 'highlightsLoading',
    valueEn: 'Loading…',
    valueVi: 'Đang tải…',
  },
  {
    namespace: 'destinationDetail',
    key: 'highlightsLoadError',
    valueEn: 'Could not load more highlights. Try again.',
    valueVi: 'Không thể tải thêm điểm nổi bật. Vui lòng thử lại.',
  },

  // Tour detail
  {
    namespace: 'tourDetail',
    key: 'aboutThisTour',
    valueEn: 'About this tour',
    valueVi: 'Về tour này',
  },

  // Common
  {
    namespace: 'common',
    key: 'save',
    valueEn: 'Save',
    valueVi: 'Lưu',
  },

  // admin.tours.perksTab — Perks tab on tour edit page
  {
    namespace: 'admin.tours.perksTab',
    key: 'available',
    valueEn: 'Available perks',
    valueVi: 'Tiện ích khả dụng',
  },
  {
    namespace: 'admin.tours.perksTab',
    key: 'included',
    valueEn: 'Included',
    valueVi: 'Bao gồm',
  },
  {
    namespace: 'admin.tours.perksTab',
    key: 'excluded',
    valueEn: 'Excluded',
    valueVi: 'Không bao gồm',
  },
  {
    namespace: 'admin.tours.perksTab',
    key: 'save',
    valueEn: 'Save perks',
    valueVi: 'Lưu tiện ích',
  },
  {
    namespace: 'admin.tours.perksTab',
    key: 'saveGeneralFirst',
    valueEn: 'Save the General tab before assigning perks',
    valueVi: 'Lưu tab Chung trước khi gán tiện ích',
  },
  {
    namespace: 'admin.tours.perksTab',
    key: 'saveFailed',
    valueEn: 'Failed to save perks',
    valueVi: 'Lưu tiện ích thất bại',
  },
  {
    namespace: 'admin.tours.perksTab',
    key: 'noneAvailable',
    valueEn: 'No perks match your filters',
    valueVi: 'Không có tiện ích phù hợp',
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
