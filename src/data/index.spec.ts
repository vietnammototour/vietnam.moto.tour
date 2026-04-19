import {toursData, destinationsData} from '@/data';

describe('toursData', () => {
  it('is a non-empty array', () => {
    expect(toursData.length).toBeGreaterThan(0);
  });

  it('each tour has required fields', () => {
    for (const tour of toursData) {
      expect(tour.id).toEqual(expect.any(Number));
      expect(tour.title).toEqual(expect.any(String));
      expect(tour.imageUrl).toEqual(expect.any(String));
      expect(tour.rating).toEqual(expect.any(String));
      expect(tour.price).toEqual(expect.any(Number));
      expect(tour.duration).toEqual(expect.any(String));
      expect(tour.distance).toEqual(expect.any(String));
      expect(tour.location).toEqual(expect.any(String));
    }
  });

  it('has unique IDs', () => {
    const ids = toursData.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
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
      expect(dest.tours).toEqual(expect.any(Number));
      expect(['small', 'large']).toContain(dest.size);
    }
  });

  it('has unique IDs', () => {
    const ids = destinationsData.map((d) => d.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
