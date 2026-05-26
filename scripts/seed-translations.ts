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

type Row = {
  namespace: string;
  key: string;
  valueEn: string;
  valueVi: string;
};

const rows: Row[] = [
  // ── destinationDetail (new public destination detail page) ──
  {
    namespace: 'destinationDetail',
    key: 'highlightsTitle',
    valueEn: 'Highlights',
    valueVi: 'Điểm nổi bật',
  },
  {
    namespace: 'destinationDetail',
    key: 'noHighlights',
    valueEn: 'No highlights yet',
    valueVi: 'Chưa có điểm nổi bật',
  },
  {
    namespace: 'destinationDetail',
    key: 'toursTitle',
    valueEn: 'Available tours',
    valueVi: 'Tour có sẵn',
  },
  {
    namespace: 'destinationDetail',
    key: 'noTours',
    valueEn: 'No tours available yet',
    valueVi: 'Chưa có tour nào',
  },
  {
    namespace: 'destinationDetail',
    key: 'cta.title',
    valueEn: 'Ready to explore?',
    valueVi: 'Sẵn sàng khám phá?',
  },
  {
    namespace: 'destinationDetail',
    key: 'cta.button',
    valueEn: 'Contact us',
    valueVi: 'Liên hệ',
  },

  // ── admin.perks (perks list/new/edit pages, PerkForm) ──
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
    valueVi: 'Thêm tiện ích',
  },
  {
    namespace: 'admin.perks',
    key: 'edit',
    valueEn: 'Edit perk',
    valueVi: 'Sửa tiện ích',
  },
  {
    namespace: 'admin.perks',
    key: 'empty',
    valueEn: 'No perks found',
    valueVi: 'Không tìm thấy tiện ích',
  },
  {
    namespace: 'admin.perks',
    key: 'notFound',
    valueEn: 'Perk not found',
    valueVi: 'Không tìm thấy tiện ích',
  },
  {
    namespace: 'admin.perks',
    key: 'deleteConfirm',
    valueEn: 'Delete perk "{label}"?',
    valueVi: 'Xóa tiện ích "{label}"?',
  },
  {
    namespace: 'admin.perks',
    key: 'category.TRANSPORT',
    valueEn: 'Transport',
    valueVi: 'Phương tiện',
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
    valueVi: 'Chỗ ở',
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

  // ── common (shared admin/public controls) ──
  {
    namespace: 'common',
    key: 'search',
    valueEn: 'Search',
    valueVi: 'Tìm kiếm',
  },
  {
    namespace: 'common',
    key: 'allCategories',
    valueEn: 'All categories',
    valueVi: 'Tất cả danh mục',
  },
  {
    namespace: 'common',
    key: 'showArchived',
    valueEn: 'Show archived',
    valueVi: 'Hiện đã lưu trữ',
  },
  {
    namespace: 'common',
    key: 'archived',
    valueEn: 'Archived',
    valueVi: 'Đã lưu trữ',
  },
  {
    namespace: 'common',
    key: 'archive',
    valueEn: 'Archive',
    valueVi: 'Lưu trữ',
  },
  {
    namespace: 'common',
    key: 'unarchive',
    valueEn: 'Unarchive',
    valueVi: 'Khôi phục',
  },
  {
    namespace: 'common',
    key: 'edit',
    valueEn: 'Edit',
    valueVi: 'Sửa',
  },
  {
    namespace: 'common',
    key: 'delete',
    valueEn: 'Delete',
    valueVi: 'Xóa',
  },
  {
    namespace: 'common',
    key: 'form.labelEn',
    valueEn: 'Label (English)',
    valueVi: 'Nhãn (Tiếng Anh)',
  },
  {
    namespace: 'common',
    key: 'form.labelVi',
    valueEn: 'Label (Vietnamese)',
    valueVi: 'Nhãn (Tiếng Việt)',
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
  {
    namespace: 'common',
    key: 'form.save',
    valueEn: 'Save',
    valueVi: 'Lưu',
  },
  {
    namespace: 'common',
    key: 'form.saving',
    valueEn: 'Saving...',
    valueVi: 'Đang lưu...',
  },

  // ── common (consolidated from per-page namespaces; see scripts/common-keys-allowlist.ts) ──
  {
    namespace: 'common',
    key: 'breadcrumbHome',
    valueEn: 'Home',
    valueVi: 'Trang chủ',
  },
  {
    namespace: 'common',
    key: 'breadcrumbTours',
    valueEn: 'Tours',
    valueVi: 'Tour',
  },
  {
    namespace: 'common',
    key: 'whatsappUs',
    valueEn: 'WhatsApp us',
    valueVi: 'Nhắn WhatsApp',
  },
  {
    namespace: 'common',
    key: 'emailInquiry',
    valueEn: 'Email inquiry',
    valueVi: 'Gửi email',
  },
  {
    namespace: 'common',
    key: 'planYourTrip',
    valueEn: 'Plan your trip with us',
    valueVi: 'Lên kế hoạch chuyến đi cùng chúng tôi',
  },
  {
    namespace: 'common',
    key: 'bookTourNow',
    valueEn: 'Book tour now',
    valueVi: 'Đặt tour ngay',
  },
  {
    namespace: 'common',
    key: 'readyToTravel',
    valueEn: 'Are you ready to travel?',
    valueVi: 'Bạn đã sẵn sàng du lịch?',
  },
  {
    namespace: 'common',
    key: 'highlights',
    valueEn: 'Highlights',
    valueVi: 'Điểm nổi bật',
  },
  {
    namespace: 'common',
    key: 'itinerary',
    valueEn: 'Itinerary',
    valueVi: 'Lịch trình',
  },
  {
    namespace: 'common',
    key: 'pricing',
    valueEn: 'Pricing',
    valueVi: 'Bảng giá',
  },
];

async function main(): Promise<void> {
  for (const row of rows) {
    await prisma.translation.upsert({
      where: {namespace_key: {namespace: row.namespace, key: row.key}},
      update: {valueEn: row.valueEn, valueVi: row.valueVi},
      create: row,
    });
    console.log(`upserted ${row.namespace}.${row.key}`);
  }
  console.log(`done: ${rows.length} translations`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
