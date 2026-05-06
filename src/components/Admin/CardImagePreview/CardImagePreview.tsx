'use client';

import {DestinationCard} from '@/components/DestinationCard';
import {ImageUploadField} from '../ImageUploadField';

type CardImagePreviewProps = {
  destinationId: string | null;
  imageUrl: string;
  destinationName: string;
  size: 'small' | 'large';
  onImageChange: (url: string) => void;
  onSizeChange: (size: 'small' | 'large') => void;
};

function PlaceholderCard({big}: {big?: boolean}) {
  return (
    <div
      className={`relative rounded-lg overflow-hidden bg-surface-alt flex flex-col items-center justify-center text-on-surface-muted ${big ? 'h-full' : 'aspect-[3/2]'}`}
    >
      <i className="fa fa-image text-2xl opacity-20 mb-1" />
      <span className="type-label-sm uppercase opacity-40">Destination</span>
    </div>
  );
}

export function CardImagePreview({
  destinationId,
  imageUrl,
  destinationName,
  size,
  onImageChange,
  onSizeChange,
}: CardImagePreviewProps) {
  const cardDestination = {
    id: 0,
    name: destinationName || 'Destination Name',
    imageUrl: imageUrl,
    heroImage: '',
    size: size,
    tourCount: 3,
    hasCar: false,
    hasBike: true,
  };

  return (
    <div className="space-y-5">
      {/* Controls row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="type-label-sm text-on-surface-secondary">
            Card Size:
          </span>
          <div className="flex rounded-lg border border-border overflow-hidden">
            <button
              type="button"
              onClick={() => onSizeChange('small')}
              className={`px-4 py-1.5 type-label-sm transition-colors cursor-pointer ${
                size === 'small'
                  ? 'bg-primary text-on-primary'
                  : 'bg-surface text-on-surface-secondary hover:bg-surface-alt'
              }`}
            >
              Small
            </button>
            <button
              type="button"
              onClick={() => onSizeChange('large')}
              className={`px-4 py-1.5 type-label-sm transition-colors cursor-pointer ${
                size === 'large'
                  ? 'bg-primary text-on-primary'
                  : 'bg-surface text-on-surface-secondary hover:bg-surface-alt'
              }`}
            >
              Big
            </button>
          </div>
        </div>
        <ImageUploadField
          entityType="destination"
          entityId={destinationId}
          imageType="card"
          currentUrl={imageUrl}
          onUploadComplete={onImageChange}
          label=""
          compact
        />
      </div>

      {/* Masonry grid preview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {size === 'large' ? (
          <>
            {/* Position 1: edited card (big, 2x2) */}
            <div className="sm:col-span-2 sm:row-span-2 relative">
              <div className="absolute top-2 left-2 z-30 bg-primary text-on-primary px-2 py-0.5 rounded type-label-sm uppercase">
                Editing
              </div>
              <div className="ring-2 ring-primary rounded-lg h-full [&_a]:pointer-events-none">
                <DestinationCard
                  destination={cardDestination}
                  className="h-full"
                />
              </div>
            </div>
            {/* Positions 2-5: placeholders */}
            <PlaceholderCard />
            <PlaceholderCard />
            <PlaceholderCard />
            <PlaceholderCard />
          </>
        ) : (
          <>
            {/* Position 1: placeholder (big, 2x2) */}
            <div className="sm:col-span-2 sm:row-span-2">
              <PlaceholderCard big />
            </div>
            {/* Position 2: edited card (small) */}
            <div className="relative">
              <div className="absolute top-2 left-2 z-30 bg-primary text-on-primary px-2 py-0.5 rounded type-label-sm uppercase">
                Editing
              </div>
              <div className="ring-2 ring-primary rounded-lg [&_a]:pointer-events-none">
                <DestinationCard destination={cardDestination} />
              </div>
            </div>
            {/* Positions 3-5: placeholders */}
            <PlaceholderCard />
            <PlaceholderCard />
            <PlaceholderCard />
          </>
        )}
      </div>
    </div>
  );
}
