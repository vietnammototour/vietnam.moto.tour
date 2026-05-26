import {useRef} from 'react';
import {useSortable} from '@dnd-kit/sortable';
import {CSS} from '@dnd-kit/utilities';
import {useTranslations} from 'next-intl';
import type {CollectionImage} from '@/domain';
import {Button, TextInput} from '@/components/ui';
import type {AdminLocale} from '@/components/ui/LocaleSwitcher';

type Props = {
  image: CollectionImage;
  canDelete: boolean;
  locale?: AdminLocale;
  onAltChange: (id: string, patch: {altEn?: string; altVi?: string}) => void;
  onDelete: (id: string) => void;
  onReplace: (id: string, file: File) => void;
};

export function SortableImageCard({
  image,
  canDelete,
  locale,
  onAltChange,
  onDelete,
  onReplace,
}: Props) {
  const t = useTranslations();
  const fileRef = useRef<HTMLInputElement>(null);
  const {attributes, listeners, setNodeRef, transform, transition, isDragging} =
    useSortable({id: image.id});

  const showVi = locale === undefined || locale === 'vi';
  const showEn = locale === undefined || locale === 'en';

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
      }}
      className="bg-surface-elevated border border-border rounded-lg p-3 flex flex-col gap-3"
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        aria-label={t('admin.imageCollections.dragHandle')}
        className="self-start text-on-surface-secondary cursor-grab"
      >
        <i className="fa fa-grip-vertical" />
      </button>
      <div className="aspect-square bg-surface-alt rounded overflow-hidden">
        {image.url ? (
          <img
            src={image.url}
            alt={image.altEn}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-on-surface-secondary text-sm">
            {t('admin.imageCollections.uploadHint')}
          </div>
        )}
      </div>
      {showEn ? (
        <TextInput
          label={t('admin.imageCollections.altEn')}
          value={image.altEn}
          onChange={(e) => onAltChange(image.id, {altEn: e.target.value})}
        />
      ) : null}
      {showVi ? (
        <TextInput
          label={t('admin.imageCollections.altVi')}
          value={image.altVi}
          onChange={(e) => onAltChange(image.id, {altVi: e.target.value})}
        />
      ) : null}
      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onReplace(image.id, f);
          e.target.value = '';
        }}
      />
      <div className="flex gap-2">
        <Button
          variant="ghost-primary"
          size="sm"
          type="button"
          icon={<i className="fa fa-sync text-xs" />}
          onClick={() => fileRef.current?.click()}
        >
          {t('admin.imageCollections.replace')}
        </Button>
        <Button
          variant="ghost-danger"
          size="sm"
          type="button"
          icon={<i className="fa fa-trash text-xs" />}
          disabled={!canDelete}
          onClick={() => onDelete(image.id)}
        >
          {t('common.delete')}
        </Button>
      </div>
    </div>
  );
}
