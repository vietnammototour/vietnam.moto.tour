'use client';

import {useEffect, useRef, useState} from 'react';
import {Button} from '@/components/ui/Button';
import {transcodeImage, type ImagePreset} from '@/lib/image-transcode';
import type {ImageSlot} from '@/lib/image-slot';

type ImageUploadProps = {
  value: ImageSlot;
  onChange: (next: ImageSlot) => void;
  preset: ImagePreset;
  label?: string;
  error?: string;
  heightClass?: string;
};

export function ImageUpload({
  value,
  onChange,
  preset,
  label,
  error,
  heightClass = 'h-40',
}: ImageUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (value.kind === 'pending-replace') {
        URL.revokeObjectURL(value.previewUrl);
      }
    };
  }, [value]);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    setLocalError(null);

    try {
      const out = await transcodeImage(file, preset);
      const previewUrl = URL.createObjectURL(out.blob);
      if (value.kind === 'pending-replace') {
        URL.revokeObjectURL(value.previewUrl);
      }
      onChange({
        kind: 'pending-replace',
        blob: out.blob,
        previewUrl,
        hash: out.hash,
      });
    } catch (err) {
      setLocalError(localizeError(err));
    } finally {
      setBusy(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  function handleRemove() {
    if (value.kind === 'saved') {
      onChange({kind: 'pending-delete', previousUrl: value.url});
    } else if (value.kind === 'pending-replace') {
      URL.revokeObjectURL(value.previewUrl);
      onChange({kind: 'empty'});
    } else if (value.kind === 'pending-delete') {
      onChange({kind: 'empty'});
    }
  }

  const displayUrl = (() => {
    if (value.kind === 'saved') return value.url;
    if (value.kind === 'pending-replace') return value.previewUrl;
    return null;
  })();
  const showRemove = value.kind === 'saved' || value.kind === 'pending-replace';
  const errMsg = localError ?? error ?? undefined;

  return (
    <div>
      {label && (
        <label className="block type-label-sm text-on-surface-secondary mb-1">
          {label}
        </label>
      )}
      <div
        className={`relative group border-2 border-dashed border-border overflow-hidden ${heightClass}`}
      >
        {displayUrl ? (
          <>
            <img
              src={displayUrl}
              alt="Upload preview"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
              >
                Replace
              </Button>
              {showRemove && (
                <Button
                  type="button"
                  variant="danger"
                  size="sm"
                  onClick={handleRemove}
                  aria-label="Delete"
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
            disabled={busy}
            className="w-full h-full flex flex-col items-center justify-center text-on-surface-secondary hover:text-primary transition-colors cursor-pointer"
          >
            <span className="type-body-sm">
              {busy ? 'Processing…' : 'Click to upload'}
            </span>
          </button>
        )}
        <input
          ref={fileInputRef}
          type="file"
          aria-label="upload-input"
          accept="image/jpeg,image/png,image/webp,image/gif"
          onChange={handleFile}
          className="hidden"
        />
      </div>
      {errMsg && <p className="mt-1 text-sm text-red-500">{errMsg}</p>}
    </div>
  );
}

function localizeError(err: unknown): string {
  if (err && typeof err === 'object' && 'code' in err) {
    const code = (err as {code: string}).code;
    const sniffed = (err as {sniffed?: string}).sniffed;
    switch (code) {
      case 'unsupported_format':
        if (sniffed === 'heic' || sniffed === 'heif') {
          return 'HEIC is not supported. Export as JPEG/PNG/WebP first.';
        }
        return 'Use JPEG, PNG, WebP, or GIF';
      case 'too_large':
        return 'Image must be under 25MB';
      case 'decode_failed':
        return 'Could not decode this image';
      case 'encode_failed':
        return 'Could not produce WebP output';
    }
  }
  return 'Upload failed';
}
