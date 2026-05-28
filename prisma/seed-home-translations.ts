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

const ENTRIES: Entry[] = [
  {
    namespace: 'home',
    key: 'heroTimestamp',
    valueVi: 'THÀNH LẬP 2014 · HÀ NỘI 21.0285°N',
    valueEn: 'EST. 2014 · HANOI 21.0285°N',
  },
  {
    namespace: 'home',
    key: 'viewFleet',
    valueVi: 'XEM ĐỘI XE',
    valueEn: 'VIEW FLEET',
  },
  {
    namespace: 'home',
    key: 'toursEyebrow',
    valueVi: 'Hành trình',
    valueEn: 'Field Routes',
  },
  {
    namespace: 'home',
    key: 'toursFilterLabel',
    valueVi: 'Lọc tour',
    valueEn: 'Filter tours',
  },
  {
    namespace: 'home',
    key: 'tours.filterAll',
    valueVi: 'TẤT CẢ',
    valueEn: 'ALL',
  },
  {
    namespace: 'home',
    key: 'tours.filterMountain',
    valueVi: 'NÚI',
    valueEn: 'MOUNTAIN',
  },
  {
    namespace: 'home',
    key: 'tours.filterCoastal',
    valueVi: 'BIỂN',
    valueEn: 'COASTAL',
  },
  {
    namespace: 'home',
    key: 'tours.filterNorth',
    valueVi: 'MIỀN BẮC',
    valueEn: 'NORTH',
  },
  {
    namespace: 'home',
    key: 'tours.filterSouth',
    valueVi: 'MIỀN NAM',
    valueEn: 'SOUTH',
  },
  {
    namespace: 'home',
    key: 'videoEyebrow',
    valueVi: 'Tư liệu',
    valueEn: 'Field Report',
  },
  {
    namespace: 'home',
    key: 'watchFieldReport',
    valueVi: 'XEM TƯ LIỆU',
    valueEn: 'WATCH FIELD REPORT',
  },
  {
    namespace: 'home',
    key: 'galleryEyebrow',
    valueVi: 'Tư liệu hình ảnh',
    valueEn: 'Photo Log',
  },
  {
    namespace: 'home',
    key: 'galleryTitle',
    valueVi: 'KHOẢNH KHẮC TRÊN ĐƯỜNG',
    valueEn: 'FIELD CAPTURES',
  },
  {
    namespace: 'home',
    key: 'stats.years.label',
    valueVi: 'NĂM HOẠT ĐỘNG',
    valueEn: 'YEARS',
  },
  {
    namespace: 'home',
    key: 'stats.routes.label',
    valueVi: 'CUNG ĐƯỜNG',
    valueEn: 'ROUTES',
  },
  {
    namespace: 'home',
    key: 'stats.km.label',
    valueVi: 'KM ĐÃ ĐI',
    valueEn: 'KM RIDDEN',
  },
  {namespace: 'home', key: 'stats.km.value', valueVi: '1.2M', valueEn: '1.2M'},
  {
    namespace: 'home',
    key: 'stats.riders.label',
    valueVi: 'TAY LÁI',
    valueEn: 'RIDERS',
  },
  {
    namespace: 'home',
    key: 'stats.riders.value',
    valueVi: '4500+',
    valueEn: '4500+',
  },
  {
    namespace: 'home',
    key: 'videoIframeTitle',
    valueVi: 'Video tư liệu Vietnam Moto Tour',
    valueEn: 'Vietnam Moto Tour field report video',
  },
  {
    namespace: 'rentals.filter',
    key: 'filterLabel',
    valueVi: 'Bộ lọc xe',
    valueEn: 'Vehicle filter',
  },
  {
    namespace: 'home',
    key: 'testimonialsEyebrow',
    valueVi: 'Tiếng nói trên đường',
    valueEn: 'Field Voices',
  },
  {
    namespace: 'home',
    key: 'testimonialsTitle',
    valueVi: 'NGƯỜI ĐÃ ĐI CÙNG CHÚNG TÔI',
    valueEn: 'WHO HAS RIDDEN WITH US',
  },
];

async function main() {
  for (const e of ENTRIES) {
    await prisma.translation.upsert({
      where: {namespace_key: {namespace: e.namespace, key: e.key}},
      create: e,
      update: {valueVi: e.valueVi, valueEn: e.valueEn},
    });
    console.log(`✓ ${e.namespace}.${e.key}`);
  }
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
