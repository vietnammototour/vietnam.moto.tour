import type {EntityType, ImageType} from '@/lib/upload-entities';
import type {ImageSlot} from '@/lib/image-slot';

type Args = {
  entityType: EntityType;
  entityId: string;
  slots: Partial<Record<ImageType, ImageSlot>>;
};

type Result = {
  updated: Partial<Record<ImageType, ImageSlot>>;
  errors: Partial<Record<ImageType, string>>;
};

export async function flushImageSlots({
  entityType,
  entityId,
  slots,
}: Args): Promise<Result> {
  const updated: Result['updated'] = {};
  const errors: Result['errors'] = {};

  await Promise.all(
    (Object.entries(slots) as [ImageType, ImageSlot][]).map(
      async ([imageType, slot]) => {
        if (slot.kind === 'pending-replace') {
          const out = await uploadOnce(entityType, entityId, imageType, slot);
          if (out.ok) updated[imageType] = {kind: 'saved', url: out.url};
          else errors[imageType] = out.error;
        } else if (slot.kind === 'pending-delete') {
          const out = await deleteOnce(entityType, entityId, imageType);
          if (out.ok) updated[imageType] = {kind: 'empty'};
          else errors[imageType] = out.error;
        }
      },
    ),
  );

  return {updated, errors};
}

async function uploadOnce(
  entityType: EntityType,
  entityId: string,
  imageType: ImageType,
  slot: Extract<ImageSlot, {kind: 'pending-replace'}>,
): Promise<{ok: true; url: string} | {ok: false; error: string}> {
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const fd = new FormData();
      fd.append('entityType', entityType);
      fd.append('entityId', entityId);
      fd.append('imageType', imageType);
      fd.append('file', slot.blob, `${imageType}.${slot.hash}.webp`);
      const r = await fetch('/api/admin/upload', {method: 'POST', body: fd});
      if (r.ok) {
        const data = await r.json();
        return {ok: true, url: data.url};
      }
    } catch {
      /* retry */
    }
    if (attempt === 0) await new Promise((r) => setTimeout(r, 1000));
  }
  return {ok: false, error: 'Upload failed'};
}

async function deleteOnce(
  entityType: EntityType,
  entityId: string,
  imageType: ImageType,
): Promise<{ok: true} | {ok: false; error: string}> {
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const r = await fetch('/api/admin/upload', {
        method: 'DELETE',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({entityType, entityId, imageType}),
      });
      if (r.ok) return {ok: true};
    } catch {
      /* retry */
    }
    if (attempt === 0) await new Promise((r) => setTimeout(r, 1000));
  }
  return {ok: false, error: 'Delete failed'};
}
