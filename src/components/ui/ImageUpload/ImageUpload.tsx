'use client';

import {useRef} from 'react';
import {Button} from '@/components/ui/Button';

type ImageUploadProps = {
  value?: string;
  onChange: (file: File | null) => void;
  onRemove?: () => void;
  accept?: string;
  maxSize?: number;
  compact?: boolean;
  error?: string;
  label?: string;
};

export function ImageUpload({
  value,
  onChange,
  onRemove,
  accept = 'image/*',
  maxSize,
  compact = false,
  error,
  label,
}: ImageUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (maxSize && file.size > maxSize) {
      return;
    }

    onChange(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  if (compact) {
    return (
      <div>
        {label && (
          <label className="block type-label-sm text-on-surface-secondary mb-1">
            {label}
          </label>
        )}
        <Button
          type="button"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
        >
          {value ? 'Change' : 'Upload'}
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          onChange={handleFileSelect}
          className="hidden"
        />
        {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
      </div>
    );
  }

  return (
    <div>
      {label && (
        <label className="block type-label-sm text-on-surface-secondary mb-1">
          {label}
        </label>
      )}

      <div className="relative group border-2 border-dashed border-border rounded-lg overflow-hidden h-40">
        {value ? (
          <>
            <img
              src={value}
              alt="Upload preview"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                className="bg-white text-gray-800"
              >
                Replace
              </Button>
              {onRemove && (
                <Button
                  variant="danger"
                  size="sm"
                  onClick={onRemove}
                  aria-label="Remove image"
                >
                  Delete
                </Button>
              )}
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

        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
    </div>
  );
}
