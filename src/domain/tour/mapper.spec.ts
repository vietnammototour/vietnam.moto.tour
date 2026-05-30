import {toTour, type PrismaTourWithRelations} from './mapper';

function buildPrismaTour(
  overrides: Partial<PrismaTourWithRelations> = {},
): PrismaTourWithRelations {
  return {
    id: 't1',
    slug: 'da-lat',
    destinationId: 'd1',
    titleVi: 'Tour Da Lat',
    titleEn: 'Da Lat Tour',
    imageUrl: '/da-lat.jpg',
    duration: 2,
    distance: 180,
    descriptionVi: 'Mo ta',
    descriptionEn: 'Description',
    transportation: 'Motorbike',
    hotel: 'Included',
    guided: 'Fully guided',
    images: [],
    itinerary: [],
    pricingGroups: [],
    paymentDetails: {},
    notes: [],
    mealsInfo: {},
    status: 'PUBLISHED',
    isFeatured: false,
    tripAdvisorUrl: null,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-02T00:00:00.000Z'),
    destination: {
      id: 'd1',
      slug: 'da-lat',
      nameVi: 'Da Lat',
      nameEn: 'Da Lat',
      imageUrl: null,
      heroImage: null,
      descriptionVi: '',
      descriptionEn: '',
      size: 'small',
      isActive: true,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    },
    highlights: [],
    perks: [],
    ...overrides,
  };
}

describe('toTour', () => {
  it('carries the isFeatured flag through to the domain Tour', () => {
    expect(toTour(buildPrismaTour({isFeatured: true})).isFeatured).toBe(true);
    expect(toTour(buildPrismaTour({isFeatured: false})).isFeatured).toBe(false);
  });

  it('maps core fields', () => {
    const result = toTour(buildPrismaTour());
    expect(result.slug).toBe('da-lat');
    expect(result.status).toBe('PUBLISHED');
    expect(result.title).toEqual({en: 'Da Lat Tour', vi: 'Tour Da Lat'});
  });
});
