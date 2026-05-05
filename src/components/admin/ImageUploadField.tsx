'use client';

import {useState, useRef} from 'react';
import {api} from '@/routes';

interface ImageUploadFieldProps {
  entityType: 'tour' | 'destination';
  entityId: string | null;
  imageType: 'card' | 'hero';
  currentUrl?: string;
  onUploadComplete: (url: string) => void;
  label: string;
  compact?: boolean;
}

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
  const fileInputRef = useRef<HTMLInputElement>(null);

  const hasImage = !!previewUrl;
  const isHero = imageType === 'hero';

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !entityId) return;

    setUploading(true);
    setError('');

    const formData = new FormData();
    formData.append('file', file, file.name);
    formData.append('entityType', entityType);
    formData.append('entityId', entityId);
    formData.append('imageType', imageType);

    try {
      const {data, error} = await api.admin.upload.create(formData);

      if (error) {
        setError(error);
        return;
      }

      setPreviewUrl(`${data!.url}?t=${Date.now()}`);
      onUploadComplete(data!.url);
    } catch {
      setError('Upload failed');
    } finally {
      setUploading(false);
      // Reset input so same file can be re-selected
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  async function handleDelete() {
    if (!entityId || !confirm('Delete this image?')) return;

    try {
      const {error} = await api.admin.upload.delete({
        entityType,
        entityId,
        imageType,
      });

      if (!error) {
        setPreviewUrl('');
        onUploadComplete('');
      }
    } catch {
      setError('Delete failed');
    }
  }

  if (compact) {
    return (
      <div>
        {!entityId ? (
          <span className="type-body-sm text-on-surface-secondary">
            Save first to upload
          </span>
        ) : (
          <>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="bg-primary hover:bg-primary-light text-on-primary px-4 py-2 rounded-lg type-label-sm transition-colors cursor-pointer disabled:opacity-50"
            >
              {uploading
                ? 'Uploading...'
                : hasImage
                  ? 'Change Image'
                  : 'Upload Image'}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
          </>
        )}
        {error && (
          <p className="mt-1 type-body-sm text-red-600 dark:text-red-400">
            {error}
          </p>
        )}
      </div>
    );
  }

  return (
    <div>
      <label className="block type-label-sm text-on-surface-secondary mb-1">
        {label}
      </label>

      {!entityId ? (
        <div
          className={`flex items-center justify-center border-2 border-dashed border-border rounded-lg bg-surface-alt text-on-surface-secondary type-body-sm ${isHero ? 'h-48' : 'h-40'}`}
        >
          Save first to upload images
        </div>
      ) : (
        <div
          className={`relative group border-2 border-dashed border-border rounded-lg overflow-hidden ${isHero ? 'h-48' : 'h-40'} ${uploading ? 'opacity-60 pointer-events-none' : ''}`}
        >
          {hasImage ? (
            <>
              <img
                src={previewUrl}
                alt={label}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-white text-gray-800 px-3 py-1.5 rounded-lg type-label-sm cursor-pointer"
                >
                  Replace
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  className="bg-red-600 text-white px-3 py-1.5 rounded-lg type-label-sm cursor-pointer"
                >
                  Delete
                </button>
              </div>
            </>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full h-full flex flex-col items-center justify-center text-on-surface-secondary hover:text-primary transition-colors cursor-pointer"
            >
              <svg
                className="w-8 h-8 mb-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <span className="type-body-sm">Click to upload</span>
            </button>
          )}

          {uploading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/30">
              <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>
      )}

      {error && (
        <p className="mt-1 type-body-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}
