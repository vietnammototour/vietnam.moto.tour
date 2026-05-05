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
          // Strip surrounding quotes
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

interface RawDestination {
  id: number;
  name: string;
  imageUrl: string;
  heroImage: string;
  size: string;
}

interface RawTour {
  id: number;
  title: string;
  imageUrl: string;
  rating: string;
  price: number;
  duration: string;
  distance: string;
  destinationId: number;
  slug: string;
  description: {en: string; vi: string};
  transportation: string;
  groupSize: string;
  hotel: string;
  guided: string;
  images: string[];
  highlights: Array<{en: string; vi: string}>;
  itinerary: unknown[];
  pricingGroups: unknown[];
  included: Array<{en: string; vi: string}>;
  excluded: Array<{en: string; vi: string}>;
  paymentDetails: {en: string; vi: string};
  notes: Array<{en: string; vi: string}>;
  mealsInfo: {en: string; vi: string};
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

async function main(): Promise<void> {
  const dataDir = path.join(__dirname, '..', 'src', 'data');
  // Read source data
  const destinations: RawDestination[] = JSON.parse(
    fs.readFileSync(path.join(dataDir, 'destinations.json'), 'utf-8'),
  );
  const tours: RawTour[] = JSON.parse(
    fs.readFileSync(path.join(dataDir, 'tours.json'), 'utf-8'),
  );

  console.log(
    `Read ${destinations.length} destinations, ${tours.length} tours`,
  );

  // --- Seed Destinations ---
  const destinationIdMap = new Map<number, string>(); // old numeric ID -> new UUID

  // Build heroImage map: destinationId -> heroImage from first matching tour
  const destHeroImageMap = new Map<number, string>();
  for (const tour of tours) {
    if (!destHeroImageMap.has(tour.destinationId)) {
      destHeroImageMap.set(tour.destinationId, '');
    }
  }

  for (const dest of destinations) {
    const slug = slugify(dest.name);
    const heroImage = dest.heroImage || destHeroImageMap.get(dest.id) || '';
    const created = await prisma.destination.upsert({
      where: {slug},
      update: {},
      create: {
        slug,
        name: dest.name,
        nameVi: dest.name,
        nameEn: dest.name,
        imageUrl: dest.imageUrl,
        heroImage,
        size: dest.size,
      },
    });
    destinationIdMap.set(dest.id, created.id);
    console.log(`  Destination: ${dest.name} -> ${created.id}`);
  }

  console.log(`Seeded ${destinations.length} destinations`);

  // --- Seed Tours ---
  for (const tour of tours) {
    const destinationUuid = destinationIdMap.get(tour.destinationId);
    if (!destinationUuid) {
      console.error(
        `  ERROR: No destination mapping for destinationId=${tour.destinationId} (tour: ${tour.title})`,
      );
      continue;
    }

    await prisma.tour.upsert({
      where: {slug: tour.slug},
      update: {},
      create: {
        slug: tour.slug,
        title: tour.title,
        titleVi: tour.title,
        titleEn: tour.title,
        destinationId: destinationUuid,
        imageUrl: tour.imageUrl,
        rating: tour.rating,
        price: tour.price,
        duration: tour.duration,
        distance: tour.distance,
        descriptionVi: tour.description.vi,
        descriptionEn: tour.description.en,
        transportation: tour.transportation,
        groupSize: tour.groupSize,
        hotel: tour.hotel,
        guided: tour.guided,
        images: tour.images,
        highlights: tour.highlights,
        itinerary: tour.itinerary,
        pricingGroups: tour.pricingGroups,
        included: tour.included,
        excluded: tour.excluded,
        paymentDetails: tour.paymentDetails,
        notes: tour.notes,
        mealsInfo: tour.mealsInfo,
      },
    });
    console.log(`  Tour: ${tour.title} -> destination ${destinationUuid}`);
  }

  console.log(`Seeded ${tours.length} tours`);

  // --- Seed Translations ---
  const translations: {
    namespace: string;
    key: string;
    valueEn: string;
    valueVi: string;
  }[] = [
    // header
    {namespace: 'header', key: 'home', valueEn: 'Home', valueVi: 'Trang chủ'},
    {
      namespace: 'header',
      key: 'tours',
      valueEn: 'Tours',
      valueVi: 'Tour du lịch',
    },
    {
      namespace: 'header',
      key: 'rental',
      valueEn: 'Rental',
      valueVi: 'Thuê xe',
    },
    {
      namespace: 'header',
      key: 'aboutUs',
      valueEn: 'About Us',
      valueVi: 'Về chúng tôi',
    },
    {
      namespace: 'header',
      key: 'contact',
      valueEn: 'Contact',
      valueVi: 'Liên hệ',
    },
    {namespace: 'header', key: 'admin', valueEn: 'Admin', valueVi: 'Admin'},
    {
      namespace: 'header',
      key: 'login',
      valueEn: 'Login',
      valueVi: 'Đăng nhập',
    },
    {
      namespace: 'header',
      key: 'logout',
      valueEn: 'Logout',
      valueVi: 'Đăng xuất',
    },
    // footer
    {
      namespace: 'footer',
      key: 'copyright',
      valueEn: '© {year} Vietnam Moto Tour. All rights reserved.',
      valueVi: '© {year} Vietnam Moto Tour. Bảo lưu mọi quyền.',
    },
    // common
    {
      namespace: 'common',
      key: 'tours',
      valueEn: '{count, plural, =0 {tours} =1 {tour} other {tours}}',
      valueVi: 'tour',
    },
    {
      namespace: 'common',
      key: 'motorbike',
      valueEn: 'Motorbike',
      valueVi: 'Xe máy',
    },
    {namespace: 'common', key: 'car', valueEn: 'Car', valueVi: 'Ô tô'},
    {
      namespace: 'common',
      key: 'perPerson',
      valueEn: 'per person',
      valueVi: 'mỗi người',
    },
    // ThemeToggle
    {
      namespace: 'ThemeToggle',
      key: 'label',
      valueEn: 'Theme',
      valueVi: 'Giao diện',
    },
    {
      namespace: 'ThemeToggle',
      key: 'dark',
      valueEn: 'Dark',
      valueVi: 'Tối',
    },
    {
      namespace: 'ThemeToggle',
      key: 'light',
      valueEn: 'Light',
      valueVi: 'Sáng',
    },
    // meta
    {
      namespace: 'meta',
      key: 'homeTitle',
      valueEn: 'Vietnam Moto Tour - Motorcycle Tours in Vietnam',
      valueVi: 'Vietnam Moto Tour - Tour xe máy tại Việt Nam',
    },
    {
      namespace: 'meta',
      key: 'homeDescription',
      valueEn:
        'Explore Vietnam on two wheels with our guided motorcycle tours through Ha Giang, Dalat, and more.',
      valueVi:
        'Khám phá Việt Nam trên hai bánh với các tour xe máy qua Hà Giang, Đà Lạt và nhiều nơi khác.',
    },
    {
      namespace: 'meta',
      key: 'tourDetailTitle',
      valueEn: '{title} - Vietnam Moto Tour',
      valueVi: '{title} - Vietnam Moto Tour',
    },
    {
      namespace: 'meta',
      key: 'rentalTitle',
      valueEn: 'Motorbike Rental - Vietnam Moto Tour',
      valueVi: 'Thuê xe máy - Vietnam Moto Tour',
    },
    {
      namespace: 'meta',
      key: 'rentalDescription',
      valueEn: 'Rent a motorbike for your Vietnam adventure.',
      valueVi: 'Thuê xe máy cho chuyến phiêu lưu Việt Nam của bạn.',
    },
    {
      namespace: 'meta',
      key: 'contactTitle',
      valueEn: 'Contact Us - Vietnam Moto Tour',
      valueVi: 'Liên hệ - Vietnam Moto Tour',
    },
    {
      namespace: 'meta',
      key: 'contactDescription',
      valueEn: 'Get in touch with our team to plan your motorcycle tour.',
      valueVi: 'Liên hệ với đội ngũ của chúng tôi để lên kế hoạch tour xe máy.',
    },
    {
      namespace: 'meta',
      key: 'toursTitle',
      valueEn: 'All Tours - Vietnam Moto Tour',
      valueVi: 'Tất cả Tour - Vietnam Moto Tour',
    },
    {
      namespace: 'meta',
      key: 'toursDescription',
      valueEn: 'Browse all motorcycle tours available in Vietnam.',
      valueVi: 'Xem tất cả các tour xe máy tại Việt Nam.',
    },
    {
      namespace: 'meta',
      key: 'aboutTitle',
      valueEn: 'About Us - Vietnam Moto Tour',
      valueVi: 'Về chúng tôi - Vietnam Moto Tour',
    },
    {
      namespace: 'meta',
      key: 'aboutDescription',
      valueEn:
        'Learn about our team and passion for motorcycle touring in Vietnam.',
      valueVi:
        'Tìm hiểu về đội ngũ và niềm đam mê tour xe máy tại Việt Nam của chúng tôi.',
    },
    // home
    {
      namespace: 'home',
      key: 'heroSubtitle',
      valueEn: 'Discover Vietnam',
      valueVi: 'Khám phá Việt Nam',
    },
    {
      namespace: 'home',
      key: 'heroTitle',
      valueEn: 'Ride Through the Heart of Vietnam',
      valueVi: 'Lái xe qua trái tim Việt Nam',
    },
    {
      namespace: 'home',
      key: 'bookWithUsNow',
      valueEn: 'Book With Us Now',
      valueVi: 'Đặt tour ngay',
    },
    {
      namespace: 'home',
      key: 'destinationLists',
      valueEn: 'Destination Lists',
      valueVi: 'Danh sách điểm đến',
    },
    {
      namespace: 'home',
      key: 'goExoticPlaces',
      valueEn: 'Go Exotic Places',
      valueVi: 'Đến những nơi kỳ thú',
    },
    {
      namespace: 'home',
      key: 'galleryAlt1',
      valueEn: 'Vietnam motorcycle touring',
      valueVi: 'Du lịch xe máy Việt Nam',
    },
    {
      namespace: 'home',
      key: 'galleryAlt2',
      valueEn: 'Mountain pass riding',
      valueVi: 'Lái xe qua đèo núi',
    },
    {
      namespace: 'home',
      key: 'galleryAlt3',
      valueEn: 'Scenic route',
      valueVi: 'Cung đường phong cảnh',
    },
    {
      namespace: 'home',
      key: 'galleryAlt4',
      valueEn: 'Local village visit',
      valueVi: 'Thăm làng bản địa',
    },
    {
      namespace: 'home',
      key: 'galleryAlt5',
      valueEn: 'Coastal ride',
      valueVi: 'Lái xe ven biển',
    },
    {
      namespace: 'home',
      key: 'comingSoon',
      valueEn: 'Coming Soon',
      valueVi: 'Sắp ra mắt',
    },
    {
      namespace: 'home',
      key: 'bookTourNow',
      valueEn: 'Book Tour Now',
      valueVi: 'Đặt tour ngay',
    },
    {
      namespace: 'home',
      key: 'getToKnowUs',
      valueEn: 'Get To Know Us',
      valueVi: 'Tìm hiểu về chúng tôi',
    },
    {
      namespace: 'home',
      key: 'planYourTrip',
      valueEn: 'Plan Your Trip',
      valueVi: 'Lên kế hoạch chuyến đi',
    },
    {
      namespace: 'home',
      key: 'aboutDescription',
      valueEn:
        'We are a team of passionate riders who know every hidden corner of Vietnam.',
      valueVi:
        'Chúng tôi là đội ngũ những tay lái đam mê, biết từng ngóc ngách của Việt Nam.',
    },
    {
      namespace: 'home',
      key: 'bulletMotorbike',
      valueEn: 'Quality motorbikes',
      valueVi: 'Xe máy chất lượng',
    },
    {
      namespace: 'home',
      key: 'bulletFriendly',
      valueEn: 'Friendly guides',
      valueVi: 'Hướng dẫn viên thân thiện',
    },
    {
      namespace: 'home',
      key: 'bulletExperience',
      valueEn: 'Years of experience',
      valueVi: 'Nhiều năm kinh nghiệm',
    },
    {
      namespace: 'home',
      key: 'featuredTours',
      valueEn: 'Featured Tours',
      valueVi: 'Tour nổi bật',
    },
    {
      namespace: 'home',
      key: 'mostPopularTours',
      valueEn: 'Most Popular Tours',
      valueVi: 'Tour phổ biến nhất',
    },
    {
      namespace: 'home',
      key: 'readyToTravel',
      valueEn: 'Ready to Travel?',
      valueVi: 'Sẵn sàng lên đường?',
    },
    {
      namespace: 'home',
      key: 'videoSectionHeading',
      valueEn: 'See Vietnam in Action',
      valueVi: 'Xem Việt Nam sống động',
    },
    {
      namespace: 'home',
      key: 'localExperts',
      valueEn: 'Local Experts',
      valueVi: 'Chuyên gia địa phương',
    },
    {
      namespace: 'home',
      key: 'hiddenRoutes',
      valueEn: 'Hidden Routes',
      valueVi: 'Cung đường ẩn',
    },
    {
      namespace: 'home',
      key: 'yearsOnRoad',
      valueEn: 'Years on the Road',
      valueVi: 'Năm trên cung đường',
    },
    {
      namespace: 'home',
      key: 'dayAndMultiDay',
      valueEn: 'Day & Multi-Day',
      valueVi: 'Một ngày & nhiều ngày',
    },
    {
      namespace: 'home',
      key: 'smallGroups',
      valueEn: 'Small Groups',
      valueVi: 'Nhóm nhỏ',
    },
    {
      namespace: 'home',
      key: 'allInclusive',
      valueEn: 'All Inclusive',
      valueVi: 'Trọn gói',
    },
    // tourDetail
    {
      namespace: 'tourDetail',
      key: 'pricing',
      valueEn: 'Pricing',
      valueVi: 'Bảng giá',
    },
    {
      namespace: 'tourDetail',
      key: 'people',
      valueEn: 'people',
      valueVi: 'người',
    },
    {
      namespace: 'tourDetail',
      key: 'days',
      valueEn: 'days',
      valueVi: 'ngày',
    },
    {namespace: 'tourDetail', key: 'from', valueEn: 'From', valueVi: 'Từ'},
    {
      namespace: 'tourDetail',
      key: 'perPerson',
      valueEn: 'per person',
      valueVi: 'mỗi người',
    },
    {
      namespace: 'tourDetail',
      key: 'breadcrumbHome',
      valueEn: 'Home',
      valueVi: 'Trang chủ',
    },
    {
      namespace: 'tourDetail',
      key: 'breadcrumbTours',
      valueEn: 'Tours',
      valueVi: 'Tour du lịch',
    },
    {
      namespace: 'tourDetail',
      key: 'aboutThisTour',
      valueEn: 'About This Tour',
      valueVi: 'Về tour này',
    },
    {
      namespace: 'tourDetail',
      key: 'highlights',
      valueEn: 'Highlights',
      valueVi: 'Điểm nổi bật',
    },
    {
      namespace: 'tourDetail',
      key: 'howManyPeople',
      valueEn: 'How many people?',
      valueVi: 'Bao nhiêu người?',
    },
    {
      namespace: 'tourDetail',
      key: 'decreasePeople',
      valueEn: 'Decrease',
      valueVi: 'Giảm',
    },
    {
      namespace: 'tourDetail',
      key: 'increasePeople',
      valueEn: 'Increase',
      valueVi: 'Tăng',
    },
    {
      namespace: 'tourDetail',
      key: 'pricingPerPerson',
      valueEn: 'per person',
      valueVi: 'mỗi người',
    },
    {
      namespace: 'tourDetail',
      key: 'largerGroupBetterPrice',
      valueEn: 'Larger group = better price!',
      valueVi: 'Nhóm lớn hơn = giá tốt hơn!',
    },
    {namespace: 'tourDetail', key: 'pax', valueEn: 'pax', valueVi: 'khách'},
    {
      namespace: 'tourDetail',
      key: 'transportation',
      valueEn: 'Transportation',
      valueVi: 'Phương tiện',
    },
    {
      namespace: 'tourDetail',
      key: 'duration',
      valueEn: 'Duration',
      valueVi: 'Thời gian',
    },
    {
      namespace: 'tourDetail',
      key: 'distance',
      valueEn: 'Distance',
      valueVi: 'Khoảng cách',
    },
    {
      namespace: 'tourDetail',
      key: 'group',
      valueEn: 'Group Size',
      valueVi: 'Kích thước nhóm',
    },
    {
      namespace: 'tourDetail',
      key: 'hotel',
      valueEn: 'Hotel',
      valueVi: 'Khách sạn',
    },
    {
      namespace: 'tourDetail',
      key: 'guided',
      valueEn: 'Guided',
      valueVi: 'Có hướng dẫn',
    },
    {
      namespace: 'tourDetail',
      key: 'tourDetails',
      valueEn: 'Tour Details',
      valueVi: 'Chi tiết tour',
    },
    {
      namespace: 'tourDetail',
      key: 'payment',
      valueEn: 'Payment',
      valueVi: 'Thanh toán',
    },
    {
      namespace: 'tourDetail',
      key: 'whatsappUs',
      valueEn: 'WhatsApp Us',
      valueVi: 'Nhắn WhatsApp',
    },
    {
      namespace: 'tourDetail',
      key: 'emailInquiry',
      valueEn: 'Email Inquiry',
      valueVi: 'Gửi email',
    },
    {
      namespace: 'tourDetail',
      key: 'itinerary',
      valueEn: 'Itinerary',
      valueVi: 'Lịch trình',
    },
    {
      namespace: 'tourDetail',
      key: 'whatsIncluded',
      valueEn: "What's Included",
      valueVi: 'Bao gồm',
    },
    {
      namespace: 'tourDetail',
      key: 'whatsNotIncluded',
      valueEn: "What's Not Included",
      valueVi: 'Không bao gồm',
    },
    {
      namespace: 'tourDetail',
      key: 'importantNotes',
      valueEn: 'Important Notes',
      valueVi: 'Lưu ý quan trọng',
    },
    {
      namespace: 'tourDetail',
      key: 'meals',
      valueEn: 'Meals',
      valueVi: 'Bữa ăn',
    },
    // tours listing
    {
      namespace: 'tours',
      key: 'title',
      valueEn: 'All Tours',
      valueVi: 'Tất cả Tour',
    },
    {
      namespace: 'tours',
      key: 'breadcrumbHome',
      valueEn: 'Home',
      valueVi: 'Trang chủ',
    },
    {
      namespace: 'tours',
      key: 'breadcrumbTours',
      valueEn: 'Tours',
      valueVi: 'Tour du lịch',
    },
    // rental
    {
      namespace: 'rental',
      key: 'title',
      valueEn: 'Motorbike Rental',
      valueVi: 'Thuê xe máy',
    },
    {
      namespace: 'rental',
      key: 'breadcrumbHome',
      valueEn: 'Home',
      valueVi: 'Trang chủ',
    },
    {
      namespace: 'rental',
      key: 'breadcrumbRental',
      valueEn: 'Rental',
      valueVi: 'Thuê xe',
    },
    {
      namespace: 'rental',
      key: 'perDay',
      valueEn: 'per day',
      valueVi: 'mỗi ngày',
    },
    // contact
    {
      namespace: 'contact',
      key: 'title',
      valueEn: 'Contact Us',
      valueVi: 'Liên hệ',
    },
    {
      namespace: 'contact',
      key: 'breadcrumbHome',
      valueEn: 'Home',
      valueVi: 'Trang chủ',
    },
    {
      namespace: 'contact',
      key: 'breadcrumbContact',
      valueEn: 'Contact',
      valueVi: 'Liên hệ',
    },
    {
      namespace: 'contact',
      key: 'talkWithTeam',
      valueEn: 'Talk With Our Team',
      valueVi: 'Liên hệ với đội ngũ',
    },
    {
      namespace: 'contact',
      key: 'anyQuestion',
      valueEn: 'Have any questions? We are here to help.',
      valueVi: 'Bạn có câu hỏi? Chúng tôi sẵn sàng hỗ trợ.',
    },
    {
      namespace: 'contact',
      key: 'namePlaceholder',
      valueEn: 'Your Name',
      valueVi: 'Tên của bạn',
    },
    {
      namespace: 'contact',
      key: 'emailPlaceholder',
      valueEn: 'Your Email',
      valueVi: 'Email của bạn',
    },
    {
      namespace: 'contact',
      key: 'messagePlaceholder',
      valueEn: 'Your Message',
      valueVi: 'Tin nhắn của bạn',
    },
    {
      namespace: 'contact',
      key: 'sendMessage',
      valueEn: 'Send Message',
      valueVi: 'Gửi tin nhắn',
    },
    // about
    {
      namespace: 'about',
      key: 'title',
      valueEn: 'About Us',
      valueVi: 'Về chúng tôi',
    },
    {
      namespace: 'about',
      key: 'breadcrumbHome',
      valueEn: 'Home',
      valueVi: 'Trang chủ',
    },
    {
      namespace: 'about',
      key: 'breadcrumbPages',
      valueEn: 'Pages',
      valueVi: 'Trang',
    },
    {
      namespace: 'about',
      key: 'breadcrumbAbout',
      valueEn: 'About',
      valueVi: 'Giới thiệu',
    },
    {
      namespace: 'about',
      key: 'learnAboutUs',
      valueEn: 'Learn About Us',
      valueVi: 'Tìm hiểu về chúng tôi',
    },
    {
      namespace: 'about',
      key: 'dareToExplore',
      valueEn: 'Dare to Explore',
      valueVi: 'Dám khám phá',
    },
    {
      namespace: 'about',
      key: 'perfectPlace',
      valueEn: 'The Perfect Place to Start',
      valueVi: 'Nơi hoàn hảo để bắt đầu',
    },
    {
      namespace: 'about',
      key: 'aboutDescription',
      valueEn:
        'We provide the best motorcycle touring experience in Vietnam with local expertise.',
      valueVi:
        'Chúng tôi mang đến trải nghiệm tour xe máy tốt nhất Việt Nam với chuyên môn địa phương.',
    },
    {
      namespace: 'about',
      key: 'bestServices',
      valueEn: 'Best Services',
      valueVi: 'Dịch vụ tốt nhất',
    },
    {
      namespace: 'about',
      key: 'tourAgents',
      valueEn: 'Tour Agents',
      valueVi: 'Đại lý tour',
    },
    {
      namespace: 'about',
      key: 'planYourTrip',
      valueEn: 'Plan Your Trip',
      valueVi: 'Lên kế hoạch chuyến đi',
    },
    {
      namespace: 'about',
      key: 'readyForTour',
      valueEn: 'Ready for Your Tour?',
      valueVi: 'Sẵn sàng cho chuyến đi?',
    },
    {
      namespace: 'about',
      key: 'bookTourNow',
      valueEn: 'Book Tour Now',
      valueVi: 'Đặt tour ngay',
    },
    {
      namespace: 'about',
      key: 'readyToTravel',
      valueEn: 'Ready to Travel?',
      valueVi: 'Sẵn sàng lên đường?',
    },
    {
      namespace: 'about',
      key: 'platformDescription',
      valueEn:
        'Your trusted platform for motorcycle adventures across Vietnam.',
      valueVi:
        'Nền tảng tin cậy cho những chuyến phiêu lưu xe máy khắp Việt Nam.',
    },
    {
      namespace: 'about',
      key: 'totalTours',
      valueEn: 'Total Tours',
      valueVi: 'Tổng số tour',
    },
    {
      namespace: 'about',
      key: 'happyRiders',
      valueEn: 'Happy Riders',
      valueVi: 'Khách hài lòng',
    },
    {
      namespace: 'about',
      key: 'happyPeople',
      valueEn: 'Happy People',
      valueVi: 'Người hài lòng',
    },
    {
      namespace: 'about',
      key: 'yearsExperience',
      valueEn: 'Years Experience',
      valueVi: 'Năm kinh nghiệm',
    },
  ];

  let seeded = 0;
  for (const t of translations) {
    await prisma.translation.upsert({
      where: {
        namespace_key: {namespace: t.namespace, key: t.key},
      },
      update: {},
      create: t,
    });
    seeded++;
  }
  console.log(
    `Seeded ${seeded} translations (upsert, existing values preserved)`,
  );

  console.log('Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
