export const ENTITY_TYPES = ['tour', 'destination', 'highlight'] as const;
export const IMAGE_TYPES = ['card', 'hero'] as const;

export type EntityType = (typeof ENTITY_TYPES)[number];
export type ImageType = (typeof IMAGE_TYPES)[number];

const VALID: Record<EntityType, readonly ImageType[]> = {
  tour: ['card'],
  destination: ['card', 'hero'],
  highlight: ['card'],
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

type DbField = {model: 'tour' | 'destination' | 'highlight'; field: string};

export function getDbField(entity: EntityType, image: ImageType): DbField {
  if (entity === 'destination' && image === 'hero') {
    return {model: 'destination', field: 'heroImage'};
  }
  return {model: entity, field: 'imageUrl'};
}
