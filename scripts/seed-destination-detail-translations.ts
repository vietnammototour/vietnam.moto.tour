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
  // Hero
  {
    namespace: 'destinationDetail',
    key: 'eyebrow',
    valueEn: 'Destination',
    valueVi: 'Điểm đến',
  },
  {
    namespace: 'destinationDetail',
    key: 'breadcrumbDestinations',
    valueEn: 'Destinations',
    valueVi: 'Điểm đến',
  },
  {
    namespace: 'destinationDetail',
    key: 'sizeSmall',
    valueEn: 'Compact region',
    valueVi: 'Khu vực nhỏ',
  },
  {
    namespace: 'destinationDetail',
    key: 'sizeLarge',
    valueEn: 'Major region',
    valueVi: 'Khu vực lớn',
  },
  {
    namespace: 'destinationDetail',
    key: 'toursAvailable',
    valueEn: '{count} tours',
    valueVi: '{count} tour',
  },
  {
    namespace: 'destinationDetail',
    key: 'exploreCue',
    valueEn: 'Scroll to explore',
    valueVi: 'Cuộn để khám phá',
  },

  // Intro
  {
    namespace: 'destinationDetail',
    key: 'aboutEyebrow',
    valueEn: 'Overview',
    valueVi: 'Tổng quan',
  },
  {
    namespace: 'destinationDetail',
    key: 'aboutTitle',
    valueEn: 'About {name}',
    valueVi: 'Về {name}',
  },

  // Highlights
  {
    namespace: 'destinationDetail',
    key: 'highlightsEyebrow',
    valueEn: 'What to see',
    valueVi: 'Có gì ở đây',
  },
  {
    namespace: 'destinationDetail',
    key: 'highlightsTitle',
    valueEn: 'Highlights',
    valueVi: 'Điểm nổi bật',
  },
  {
    namespace: 'destinationDetail',
    key: 'highlightsCount',
    valueEn: '{count} highlights',
    valueVi: '{count} điểm nổi bật',
  },
  {
    namespace: 'destinationDetail',
    key: 'noHighlights',
    valueEn: 'No highlights yet',
    valueVi: 'Chưa có điểm nổi bật',
  },
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

  // Tours section
  {
    namespace: 'destinationDetail',
    key: 'toursEyebrow',
    valueEn: 'Ride from here',
    valueVi: 'Khởi hành từ đây',
  },
  {
    namespace: 'destinationDetail',
    key: 'toursTitle',
    valueEn: 'Tours from {name}',
    valueVi: 'Tour khởi hành từ {name}',
  },
  {
    namespace: 'destinationDetail',
    key: 'noTours',
    valueEn: 'No tours yet',
    valueVi: 'Chưa có tour',
  },

  // Sidebar facts
  {
    namespace: 'destinationDetail',
    key: 'factsEyebrow',
    valueEn: 'At a glance',
    valueVi: 'Nhanh',
  },
  {
    namespace: 'destinationDetail',
    key: 'factsTitle',
    valueEn: 'Quick facts',
    valueVi: 'Thông tin nhanh',
  },
  {
    namespace: 'destinationDetail',
    key: 'regionLabel',
    valueEn: 'Region',
    valueVi: 'Khu vực',
  },
  {
    namespace: 'destinationDetail',
    key: 'toursAvailableLabel',
    valueEn: 'Tours available',
    valueVi: 'Số tour',
  },
  {
    namespace: 'destinationDetail',
    key: 'exploreToursCta',
    valueEn: 'Explore tours',
    valueVi: 'Xem các tour',
  },
  // CTA
  {
    namespace: 'destinationDetail.cta',
    key: 'eyebrow',
    valueEn: 'Ready to ride',
    valueVi: 'Sẵn sàng lên đường',
  },
  {
    namespace: 'destinationDetail.cta',
    key: 'title',
    valueEn: 'Ready to explore this destination?',
    valueVi: 'Sẵn sàng khám phá điểm đến này?',
  },
  {
    namespace: 'destinationDetail.cta',
    key: 'subtitle',
    valueEn:
      'Tell us your dates and riding style — we will craft a route that fits.',
    valueVi:
      'Cho chúng tôi biết lịch trình và phong cách của bạn — chúng tôi sẽ thiết kế cung đường phù hợp.',
  },
  {
    namespace: 'destinationDetail.cta',
    key: 'button',
    valueEn: 'Contact us',
    valueVi: 'Liên hệ với chúng tôi',
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
