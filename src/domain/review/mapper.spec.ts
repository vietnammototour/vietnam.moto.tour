import type {Review as PrismaReview} from '@prisma/client';
import {toReview} from './mapper';

const baseRow = {
  id: 'r1',
  tourId: 't1',
  reviewerName: 'Jane Doe',
  reviewerLocation: 'London, UK',
  avatarUrl: 'https://media.tripadvisor.com/avatar.jpg',
  rating: 5,
  title: 'Unforgettable ride',
  body: 'Best trip of my life.',
  reviewDate: new Date('2026-01-10T00:00:00Z'),
  sourceUrl: 'https://www.tripadvisor.com/review/r1',
  images: ['https://www.tripadvisor.com/media/1', 'https://www.tripadvisor.com/media/2'],
  isFeatured: true,
  displayOrder: 2,
  createdAt: new Date('2026-01-01T00:00:00Z'),
  updatedAt: new Date('2026-01-02T00:00:00Z'),
} as unknown as PrismaReview;

describe('toReview', () => {
  it('converts Date fields to ISO strings', () => {
    const r = toReview(baseRow);
    expect(r.reviewDate).toBe('2026-01-10T00:00:00.000Z');
    expect(r.createdAt).toBe('2026-01-01T00:00:00.000Z');
    expect(r.updatedAt).toBe('2026-01-02T00:00:00.000Z');
  });

  it('shapes images as string[] and defaults null to []', () => {
    expect(toReview(baseRow).images).toEqual([
      'https://www.tripadvisor.com/media/1',
      'https://www.tripadvisor.com/media/2',
    ]);
    expect(
      toReview({...baseRow, images: null} as unknown as PrismaReview).images,
    ).toEqual([]);
  });

  it('passes through nullable fields as-is', () => {
    const r = toReview({
      ...baseRow,
      reviewerLocation: null,
      avatarUrl: null,
    } as unknown as PrismaReview);
    expect(r.reviewerLocation).toBeNull();
    expect(r.avatarUrl).toBeNull();
  });
});
