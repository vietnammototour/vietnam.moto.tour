'use client';

import {TourHero} from '@/components/tour-hero';
import {ImageUploadField} from './ImageUploadField';

interface HeroImagePreviewProps {
  destinationId: string | null;
  heroImage: string;
  destinationName: string;
  onImageChange: (url: string) => void;
}

export function HeroImagePreview({
  destinationId,
  heroImage,
  destinationName,
  onImageChange,
}: HeroImagePreviewProps) {
  return (
    <div className="mt-8 border-t border-border pt-6">
      <div className="flex items-center justify-between mb-4">
        <span className="type-label-sm text-on-surface-secondary">
          Hero Image Preview
        </span>
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
