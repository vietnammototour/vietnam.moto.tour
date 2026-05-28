import {PrismaClient} from '@prisma/client';
import {PrismaPg} from '@prisma/adapter-pg';
import * as fs from 'fs';
import * as path from 'path';

if (!process.env.DATABASE_URL) {
  const candidatePaths = [
    path.join(__dirname, '..', '.env'),
    path.join(__dirname, '..', '..', '..', '.env'), // worktree → main project root
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
  // Public rentals — page chrome
  {
    namespace: 'rentals',
    key: 'title',
    valueEn: 'Motorbike rentals',
    valueVi: 'Cho thuê xe máy',
  },
  {
    namespace: 'rentals',
    key: 'subtitle',
    valueEn: 'Vetted scooters and enduros for self-guided Vietnam journeys.',
    valueVi:
      'Xe ga và xe enduro được kiểm tra kỹ cho hành trình tự lái Việt Nam.',
  },
  {
    namespace: 'rentals',
    key: 'intro',
    valueEn:
      "Vetted bikes for self-guided journeys across Vietnam's most challenging terrain. Every machine in our fleet undergoes a rigorous multi-point inspection to ensure mission readiness from the Ha Giang Loop to the Ho Chi Minh Trail.",
    valueVi:
      'Xe được kiểm định kỹ lưỡng cho hành trình tự lái xuyên những cung đường khó nhất Việt Nam. Mỗi chiếc xe trong đội đều trải qua quy trình kiểm tra nhiều điểm để sẵn sàng từ cung Hà Giang đến đường Hồ Chí Minh.',
  },
  {
    namespace: 'rentals',
    key: 'heroBadge',
    valueEn: 'Vietnam · Self-guided · Scooters & Enduros',
    valueVi: 'Việt Nam · Tự lái · Xe ga & Enduro',
  },
  {
    namespace: 'rentals',
    key: 'vehiclesCount',
    valueEn:
      '{count, plural, =0 {No vehicles} one {# vehicle} other {# vehicles}} · Status: Active',
    valueVi:
      '{count, plural, =0 {Không có xe} other {# xe}} · Trạng thái: Sẵn sàng',
  },
  {
    namespace: 'rentals',
    key: 'transmissionAuto',
    valueEn: 'Automatic',
    valueVi: 'Số tự động',
  },
  {
    namespace: 'rentals',
    key: 'transmissionManual',
    valueEn: 'Manual',
    valueVi: 'Số tay',
  },
  {
    namespace: 'rentals',
    key: 'transmissionLabel',
    valueEn: 'Transmission',
    valueVi: 'Hộp số',
  },
  {
    namespace: 'rentals',
    key: 'availabilityLabel',
    valueEn: 'Availability',
    valueVi: 'Tình trạng',
  },
  {
    namespace: 'rentals',
    key: 'breadcrumbRental',
    valueEn: 'Rentals',
    valueVi: 'Cho thuê',
  },
  {namespace: 'rentals', key: 'perDay', valueEn: '/ day', valueVi: '/ ngày'},
  {namespace: 'rentals', key: 'cc', valueEn: 'cc', valueVi: 'phân khối'},
  {
    namespace: 'rentals',
    key: 'available',
    valueEn: 'Available',
    valueVi: 'Còn xe',
  },
  {
    namespace: 'rentals',
    key: 'outOfStock',
    valueEn: 'Out of stock',
    valueVi: 'Hết xe',
  },

  // Filter
  {namespace: 'rentals.filter', key: 'all', valueEn: 'All', valueVi: 'Tất cả'},
  {
    namespace: 'rentals.filter',
    key: 'scooter',
    valueEn: 'Scooters',
    valueVi: 'Xe ga',
  },
  {
    namespace: 'rentals.filter',
    key: 'bike',
    valueEn: 'Bikes',
    valueVi: 'Xe số',
  },

  // Type
  {
    namespace: 'rentals.type',
    key: 'scooter',
    valueEn: 'Scooter',
    valueVi: 'Xe ga',
  },
  {namespace: 'rentals.type', key: 'bike', valueEn: 'Bike', valueVi: 'Xe số'},

  // Policy
  {
    namespace: 'rentals.policy',
    key: 'title',
    valueEn: 'Rental policy',
    valueVi: 'Chính sách thuê xe',
  },
  {
    namespace: 'rentals.policy.included',
    key: 'title',
    valueEn: 'Included in the price',
    valueVi: 'Bao gồm trong giá',
  },
  {
    namespace: 'rentals.policy.included',
    key: 'helmet',
    valueEn: 'Helmet',
    valueVi: 'Mũ bảo hiểm',
  },
  {
    namespace: 'rentals.policy.included',
    key: 'passengerHelmet',
    valueEn: 'Passenger helmet',
    valueVi: 'Mũ bảo hiểm cho người ngồi sau',
  },
  {
    namespace: 'rentals.policy.included',
    key: 'phoneHolder',
    valueEn: 'Phone holder',
    valueVi: 'Giá đỡ điện thoại',
  },
  {
    namespace: 'rentals.policy.included',
    key: 'rainGear',
    valueEn: 'Rain gear',
    valueVi: 'Áo mưa',
  },
  {
    namespace: 'rentals.policy.included',
    key: 'free',
    valueEn: 'Free',
    valueVi: 'Miễn phí',
  },

  {
    namespace: 'rentals.policy.rules',
    key: 'title',
    valueEn: 'Things to keep in mind',
    valueVi: 'Lưu ý',
  },
  {
    namespace: 'rentals.policy.rules',
    key: 'deposit',
    valueEn: 'Pay only 15% now, the rest at pickup.',
    valueVi: 'Chỉ trả 15% bây giờ, phần còn lại khi nhận xe.',
  },
  {
    namespace: 'rentals.policy.rules',
    key: 'cancellation',
    valueEn: 'Cancel up to 48 hours before pickup for a full refund.',
    valueVi: 'Hủy trước 48 giờ để được hoàn tiền toàn bộ.',
  },
  {
    namespace: 'rentals.policy.rules',
    key: 'license',
    valueEn: 'A valid A1 motorcycle license (or equivalent) is required.',
    valueVi: 'Yêu cầu giấy phép lái xe A1 hợp lệ (hoặc tương đương).',
  },
  {
    namespace: 'rentals.policy.rules',
    key: 'age',
    valueEn: 'Minimum age 20 with 12 months of enduro driving experience.',
    valueVi: 'Tối thiểu 20 tuổi với 12 tháng kinh nghiệm lái xe enduro.',
  },
  {
    namespace: 'rentals.policy.rules',
    key: 'securityDeposit',
    valueEn:
      'Refundable security deposit of US $500 (cash or passport) on pickup.',
    valueVi: 'Đặt cọc hoàn lại 500 USD (tiền mặt hoặc hộ chiếu) khi nhận xe.',
  },
  {
    namespace: 'rentals.policy.rules',
    key: 'mileage',
    valueEn: 'Mileage included is 120 km / day.',
    valueVi: 'Bao gồm 120 km / ngày.',
  },
  {
    namespace: 'rentals.policy.rules',
    key: 'noBorderCrossing',
    valueEn: 'The rental company does not allow crossing country borders.',
    valueVi: 'Công ty không cho phép xe đi qua biên giới.',
  },
  {
    namespace: 'rentals.policy.rules',
    key: 'availability',
    valueEn: 'Free inclusions and paid add-ons are subject to availability.',
    valueVi:
      'Phụ kiện miễn phí và dịch vụ có phí tùy thuộc vào tình trạng còn hàng.',
  },
  {
    namespace: 'rentals.policy.rules',
    key: 'confirmationRequired',
    valueEn:
      'Confirmation required after checkout due to limited availability.',
    valueVi: 'Cần xác nhận sau khi đặt do số lượng có hạn.',
  },

  // Contact CTA
  {
    namespace: 'rentals.contactCta',
    key: 'title',
    valueEn: 'Have questions?',
    valueVi: 'Có câu hỏi?',
  },
  {
    namespace: 'rentals.contactCta',
    key: 'subtitle',
    valueEn: "We're here for you.",
    valueVi: 'Chúng tôi luôn sẵn sàng hỗ trợ.',
  },
  {
    namespace: 'rentals.contactCta',
    key: 'button',
    valueEn: 'Contact us',
    valueVi: 'Liên hệ',
  },

  // Meta
  {
    namespace: 'meta',
    key: 'rentalsTitle',
    valueEn: 'Motorbike Rentals · Vietnam Moto Tour',
    valueVi: 'Cho thuê xe máy · Vietnam Moto Tour',
  },
  {
    namespace: 'meta',
    key: 'rentalsDescription',
    valueEn:
      'Rent vetted scooters and enduro bikes for self-guided Vietnam motorbike journeys.',
    valueVi:
      'Thuê xe ga và xe enduro được kiểm tra kỹ cho hành trình tự lái Việt Nam.',
  },

  // Admin — list + form
  {
    namespace: 'admin.rentals',
    key: 'title',
    valueEn: 'Rentals',
    valueVi: 'Cho thuê',
  },
  {
    namespace: 'admin.rentals',
    key: 'addEntity',
    valueEn: 'Add vehicle',
    valueVi: 'Thêm xe',
  },

  {
    namespace: 'admin.rentals.fields',
    key: 'type',
    valueEn: 'Type',
    valueVi: 'Loại xe',
  },
  {
    namespace: 'admin.rentals.fields',
    key: 'brand',
    valueEn: 'Brand',
    valueVi: 'Hãng',
  },
  {
    namespace: 'admin.rentals.fields',
    key: 'model',
    valueEn: 'Model',
    valueVi: 'Dòng xe',
  },
  {
    namespace: 'admin.rentals.fields',
    key: 'cc',
    valueEn: 'Engine (cc)',
    valueVi: 'Động cơ (cc)',
  },
  {
    namespace: 'admin.rentals.fields',
    key: 'quantity',
    valueEn: 'Quantity in stock',
    valueVi: 'Số lượng tồn',
  },
  {
    namespace: 'admin.rentals.fields',
    key: 'priceUsdPerDay',
    valueEn: 'Price / day (USD)',
    valueVi: 'Giá / ngày (USD)',
  },
  {
    namespace: 'admin.rentals.fields',
    key: 'description',
    valueEn: 'Description',
    valueVi: 'Mô tả',
  },
  {
    namespace: 'admin.rentals.fields',
    key: 'images',
    valueEn: 'Images',
    valueVi: 'Hình ảnh',
  },
  {
    namespace: 'admin.rentals.fields',
    key: 'imageUrl',
    valueEn: 'Primary image',
    valueVi: 'Ảnh chính',
  },
  {
    namespace: 'admin.rentals.fields',
    key: 'status',
    valueEn: 'Status',
    valueVi: 'Trạng thái',
  },
  {
    namespace: 'admin.rentals.fields',
    key: 'order',
    valueEn: 'Sort order',
    valueVi: 'Thứ tự',
  },
  {
    namespace: 'admin.rentals.fields',
    key: 'slug',
    valueEn: 'Slug',
    valueVi: 'Slug',
  },

  {
    namespace: 'admin.rentals.tabs',
    key: 'general',
    valueEn: 'General',
    valueVi: 'Chung',
  },
  {
    namespace: 'admin.rentals.tabs',
    key: 'description',
    valueEn: 'Description',
    valueVi: 'Mô tả',
  },
  {
    namespace: 'admin.rentals.tabs',
    key: 'images',
    valueEn: 'Images',
    valueVi: 'Hình ảnh',
  },

  {
    namespace: 'admin.rentals.status',
    key: 'DRAFT',
    valueEn: 'Draft',
    valueVi: 'Bản nháp',
  },
  {
    namespace: 'admin.rentals.status',
    key: 'PUBLISHED',
    valueEn: 'Published',
    valueVi: 'Đã đăng',
  },
  {
    namespace: 'admin.rentals.status',
    key: 'ARCHIVED',
    valueEn: 'Archived',
    valueVi: 'Đã lưu trữ',
  },

  {
    namespace: 'admin.rentals.confirmDelete',
    key: 'title',
    valueEn: 'Archive this vehicle?',
    valueVi: 'Lưu trữ xe này?',
  },
  {
    namespace: 'admin.rentals.confirmDelete',
    key: 'body',
    valueEn:
      'This vehicle will move to the archive and be hidden from the public page. You can restore it later.',
    valueVi:
      'Xe này sẽ được chuyển vào kho lưu trữ và ẩn khỏi trang công khai. Bạn có thể khôi phục sau.',
  },

  {
    namespace: 'admin.rentals.archive',
    key: 'title',
    valueEn: 'Rentals · Archive',
    valueVi: 'Cho thuê · Lưu trữ',
  },
  {
    namespace: 'admin.rentals.archive',
    key: 'empty',
    valueEn: 'No archived vehicles.',
    valueVi: 'Không có xe nào trong kho lưu trữ.',
  },

  {
    namespace: 'admin.rentals.list',
    key: 'empty',
    valueEn: 'No vehicles yet. Click "Add vehicle" to create the first one.',
    valueVi: 'Chưa có xe nào. Nhấn "Thêm xe" để tạo xe đầu tiên.',
  },
  {
    namespace: 'admin.rentals.list',
    key: 'searchPlaceholder',
    valueEn: 'Search by brand or model…',
    valueVi: 'Tìm theo hãng hoặc dòng xe…',
  },
];

async function main() {
  for (const e of entries) {
    await prisma.translation.upsert({
      where: {namespace_key: {namespace: e.namespace, key: e.key}},
      update: {valueVi: e.valueVi, valueEn: e.valueEn},
      create: e,
    });
  }
  console.log(`Seeded ${entries.length} rentals translations.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
