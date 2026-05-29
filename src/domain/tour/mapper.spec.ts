import {toTour, type PrismaTourWithRelations} from './mapper';

function makeRow(
  overrides: Partial<PrismaTourWithRelations> = {},
): PrismaTourWithRelations {
  return {
    id: 't1',
    slug: 'ha-giang',
    destinationId: 'd1',
    titleVi: 'VI',
    titleEn: 'EN',
    imageUrl: null,
    duration: 3,
    distance: 200,
    descriptionVi: '',
    descriptionEn: '',
    transportation: '',
    hotel: '',
    guided: '',
    images: [],
    itinerary: [],
    pricingGroups: [],
    paymentDetails: {},
    notes: [],
    mealsInfo: {},
    status: 'PUBLISHED',
    tripadvisorLocationId: '5501636',
    createdAt: new Date(),
    updatedAt: new Date(),
    destination: {
      id: 'd1',
      nameVi: 'VI',
      nameEn: 'EN',
      heroImage: '',
    } as PrismaTourWithRelations['destination'],
    highlights: [],
    perks: [],
    ...overrides,
  } as PrismaTourWithRelations;
}

describe('toTour tripadvisorLocationId', () => {
  it('passes tripadvisorLocationId through', () => {
    expect(toTour(makeRow()).tripadvisorLocationId).toBe('5501636');
  });

  it('preserves null tripadvisorLocationId', () => {
    expect(
      toTour(makeRow({tripadvisorLocationId: null})).tripadvisorLocationId,
    ).toBeNull();
  });
});
