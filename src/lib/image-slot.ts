import * as yup from 'yup';

export type ImageSlot =
  | {kind: 'empty'}
  | {kind: 'saved'; url: string}
  | {
      kind: 'pending-replace';
      blob: Blob;
      previewUrl: string;
      hash: string;
    }
  | {kind: 'pending-delete'; previousUrl: string};

export function imageSlotSchema() {
  return yup
    .mixed<ImageSlot>()
    .test('image-slot', 'invalid image slot', (v) => {
      if (!v || typeof v !== 'object') return false;
      switch (v.kind) {
        case 'empty':
          return true;
        case 'saved':
          return typeof v.url === 'string' && v.url.length > 0;
        case 'pending-replace':
          return (
            v.blob instanceof Blob &&
            typeof v.previewUrl === 'string' &&
            typeof v.hash === 'string' &&
            /^[0-9a-f]{8}$/.test(v.hash)
          );
        case 'pending-delete':
          return typeof v.previousUrl === 'string';
        default:
          return false;
      }
    });
}

export const emptySlot: ImageSlot = {kind: 'empty'};

export function savedSlot(url: string | null | undefined): ImageSlot {
  return url ? {kind: 'saved', url} : {kind: 'empty'};
}

export function isDirty(slot: ImageSlot): boolean {
  return slot.kind === 'pending-replace' || slot.kind === 'pending-delete';
}
