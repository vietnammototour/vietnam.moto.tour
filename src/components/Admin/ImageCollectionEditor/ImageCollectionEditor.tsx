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
import {
  IMAGE_COLLECTION_MAX,
  type ImageCollectionState,
} from './useImageCollectionImages';
import {SortableImageCard} from './SortableImageCard';
import type {AdminLocale} from '@/components/ui/LocaleSwitcher';

type Props = {state: ImageCollectionState; locale?: AdminLocale};

export function ImageCollectionEditor({state, locale}: Props) {
  const t = useTranslations();
  const {
    images,
    error,
    canDelete,
    count,
    handleAltChange,
    handleDelete,
    handleReplace,
    reorder,
  } = state;

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {coordinateGetter: sortableKeyboardCoordinates}),
  );

  function handleDragEnd(event: DragEndEvent) {
    const {active, over} = event;
    if (!over || active.id === over.id) return;
    const oldIndex = images.findIndex((p) => p.id === active.id);
    const newIndex = images.findIndex((p) => p.id === over.id);
    const next = arrayMove(images, oldIndex, newIndex).map((img, i) => ({
      ...img,
      order: i,
    }));
    reorder(next, images);
  }

  return (
    <div className="space-y-4">
      <p className="type-label-sm text-on-surface-secondary">
        {t('admin.imageCollections.countHint', {
          count,
          max: IMAGE_COLLECTION_MAX,
        })}
      </p>
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4">
            {images.map((img) => (
              <SortableImageCard
                key={img.id}
                image={img}
                canDelete={canDelete}
                locale={locale}
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
