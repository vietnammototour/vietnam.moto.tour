'use client';

import {useState, useRef} from 'react';

interface ImageUploadFieldProps {
  entityType: 'tour' | 'destination';
  entityId: string | null;
  imageType: 'card' | 'hero';
  currentUrl?: string;
  onUploadComplete: (url: string) => void;
  label: string;
}

export function ImageUploadField({
  entityType,
  entityId,
  imageType,
  currentUrl,
  onUploadComplete,
  label,
}: ImageUploadFieldProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [previewUrl, setPreviewUrl] = useState(currentUrl || '');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const hasImage = !!previewUrl;
  const isHero = imageType === 'hero';

  async function compressToWebP(file: File): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        // Resize: max 1920px wide, preserve aspect ratio
        const maxWidth = 1920;
        let {width, height} = img;
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error('Canvas not supported'));
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            if (blob) resolve(blob);
            else reject(new Error('WebP conversion failed'));
          },
          'image/webp',
          0.8,
        );
      };
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = URL.createObjectURL(file);
    });
  }

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !entityId) return;

    setUploading(true);
    setError('');

    let uploadBlob: Blob;
    try {
      uploadBlob = await compressToWebP(file);
    } catch {
      setError('Image compression failed');
      setUploading(false);
      return;
    }

    const formData = new FormData();
    formData.append('file', uploadBlob, 'image.webp');
    formData.append('entityType', entityType);
    formData.append('entityId', entityId);
    formData.append('imageType', imageType);

    try {
      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Upload failed');
        return;
      }

      // Append cache-buster to force preview refresh
      setPreviewUrl(`${data.url}?t=${Date.now()}`);
      onUploadComplete(data.url);
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
      const res = await fetch('/api/admin/upload', {
        method: 'DELETE',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({entityType, entityId, imageType}),
      });

      if (res.ok) {
        setPreviewUrl('');
        onUploadComplete('');
      }
    } catch {
      setError('Delete failed');
    }
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
