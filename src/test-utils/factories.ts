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
