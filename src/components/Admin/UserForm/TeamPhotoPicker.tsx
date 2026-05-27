import {useEffect, useRef, useState} from 'react';
import {useTranslations} from 'next-intl';
import {Modal, Button} from '@/components/ui';
import {api} from '@/routes';
import {transcodeImage} from '@/lib/image-transcode';
import type * as VMT from '@/domain';

const TEAM_KEY = 'team';
const TEAM_LABEL = 'Team Photos';

type PickableImage = Pick<
  VMT.CollectionImage,
  'id' | 'url' | 'altVi' | 'altEn'
>;

type TeamPhotoPickerProps = {
  value: string | null;
  onChange: (id: string | null) => void;
};

export function TeamPhotoPicker({value, onChange}: TeamPhotoPickerProps) {
  const t = useTranslations('admin.users');
  const [open, setOpen] = useState(false);
  const [collectionId, setCollectionId] = useState<string | null>(null);
  const [images, setImages] = useState<PickableImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const selected = images.find((i) => i.id === value);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const list = await api.admin.imageCollections.list();
      if (cancelled) return;
      const found = list.data?.find((c) => c.key === TEAM_KEY);
      let id = found?.id ?? null;
      if (!id) {
        const created = await api.admin.imageCollections.create({
          key: TEAM_KEY,
          label: TEAM_LABEL,
        });
        if (cancelled) return;
        id = created.data?.id ?? null;
      }
      if (!id) {
        setError('Could not load team collection');
        setLoading(false);
        return;
      }
      const detail = await api.admin.imageCollections.get(id);
      if (cancelled) return;
      setCollectionId(id);
      setImages(detail.data?.images ?? []);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleFile(file: File) {
    if (!collectionId) return;
    setUploading(true);
    setError(null);
    try {
      const transcoded = await transcodeImage(file, 'card');
      const created = await api.admin.imageCollections.images.add(
        collectionId,
        {},
      );
      if (!created.data) {
        setError(created.error ?? 'Could not create image');
        return;
      }
      const upload = await api.admin.upload.create({
        entityType: 'collectionImage',
        entityId: created.data.id,
        imageType: 'card',
        blob: transcoded.blob,
      });
      if (!upload.data) {
        setError(upload.error ?? 'Upload failed');
        await api.admin.imageCollections.images
          .delete(collectionId, created.data.id)
          .catch(() => {});
        return;
      }
      const next: PickableImage = {
        ...created.data,
        url: upload.data.url,
      };
      setImages((prev) => [...prev, next]);
      onChange(next.id);
      setOpen(false);
    } catch (err) {
      const code =
        err && typeof err === 'object' && 'code' in err
          ? (err as {code: string}).code
          : null;
      if (code === 'unsupported_format')
        setError('Use JPEG, PNG, WebP, or GIF');
      else if (code === 'too_large') setError('Image must be under 25MB');
      else setError('Image processing failed');
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="flex items-center gap-4">
      {selected?.url ? (
        <img
          src={selected.url}
          alt={selected.altEn || selected.altVi || ''}
          className="h-24 w-24 object-cover border border-border"
        />
      ) : (
        <div className="h-24 w-24 border border-dashed border-border flex items-center justify-center text-on-surface-secondary bg-surface">
          <i className="fa fa-user text-2xl" />
        </div>
      )}
      <div className="flex flex-col gap-2">
        <Button type="button" onClick={() => setOpen(true)}>
          {t('pickImage')}
        </Button>
        {value ? (
          <Button
            variant="ghost-danger"
            type="button"
            onClick={() => onChange(null)}
          >
            {t('removeImage')}
          </Button>
        ) : null}
      </div>
      <Modal
        open={open}
        title={t('modalTitle')}
        size="lg"
        onClose={() => setOpen(false)}
      >
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
            e.target.value = '';
          }}
        />
        <div className="flex items-center justify-between mb-4">
          <p className="type-label-sm text-on-surface-secondary">
            {images.length} {images.length === 1 ? 'photo' : 'photos'}
          </p>
          <Button
            variant="primary"
            type="button"
            icon={<i className="fa fa-plus text-xs" />}
            disabled={uploading || !collectionId}
            loading={uploading}
            onClick={() => fileRef.current?.click()}
          >
            Upload photo
          </Button>
        </div>
        {error && (
          <div className="mb-4 bg-error/10 text-error p-3">{error}</div>
        )}
        {loading && (
          <p className="text-on-surface-secondary py-8 text-center">Loading…</p>
        )}
        {!loading && images.length === 0 && (
          <p className="text-on-surface-secondary py-8 text-center">
            No team photos yet. Upload one to get started.
          </p>
        )}
        {!loading && images.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {images.map((img) => {
              const isSelected = img.id === value;
              return (
                <button
                  key={img.id}
                  type="button"
                  onClick={() => {
                    onChange(img.id);
                    setOpen(false);
                  }}
                  className={`overflow-hidden border-2 cursor-pointer transition-colors ${
                    isSelected
                      ? 'border-primary'
                      : 'border-transparent hover:border-border'
                  }`}
                >
                  {img.url ? (
                    <img
                      src={img.url}
                      alt={img.altEn || img.altVi || ''}
                      className="h-32 w-full object-cover"
                    />
                  ) : (
                    <div className="h-32 w-full bg-surface-alt" />
                  )}
                </button>
              );
            })}
          </div>
        )}
      </Modal>
    </div>
  );
}
