import type {Tour, Destination, ContactInfo} from '@/types';

export function buildTour(overrides?: Partial<Tour>): Tour {
  return {
    id: 1,
    title: 'Test Tour',
    imageUrl: '/test-tour.jpg',
    rating: '8.0 Superb',
    price: 80,
    duration: '1 Day',
    distance: '100 Miles',
    location: 'Test City',
    slug: 'test-tour',
    description: {en: 'Test tour description', vi: 'Test tour description'},
    transportation: 'Motorbike',
    groupSize: 'Min 1 Person',
    hotel: 'Pick up & Drop off',
    guided: 'Fully Guided Tour',
    heroImage: '/test-tour.jpg',
    images: [],
    highlights: [],
    itinerary: [
      {
        dayLabel: {en: 'Itinerary', vi: 'Lịch trình'},
        items: [
          {time: '8:00 AM', description: {en: 'Start tour', vi: 'Start tour'}},
        ],
      },
    ],
    pricing: [{label: {en: 'Per Person', vi: 'Mỗi người'}, price: 80}],
    included: [{en: 'Guide', vi: 'Hướng dẫn viên'}],
    excluded: [{en: 'Flights', vi: 'Vé máy bay'}],
    paymentDetails: {en: '20% deposit required', vi: 'Đặt cọc 20%'},
    notes: [{en: 'Check availability', vi: 'Kiểm tra chỗ trống'}],
    mealsInfo: {en: '1 meal included', vi: '1 meal included'},
    ...overrides,
  };
}

export function buildDestination(
  overrides?: Partial<Destination>,
): Destination {
  return {
    id: 1,
    name: 'Test Destination',
    imageUrl: '/test-destination.jpg',
    tours: 3,
    size: 'small',
    ...overrides,
  };
}

export function buildContactInfo(
  overrides?: Partial<ContactInfo>,
): ContactInfo {
  return {
    phone: '+84-000-000-000',
    email: 'test@example.com',
    youtubeLink: 'https://youtube.com/test',
    tripadvisorLink: 'https://tripadvisor.com/test',
    whatsApp: '+84-000-000-000',
    address: '123 Test St.',
    city: 'Test City',
    ...overrides,
  };
}
