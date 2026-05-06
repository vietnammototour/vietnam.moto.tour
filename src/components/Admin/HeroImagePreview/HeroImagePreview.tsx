'use client';

import {useState} from 'react';
import {api} from '@/routes';
import {TourHero} from '@/components/TourHero';
import {ImageUploadField} from '../ImageUploadField';

type HeroImagePreviewProps = {
  destinationId: string | null;
  heroImage: string;
  destinationName: string;
  onImageChange: (url: string) => void;
};

export function HeroImagePreview({
  destinationId,
  heroImage,
  destinationName,
  onImageChange,
}: HeroImagePreviewProps) {
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!destinationId || !confirm('Delete hero image?')) return;

    setDeleting(true);
    try {
      const {error} = await api.admin.upload.delete({
        entityType: 'destination',
        entityId: destinationId,
        imageType: 'hero',
      });

      if (!error) {
        onImageChange('');
      }
    } catch {
      // silently fail
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <span className="type-label-sm text-on-surface-secondary">
          Hero Image Preview
        </span>
        <div className="flex items-center gap-2">
          {heroImage && destinationId && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg type-label-sm transition-colors cursor-pointer disabled:opacity-50"
            >
              {deleting ? 'Deleting...' : 'Delete'}
            </button>
          )}
          <ImageUploadField
            entityType="destination"
            entityId={destinationId}
            imageType="hero"
            currentUrl={heroImage}
            onUploadComplete={onImageChange}
            label=""
            compact
          />
        </div>
      </div>
      <div className="rounded-lg overflow-hidden">
        <TourHero
          preview={{
            heroImage: heroImage,
            destinationName: destinationName || 'Destination Name',
          }}
        />
      </div>
    </div>
  );
}
