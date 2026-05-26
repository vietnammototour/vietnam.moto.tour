export const ENTITY_TYPES = [
  'tour',
  'destination',
  'highlight',
  'collectionImage',
  'vehicle',
] as const;
export const IMAGE_TYPES = ['card', 'hero', 'primary'] as const;

export type EntityType = (typeof ENTITY_TYPES)[number];
export type ImageType = (typeof IMAGE_TYPES)[number];

const VALID: Record<EntityType, readonly ImageType[]> = {
  tour: ['card'],
  destination: ['card', 'hero'],
  highlight: ['card'],
  collectionImage: ['card'],
  vehicle: ['card'],
};

export function isValidEntityType(s: string): s is EntityType {
  return (ENTITY_TYPES as readonly string[]).includes(s);
}

export function isValidImageType(s: string): s is ImageType {
  return (IMAGE_TYPES as readonly string[]).includes(s);
}

export function isValidCombination(
  entity: EntityType,
  image: ImageType,
): boolean {
  return VALID[entity].includes(image);
}

type DbField = {
  model: 'tour' | 'destination' | 'highlight' | 'collectionImage' | 'vehicle';
  field: string;
};

export function getDbField(entity: EntityType, image: ImageType): DbField {
  if (entity === 'destination' && image === 'hero') {
    return {model: 'destination', field: 'heroImage'};
  }
  if (entity === 'collectionImage') {
    return {model: 'collectionImage', field: 'url'};
  }
  return {model: entity, field: 'imageUrl'};
}
