import {useEffect, useRef, useState} from 'react';
import {
  DndContext,
  type DragEndEvent,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import {useTranslations} from 'next-intl';
import type {ImageCollection, CollectionImage} from '@/domain';
import {api} from '@/routes';
import {SortableImageCard} from './SortableImageCard';
import {AddImageButton} from './AddImageButton';

const MAX = 10;
const MIN = 1;
const DEBOUNCE_MS = 500;

type Props = {collection: ImageCollection};

export function ImageCollectionEditor({collection}: Props) {
  const t = useTranslations();
  const [images, setImages] = useState<CollectionImage[]>(collection.images);
  const [error, setError] = useState<string | null>(null);
  const altTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(
    new Map(),
  );

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {coordinateGetter: sortableKeyboardCoordinates}),
  );

  function handleDragEnd(event: DragEndEvent) {
    const {active, over} = event;
    if (!over || active.id === over.id) return;
    let previous: CollectionImage[] = [];
    setImages((prev) => {
      previous = prev;
      const oldIndex = prev.findIndex((p) => p.id === active.id);
      const newIndex = prev.findIndex((p) => p.id === over.id);
      const next = arrayMove(prev, oldIndex, newIndex).map((img, i) => ({
        ...img,
        order: i,
      }));
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
      return next;
    });
  }

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

  async function handleAdd(file: File) {
    if (images.length >= MAX) return;
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
      blob: file,
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
    const upload = await api.admin.upload.create({
      entityType: 'collectionImage',
      entityId: id,
      imageType: 'card',
      blob: file,
    });
    if (!upload.data) {
      setError(upload.error ?? 'replace failed');
      return;
    }
    setImages((prev) =>
      prev.map((p) => (p.id === id ? {...p, url: upload.data!.url} : p)),
    );
  }

  async function handleDelete(id: string) {
    if (images.length <= MIN) return;
    if (!confirm(t('admin.imageCollections.confirmDeleteImage'))) return;
    const res = await api.admin.imageCollections.images.delete(
      collection.id,
      id,
    );
    if (res.error) {
      setError(res.error);
      return;
    }
    setImages((prev) => prev.filter((p) => p.id !== id));
  }

  useEffect(() => () => altTimers.current.forEach((t) => clearTimeout(t)), []);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="type-label-sm text-on-surface-secondary">
          {t('admin.imageCollections.countHint', {
            count: images.length,
            max: MAX,
          })}
        </p>
        <AddImageButton disabled={images.length >= MAX} onPick={handleAdd} />
      </div>
      {error && (
        <div className="bg-error/10 text-error p-3 rounded">{error}</div>
      )}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={images.map((i) => i.id)}
          strategy={rectSortingStrategy}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {images.map((img) => (
              <SortableImageCard
                key={img.id}
                image={img}
                canDelete={images.length > MIN}
                onAltChange={handleAltChange}
                onDelete={handleDelete}
                onReplace={handleReplace}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}
