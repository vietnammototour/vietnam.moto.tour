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
    namespace: 'about',
    key: 'hero.eyebrow',
    valueVi: 'Về chúng tôi',
    valueEn: 'About',
  },
  {
    namespace: 'about',
    key: 'hero.headline',
    valueVi: 'Khám phá Việt Nam đích thực.',
    valueEn: 'Riding the real Vietnam.',
  },
  {
    namespace: 'about',
    key: 'hero.lead',
    valueVi:
      'Công ty tour mô tô độc lập tại Nha Trang. 100% sở hữu trong nước, hơn 15 năm kinh nghiệm dẫn tour qua những cung đường ít người biết đến.',
    valueEn:
      'An independent Nha Trang motorcycle tour company. 100% locally owned, with 15+ years of experience guiding rides through the parts of Vietnam most tours miss.',
  },
  {
    namespace: 'about',
    key: 'hero.ctaMeetTeam',
    valueVi: 'Gặp đội ngũ',
    valueEn: 'Meet the team',
  },
  {
    namespace: 'about',
    key: 'story.pullQuote',
    valueVi: '100% sở hữu trong nước.',
    valueEn: '100% locally owned.',
  },
  {
    namespace: 'about',
    key: 'story.body',
    valueVi:
      'Chúng tôi thiết kế tour dựa trên nhiều năm kinh nghiệm chạy mô tô khắp Việt Nam. Khác xa các tuyến du lịch đại trà, đường của chúng tôi đi qua những vùng núi, làng dân tộc và bờ biển hoang sơ.\n\nLợi nhuận được giữ lại trong nước để hỗ trợ gia đình các hướng dẫn viên. Điều đó cũng cho phép chúng tôi cung cấp giá tốt hơn và kiến thức bản địa sâu hơn.\n\nTour của chúng tôi phù hợp cho cả tay lái mới và dày dặn kinh nghiệm. Chúng tôi đồng hành với bạn từ trước, trong và sau chuyến đi.',
    valueEn:
      "Our tours are built on years of motorcycle touring across Vietnam. Away from the well-worn highways, our routes wind through mountain villages, ethnic-minority communities, and stretches of coast most operators miss.\n\nWe're 100% locally owned, so the income stays in the country, funding food and education for our guides' families. That also lets us offer better rates and deeper local knowledge — including home-cooked meals with Vietnamese families along the way.\n\nWe cater to both new and experienced riders. Before, during, and after your tour, we look after you. Consider us your one-stop shop in Vietnam.",
  },
  {
    namespace: 'about',
    key: 'valueProps.01.title',
    valueVi: 'Sở hữu trong nước',
    valueEn: 'Locally Owned',
  },
  {
    namespace: 'about',
    key: 'valueProps.01.body',
    valueVi:
      '100% người Việt sở hữu và vận hành. Mọi đồng lợi nhuận quay về với cộng đồng.',
    valueEn:
      '100% Vietnamese-owned and operated. Every dong of profit goes back into the country.',
  },
  {
    namespace: 'about',
    key: 'valueProps.02.title',
    valueVi: 'Đường mòn ít người',
    valueEn: 'Off the Beaten Track',
  },
  {
    namespace: 'about',
    key: 'valueProps.02.body',
    valueVi:
      'Chúng tôi liên tục khám phá tuyến đường mới — tránh xa lối mòn du lịch quen thuộc.',
    valueEn:
      "We're constantly scouting new routes — away from the tourist circuits most operators stick to.",
  },
  {
    namespace: 'about',
    key: 'valueProps.03.title',
    valueVi: 'Mọi trình độ',
    valueEn: 'All Rider Levels',
  },
  {
    namespace: 'about',
    key: 'valueProps.03.body',
    valueVi:
      'Từ người mới đến tay lái dày dạn — chúng tôi điều chỉnh tour theo trình độ của bạn.',
    valueEn:
      'New rider or seasoned tourer — we tune the route, pace, and bike to your level.',
  },
  {
    namespace: 'about',
    key: 'valueProps.04.title',
    valueVi: 'Kiến thức bản địa',
    valueEn: 'Local Knowledge',
  },
  {
    namespace: 'about',
    key: 'valueProps.04.body',
    valueVi:
      'Quán ăn ngon nhất, chỗ nghỉ tốt nhất, và những gia đình đón bạn như người thân.',
    valueEn:
      'The best places to eat, the best places to sleep, and the Vietnamese families who will welcome you in.',
  },
  {
    namespace: 'about',
    key: 'team.heading',
    valueVi: 'Đội ngũ',
    valueEn: 'The Crew',
  },
  {
    namespace: 'about',
    key: 'team.subhead',
    valueVi: 'Những người sẽ đồng hành cùng bạn trên từng cây số.',
    valueEn: 'The people who will ride beside you, every kilometer of the way.',
  },
  {namespace: 'about', key: 'team.ageSuffix', valueVi: 'tuổi', valueEn: 'yo'},
  {
    namespace: 'about',
    key: 'cta.headline',
    valueVi: 'Sẵn sàng lên đường?',
    valueEn: 'Ready to ride?',
  },
  {
    namespace: 'about',
    key: 'cta.subhead',
    valueVi: 'Hãy cho chúng tôi biết bạn muốn đi đâu.',
    valueEn: 'Tell us where you want to go.',
  },
  {
    namespace: 'about',
    key: 'cta.button',
    valueVi: 'Lên kế hoạch tour',
    valueEn: 'Plan your tour',
  },
  {
    namespace: 'about',
    key: 'meta.title',
    valueVi: 'Về chúng tôi — Vietnam Motorcycle Tour',
    valueEn: 'About Us — Vietnam Motorcycle Tour',
  },
  {
    namespace: 'about',
    key: 'meta.description',
    valueVi:
      'Công ty tour mô tô độc lập 100% sở hữu trong nước tại Nha Trang. Hơn 15 năm dẫn tour qua những cung đường ít người biết của Việt Nam.',
    valueEn:
      'An independent, 100% locally owned motorcycle tour company in Nha Trang. 15+ years guiding riders through the parts of Vietnam most tours miss.',
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
  console.log(`Seeded ${ENTRIES.length} about.* translations.`);
}

main()
  .catch((err) => {
    console.error('Seed about-translations failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
