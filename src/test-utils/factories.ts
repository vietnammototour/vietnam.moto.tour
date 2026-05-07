import type * as VMT from '@/domain';
import type {ContactInfo} from '@/utils/contact';

export function buildTour(overrides?: Partial<VMT.Tour>): VMT.Tour {
  return {
    id: 'tour-1',
    title: {en: 'Test Tour', vi: 'Test Tour'},
    imageUrl: '/test-tour.jpg',
    duration: 1,
    distance: 100,
    destinationId: 'dest-1',
    slug: 'test-tour',
    status: 'PUBLISHED',
    description: {en: 'Test tour description', vi: 'Test tour description'},
    transportation: 'Motorbike',
    hotel: 'Pick up & Drop off',
    guided: 'Fully Guided Tour',
    destinationHeroImage: '',
    destinationName: 'Test Destination',
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
    pricingGroups: [
      {
        type: 'vehicle' as const,
        label: {en: 'By Motorbike', vi: 'Xe Máy'},
        icon: 'motorcycle',
        tiers: [
          {
            label: {en: 'Ride as passenger', vi: 'Ngồi sau'},
            description: {
              en: 'Sit back and enjoy the ride',
              vi: 'Ngồi sau và tận hưởng',
            },
            price: 65,
          },
        ],
      },
    ],
    paymentDetails: {en: '20% deposit required', vi: 'Đặt cọc 20%'},
    notes: [{en: 'Check availability', vi: 'Kiểm tra chỗ trống'}],
    mealsInfo: {en: '1 meal included', vi: '1 meal included'},
    ...overrides,
  };
}

export function buildDestination(
  overrides?: Partial<VMT.Destination>,
): VMT.Destination {
  return {
    id: 'dest-1',
    slug: 'test-destination',
    name: 'Test Destination',
    imageUrl: '/test-destination.jpg',
    heroImage: '',
    size: 'small',
    isActive: true,
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
