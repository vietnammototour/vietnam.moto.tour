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
  // Public reviews section (home + tour)
  {namespace: 'reviews', key: 'eyebrow', valueEn: 'Field reports', valueVi: 'Đánh giá thực tế'},
  {namespace: 'reviews', key: 'heading', valueEn: 'What riders say', valueVi: 'Khách nói gì về chúng tôi'},
  {namespace: 'reviews', key: 'tourHeading', valueEn: 'Traveller reviews', valueVi: 'Đánh giá của khách'},
  {namespace: 'reviews', key: 'verifiedOn', valueEn: 'Verified on TripAdvisor', valueVi: 'Xác minh trên TripAdvisor'},
  {namespace: 'reviews', key: 'viewAllOnTripAdvisor', valueEn: 'View all on TripAdvisor', valueVi: 'Xem tất cả trên TripAdvisor'},
  {namespace: 'reviews', key: 'photoNth', valueEn: 'Photo {n}', valueVi: 'Ảnh {n}'},

  // Admin — reviews CRUD
  {namespace: 'admin.reviews', key: 'title', valueEn: 'Reviews', valueVi: 'Đánh giá'},
  {namespace: 'admin.reviews', key: 'add', valueEn: 'Add review', valueVi: 'Thêm đánh giá'},
  {namespace: 'admin.reviews', key: 'editTitle', valueEn: 'Edit review', valueVi: 'Sửa đánh giá'},
  {namespace: 'admin.reviews', key: 'tourLabel', valueEn: 'Tour', valueVi: 'Tour'},
  {namespace: 'admin.reviews', key: 'tourPlaceholder', valueEn: 'Select a tour', valueVi: 'Chọn tour'},
  {namespace: 'admin.reviews', key: 'reviewerNameLabel', valueEn: 'Reviewer name', valueVi: 'Tên người đánh giá'},
  {namespace: 'admin.reviews', key: 'reviewerLocationLabel', valueEn: 'Reviewer location', valueVi: 'Nơi ở'},
  {namespace: 'admin.reviews', key: 'avatarUrlLabel', valueEn: 'Avatar URL', valueVi: 'URL ảnh đại diện'},
  {namespace: 'admin.reviews', key: 'ratingLabel', valueEn: 'Rating (1-5)', valueVi: 'Đánh giá (1-5)'},
  {namespace: 'admin.reviews', key: 'titleLabel', valueEn: 'Review title', valueVi: 'Tiêu đề'},
  {namespace: 'admin.reviews', key: 'bodyLabel', valueEn: 'Review text', valueVi: 'Nội dung'},
  {namespace: 'admin.reviews', key: 'reviewDateLabel', valueEn: 'Review date', valueVi: 'Ngày đánh giá'},
  {namespace: 'admin.reviews', key: 'sourceUrlLabel', valueEn: 'TripAdvisor link', valueVi: 'Liên kết TripAdvisor'},
  {namespace: 'admin.reviews', key: 'imagesLabel', valueEn: 'Photo links (up to 5)', valueVi: 'Liên kết ảnh (tối đa 5)'},
  {namespace: 'admin.reviews', key: 'imageUrlNth', valueEn: 'Photo URL {n}', valueVi: 'URL ảnh {n}'},
  {namespace: 'admin.reviews', key: 'displayOrderLabel', valueEn: 'Display order', valueVi: 'Thứ tự hiển thị'},
  {namespace: 'admin.reviews', key: 'isFeaturedLabel', valueEn: 'Show on home page', valueVi: 'Hiển thị trên trang chủ'},
  {namespace: 'admin.reviews', key: 'featuredColumn', valueEn: 'Featured', valueVi: 'Nổi bật'},
  {namespace: 'admin.reviews', key: 'featuredYes', valueEn: 'Yes', valueVi: 'Có'},
  {namespace: 'admin.reviews', key: 'deleteConfirm', valueEn: 'Delete review by {name}?', valueVi: 'Xóa đánh giá của {name}?'},
  {namespace: 'admin.reviews', key: 'validation.tourRequired', valueEn: 'Tour is required', valueVi: 'Vui lòng chọn tour'},
  {namespace: 'admin.reviews', key: 'validation.nameRequired', valueEn: 'Reviewer name is required', valueVi: 'Vui lòng nhập tên'},
  {namespace: 'admin.reviews', key: 'validation.bodyRequired', valueEn: 'Review text is required', valueVi: 'Vui lòng nhập nội dung'},
  {namespace: 'admin.reviews', key: 'validation.dateRequired', valueEn: 'Review date is required', valueVi: 'Vui lòng nhập ngày'},
  {namespace: 'admin.reviews', key: 'validation.sourceRequired', valueEn: 'TripAdvisor link is required', valueVi: 'Vui lòng nhập liên kết'},
  {namespace: 'admin.reviews', key: 'validation.urlInvalid', valueEn: 'Must be a valid URL', valueVi: 'URL không hợp lệ'},
  {namespace: 'admin.reviews', key: 'validation.ratingRange', valueEn: 'Rating must be 1-5', valueVi: 'Đánh giá phải từ 1 đến 5'},
  {namespace: 'admin.reviews', key: 'validation.displayOrderRange', valueEn: 'Display order must be 0 or greater', valueVi: 'Thứ tự hiển thị phải từ 0 trở lên'},

  // Admin — tour general tab
  {namespace: 'admin.tours', key: 'tripAdvisorUrlLabel', valueEn: 'TripAdvisor page URL', valueVi: 'URL trang TripAdvisor'},
];

async function main() {
  for (const e of entries) {
    await prisma.translation.upsert({
      where: {namespace_key: {namespace: e.namespace, key: e.key}},
      update: {valueVi: e.valueVi, valueEn: e.valueEn},
      create: e,
    });
  }
  console.log(`Seeded ${entries.length} reviews translations.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
