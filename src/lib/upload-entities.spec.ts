import {
  ENTITY_TYPES,
  IMAGE_TYPES,
  isValidCombination,
  getDbField,
} from './upload-entities';

describe('upload entities', () => {
  it('exposes entity type allowlist', () => {
    expect(ENTITY_TYPES).toEqual([
      'tour',
      'destination',
      'highlight',
      'collectionImage',
      'vehicle',
    ]);
  });

  it('exposes image type allowlist', () => {
    expect(IMAGE_TYPES).toEqual(['card', 'hero', 'primary']);
  });

  it('allows tour:card', () => {
    expect(isValidCombination('tour', 'card')).toBe(true);
  });

  it('rejects tour:hero (only destination has hero)', () => {
    expect(isValidCombination('tour', 'hero')).toBe(false);
  });

  it('allows destination:hero', () => {
    expect(isValidCombination('destination', 'hero')).toBe(true);
  });

  it('allows highlight:card only', () => {
    expect(isValidCombination('highlight', 'card')).toBe(true);
    expect(isValidCombination('highlight', 'hero')).toBe(false);
  });

  it('allows collectionImage:card only', () => {
    expect(isValidCombination('collectionImage', 'card')).toBe(true);
    expect(isValidCombination('collectionImage', 'hero')).toBe(false);
  });

  it('allows vehicle:card only', () => {
    expect(isValidCombination('vehicle', 'card')).toBe(true);
    expect(isValidCombination('vehicle', 'primary')).toBe(false);
    expect(isValidCombination('vehicle', 'hero')).toBe(false);
  });

  it('maps to Prisma model + field', () => {
    expect(getDbField('tour', 'card')).toEqual({
      model: 'tour',
      field: 'imageUrl',
    });
    expect(getDbField('destination', 'card')).toEqual({
      model: 'destination',
      field: 'imageUrl',
    });
    expect(getDbField('destination', 'hero')).toEqual({
      model: 'destination',
      field: 'heroImage',
    });
    expect(getDbField('highlight', 'card')).toEqual({
      model: 'highlight',
      field: 'imageUrl',
    });
    expect(getDbField('collectionImage', 'card')).toEqual({
      model: 'collectionImage',
      field: 'url',
    });
    expect(getDbField('vehicle', 'card')).toEqual({
      model: 'vehicle',
      field: 'imageUrl',
    });
  });
});
