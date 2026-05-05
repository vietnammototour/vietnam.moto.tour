import {
  toursData,
  destinationsData,
  getDestinationById,
  getDestinationName,
  getToursByDestination,
  getActiveDestinations,
} from '@/data';

describe('toursData', () => {
  it('is a non-empty array', () => {
    expect(toursData.length).toBeGreaterThan(0);
  });

  it('each tour has required fields', () => {
    for (const tour of toursData) {
      expect(tour.id).toEqual(expect.any(Number));
      expect(tour.title).toEqual(expect.any(String));
      expect(tour.imageUrl).toEqual(expect.any(String));
      expect(tour.price).toEqual(expect.any(Number));
      expect(tour.duration).toEqual(expect.any(Number));
      expect(tour.distance).toEqual(expect.any(Number));
      expect(tour.destinationId).toEqual(expect.any(Number));
    }
  });

  it('has unique IDs', () => {
    const ids = toursData.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('every tour references an existing destination', () => {
    for (const tour of toursData) {
      const dest = getDestinationById(tour.destinationId);
      expect(dest).toBeDefined();
    }
  });
});

describe('destinationsData', () => {
  it('is a non-empty array', () => {
    expect(destinationsData.length).toBeGreaterThan(0);
  });

  it('each destination has required fields', () => {
    for (const dest of destinationsData) {
      expect(dest.id).toEqual(expect.any(Number));
      expect(dest.name).toEqual(expect.any(String));
      expect(dest.imageUrl).toEqual(expect.any(String));
      expect(['small', 'large']).toContain(dest.size);
    }
  });

  it('has unique IDs', () => {
    const ids = destinationsData.map((d) => d.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('getDestinationById', () => {
  it('returns a destination for a valid ID', () => {
    const dest = getDestinationById(1);
    expect(dest).toBeDefined();
    expect(dest!.name).toBe('Dalat');
  });

  it('returns undefined for an invalid ID', () => {
    expect(getDestinationById(999)).toBeUndefined();
  });
});

describe('getDestinationName', () => {
  it('returns the name for a valid destination ID', () => {
    expect(getDestinationName(1)).toBe('Dalat');
  });

  it('returns empty string for an invalid ID', () => {
    expect(getDestinationName(999)).toBe('');
  });
});

describe('getToursByDestination', () => {
  it('returns tours matching the destination', () => {
    const tours = getToursByDestination(2);
    expect(tours.length).toBeGreaterThan(0);
    for (const tour of tours) {
      expect(tour.destinationId).toBe(2);
    }
  });

  it('returns empty array for destination with no tours', () => {
    expect(getToursByDestination(999)).toEqual([]);
  });
});

describe('getActiveDestinations', () => {
  it('only returns destinations that have at least one tour', () => {
    const active = getActiveDestinations();
    for (const dest of active) {
      expect(dest.tourCount).toBeGreaterThan(0);
    }
  });

  it('computes correct tour counts', () => {
    const active = getActiveDestinations();
    for (const dest of active) {
      const actualCount = toursData.filter(
        (t) => t.destinationId === dest.id,
      ).length;
      expect(dest.tourCount).toBe(actualCount);
    }
  });

  it('preserves destination order from destinationsData', () => {
    const active = getActiveDestinations();
    const activeIds = active.map((d) => d.id);
    const originalOrder = destinationsData
      .filter((d) => activeIds.includes(d.id))
      .map((d) => d.id);
    expect(activeIds).toEqual(originalOrder);
  });

  it('computes correct transport type flags', () => {
    const active = getActiveDestinations();
    for (const dest of active) {
      const tours = toursData.filter((t) => t.destinationId === dest.id);
      const expectedCar = tours.some((t) => /car/i.test(t.transportation));
      const expectedBike = tours.some((t) =>
        /motorbike/i.test(t.transportation),
      );
      expect(dest.hasCar).toBe(expectedCar);
      expect(dest.hasBike).toBe(expectedBike);
    }
  });
});
