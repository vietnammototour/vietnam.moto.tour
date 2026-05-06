'use client';

import {useState, useCallback} from 'react';
import {api} from '@/routes';
import {ImageUpload} from '@/components/ui';

type ImageUploadFieldProps = {
  entityType: 'tour' | 'destination';
  entityId: string | null;
  imageType: 'card' | 'hero';
  currentUrl?: string;
  onUploadComplete: (url: string) => void;
  label: string;
  compact?: boolean;
};

export function ImageUploadField({
  entityType,
  entityId,
  imageType,
  currentUrl,
  onUploadComplete,
  label,
  compact,
}: ImageUploadFieldProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [previewUrl, setPreviewUrl] = useState(currentUrl || '');

  const handleChange = useCallback(
    async (file: File | null) => {
      if (!file || !entityId) return;

      setUploading(true);
      setError('');

      const formData = new FormData();
      formData.append('file', file, file.name);
      formData.append('entityType', entityType);
      formData.append('entityId', entityId);
      formData.append('imageType', imageType);

      try {
        const {data, error: uploadError} =
          await api.admin.upload.create(formData);
        if (uploadError) {
          setError(uploadError);
          return;
        }
        setPreviewUrl(`${data!.url}?t=${Date.now()}`);
        onUploadComplete(data!.url);
      } catch {
        setError('Upload failed');
      } finally {
        setUploading(false);
      }
    },
    [entityId, entityType, imageType, onUploadComplete],
  );

  const handleRemove = useCallback(async () => {
    if (!entityId || !confirm('Delete this image?')) return;

    try {
      const {error: deleteError} = await api.admin.upload.delete({
        entityType,
        entityId,
        imageType,
      });
      if (!deleteError) {
        setPreviewUrl('');
        onUploadComplete('');
      }
    } catch {
      setError('Delete failed');
    }
  }, [entityId, entityType, imageType, onUploadComplete]);

  if (!entityId) {
    return (
      <div>
        {label && (
          <label className="block type-label-sm text-on-surface-secondary mb-1">
            {label}
          </label>
        )}
        <div className="flex items-center justify-center border-2 border-dashed border-border rounded-lg bg-surface-alt text-on-surface-secondary type-body-sm h-40">
          Save first to upload images
        </div>
      </div>
    );
  }

  return (
    <ImageUpload
      value={previewUrl || undefined}
      onChange={handleChange}
      onRemove={handleRemove}
      label={label}
      compact={compact}
      error={error}
    />
  );
}
