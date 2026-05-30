import {
  buildReviewSchema,
  reviewFormDefaults,
  toReviewPayload,
  type ReviewFormValues,
} from './ReviewForm.form-utils';

// Identity translator: validation messages come back as their key, so tests
// assert on the key rather than localized text.
const t = (k: string) => k;
const schema = buildReviewSchema(t);

const validValues: ReviewFormValues = {
  tourId: 'tour-1',
  reviewerName: 'Jane Doe',
  reviewerLocation: 'London, UK',
  avatarUrl: 'https://media.tripadvisor.com/avatar.jpg',
  rating: 5,
  title: 'Great',
  body: 'Loved every minute.',
  reviewDate: '2026-01-10',
  sourceUrl: 'https://www.tripadvisor.com/review/r1',
  images: ['https://www.tripadvisor.com/media/1', '', '', '', ''],
  isFeatured: true,
  displayOrder: 0,
};

async function firstError(values: ReviewFormValues): Promise<string | undefined> {
  try {
    await schema.validate(values, {abortEarly: true});
    return undefined;
  } catch (err) {
    return (err as {message: string}).message;
  }
}

describe('buildReviewSchema', () => {
  it('accepts a fully valid set of values', async () => {
    await expect(schema.validate(validValues)).resolves.toBeDefined();
  });

  it('requires tourId, reviewerName, body, reviewDate and sourceUrl', async () => {
    expect(await firstError({...validValues, tourId: ''})).toBe(
      'validation.tourRequired',
    );
    expect(await firstError({...validValues, reviewerName: ''})).toBe(
      'validation.nameRequired',
    );
    expect(await firstError({...validValues, body: ''})).toBe(
      'validation.bodyRequired',
    );
    expect(await firstError({...validValues, reviewDate: ''})).toBe(
      'validation.dateRequired',
    );
    expect(await firstError({...validValues, sourceUrl: ''})).toBe(
      'validation.sourceRequired',
    );
  });

  it('rejects a rating outside 1-5', async () => {
    expect(await firstError({...validValues, rating: 0})).toBe(
      'validation.ratingRange',
    );
    expect(await firstError({...validValues, rating: 6})).toBe(
      'validation.ratingRange',
    );
  });

  it('rejects an invalid sourceUrl', async () => {
    expect(await firstError({...validValues, sourceUrl: 'not-a-url'})).toBe(
      'validation.urlInvalid',
    );
  });

  it('rejects more than 5 images', async () => {
    const error = await firstError({
      ...validValues,
      images: ['a', 'b', 'c', 'd', 'e', 'f'],
    });
    expect(error).toBeDefined();
  });
});

describe('toReviewPayload', () => {
  it('drops blank and whitespace-only image URLs', () => {
    const payload = toReviewPayload({
      ...validValues,
      images: ['https://ta/1', '', '   ', 'https://ta/2', ''],
    });
    expect(payload.images).toEqual(['https://ta/1', 'https://ta/2']);
  });

  it('returns an empty images array when none are filled', () => {
    const payload = toReviewPayload({
      ...reviewFormDefaults,
      tourId: 'tour-1',
      reviewerName: 'Jane',
      body: 'Hi',
      reviewDate: '2026-01-10',
      sourceUrl: 'https://ta/r',
    });
    expect(payload.images).toEqual([]);
  });

  it('passes through the scalar fields unchanged', () => {
    const payload = toReviewPayload(validValues);
    expect(payload.tourId).toBe('tour-1');
    expect(payload.rating).toBe(5);
    expect(payload.isFeatured).toBe(true);
  });
});
