import {useEffect, useRef, useState} from 'react';
import type {ImageCollection, CollectionImage} from '@/domain';
import {api} from '@/routes';
import {transcodeImage} from '@/lib/image-transcode';

const MAX = 10;
const MIN = 1;
const DEBOUNCE_MS = 500;

export const IMAGE_COLLECTION_MAX = MAX;
export const IMAGE_COLLECTION_MIN = MIN;

export function useImageCollectionImages(collection: ImageCollection) {
  const [images, setImages] = useState<CollectionImage[]>(collection.images);
  const [error, setError] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const altTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(
    new Map(),
  );

  function handleAltChange(
    id: string,
    patch: {altEn?: string; altVi?: string},
  ) {
    setImages((prev) => prev.map((p) => (p.id === id ? {...p, ...patch} : p)));
    const existing = altTimers.current.get(id);
    if (existing) clearTimeout(existing);
    const timer = setTimeout(() => {
      api.admin.imageCollections.images
        .update(collection.id, id, patch)
        .then((res) => {
          if (res.error) setError(res.error);
        });
    }, DEBOUNCE_MS);
    altTimers.current.set(id, timer);
  }

  async function toWebpBlob(file: File): Promise<Blob | null> {
    try {
      const out = await transcodeImage(file, 'card');
      return out.blob;
    } catch (err) {
      const code =
        err && typeof err === 'object' && 'code' in err
          ? (err as {code: string}).code
          : null;
      if (code === 'unsupported_format') {
        setError('Use JPEG, PNG, WebP, or GIF');
      } else if (code === 'too_large') {
        setError('Image must be under 25MB');
      } else if (code === 'decode_failed') {
        setError('Could not decode this image');
      } else if (code === 'encode_failed') {
        setError('Could not produce WebP output');
      } else {
        setError('Image processing failed');
      }
      return null;
    }
  }

  async function handleAdd(file: File) {
    if (images.length >= MAX) return;
    const blob = await toWebpBlob(file);
    if (!blob) return;
    const created = await api.admin.imageCollections.images.add(
      collection.id,
      {},
    );
    if (!created.data) {
      setError(created.error ?? 'add failed');
      return;
    }
    const upload = await api.admin.upload.create({
      entityType: 'collectionImage',
      entityId: created.data.id,
      imageType: 'card',
      blob,
    });
    if (!upload.data) {
      setError(upload.error ?? 'upload failed');
      await api.admin.imageCollections.images
        .delete(collection.id, created.data.id)
        .catch(() => {});
      return;
    }
    setImages((prev) => [...prev, {...created.data!, url: upload.data!.url}]);
  }

  async function handleReplace(id: string, file: File) {
    const blob = await toWebpBlob(file);
    if (!blob) return;
    const upload = await api.admin.upload.create({
      entityType: 'collectionImage',
      entityId: id,
      imageType: 'card',
      blob,
    });
    if (!upload.data) {
      setError(upload.error ?? 'replace failed');
      return;
    }
    setImages((prev) =>
      prev.map((p) => (p.id === id ? {...p, url: upload.data!.url} : p)),
    );
  }

  function requestDelete(id: string) {
    if (images.length <= MIN) return;
    setDeleteError(null);
    setDeleteId(id);
  }

  function cancelDelete() {
    if (deleting) return;
    setDeleteId(null);
    setDeleteError(null);
  }

  async function confirmDelete() {
    if (!deleteId) return;
    setDeleting(true);
    setDeleteError(null);
    const res = await api.admin.imageCollections.images.delete(
      collection.id,
      deleteId,
    );
    setDeleting(false);
    if (res.error) {
      setDeleteError(res.error);
      return;
    }
    setImages((prev) => prev.filter((p) => p.id !== deleteId));
    setDeleteId(null);
  }

  function reorder(next: CollectionImage[], previous: CollectionImage[]) {
    setImages(next);
    api.admin.imageCollections.images
      .reorder(
        collection.id,
        next.map((n) => n.id),
      )
      .then((res) => {
        if (res.error) {
          setImages(previous);
          setError(res.error);
        }
      });
  }

  useEffect(() => () => altTimers.current.forEach((t) => clearTimeout(t)), []);

  return {
    images,
    error,
    canAdd: images.length < MAX,
    canDelete: images.length > MIN,
    count: images.length,
    handleAdd,
    handleReplace,
    handleAltChange,
    reorder,
    requestDelete,
    confirmDelete,
    cancelDelete,
    pendingDeleteId: deleteId,
    deleting,
    deleteError,
  };
}

export type ImageCollectionState = ReturnType<typeof useImageCollectionImages>;
