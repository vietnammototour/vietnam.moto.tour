import {useRef} from 'react';
import {useTranslations} from 'next-intl';
import {Button} from '@/components/ui';

type Props = {
  disabled: boolean;
  onPick: (file: File) => void;
};

export function AddImageButton({disabled, onPick}: Props) {
  const t = useTranslations();
  const ref = useRef<HTMLInputElement>(null);
  return (
    <>
      <input
        ref={ref}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onPick(f);
          e.target.value = '';
        }}
      />
      <Button
        variant="primary"
        type="button"
        disabled={disabled}
        icon={<i className="fa fa-plus text-xs" />}
        onClick={() => ref.current?.click()}
      >
        {t('admin.imageCollections.addImage')}
      </Button>
    </>
  );
}
