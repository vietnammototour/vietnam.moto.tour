import {useState} from 'react';
import {useTranslations} from 'next-intl';
import {Modal, Button} from '@/components/ui';
import type * as VMT from '@/domain';

type PickableImage = Pick<
  VMT.CollectionImage,
  'id' | 'url' | 'altVi' | 'altEn'
>;

type TeamPhotoPickerProps = {
  images: PickableImage[];
  value: string | null;
  onChange: (id: string | null) => void;
};

export function TeamPhotoPicker({
  images,
  value,
  onChange,
}: TeamPhotoPickerProps) {
  const t = useTranslations('admin.users');
  const [open, setOpen] = useState(false);
  const selected = images.find((i) => i.id === value);

  return (
    <div className="flex items-center gap-4">
      {selected?.url ? (
        <img
          src={selected.url}
          alt={selected.altEn}
          className="h-20 w-20 object-cover rounded-lg"
        />
      ) : (
        <div className="h-20 w-20 bg-surface-alt rounded-lg" />
      )}
      <div className="flex flex-col gap-2">
        <Button type="button" onClick={() => setOpen(true)}>
          {t('pickImage')}
        </Button>
        {value ? (
          <button
            type="button"
            onClick={() => onChange(null)}
            className="text-sm text-error hover:underline cursor-pointer"
          >
            {t('removeImage')}
          </button>
        ) : null}
      </div>
      <Modal open={open} title={t('modalTitle')} onClose={() => setOpen(false)}>
        <div className="grid grid-cols-3 gap-3">
          {images.map((img) => (
            <button
              key={img.id}
              type="button"
              className="cursor-pointer overflow-hidden rounded-lg"
              onClick={() => {
                onChange(img.id);
                setOpen(false);
              }}
            >
              {img.url ? (
                <img
                  src={img.url}
                  alt={img.altEn}
                  className="h-32 w-full object-cover"
                />
              ) : null}
            </button>
          ))}
        </div>
      </Modal>
    </div>
  );
}
