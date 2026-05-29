'use client';

import {useState} from 'react';
import {DestinationCard} from '@/components/DestinationCard';
import {ImageUpload} from '@/components/ui';
import {Button} from '@/components/ui';
import {SegmentedControl} from '@/components/ui/SegmentedControl';
import {flushImageSlots} from '@/lib/submit-with-images';
import {savedSlot, type ImageSlot, isDirty} from '@/lib/image-slot';

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
      className={`relative overflow-hidden bg-surface-alt flex flex-col items-center justify-center text-on-surface-muted ${big ? 'h-full' : 'aspect-[3/2]'}`}
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
  const [slot, setSlot] = useState<ImageSlot>(savedSlot(imageUrl));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    if (!destinationId || !isDirty(slot)) return;
    setSaving(true);
    setError(null);
    const {errors, updated} = await flushImageSlots({
      entityType: 'destination',
      entityId: destinationId,
      slots: {card: slot},
    });
    setSaving(false);
    if (errors.card) {
      setError(errors.card);
      return;
    }
    const next = updated.card!;
    setSlot(next);
    onImageChange(next.kind === 'saved' ? next.url : '');
  }

  const previewUrl = (() => {
    if (slot.kind === 'saved') return slot.url;
    if (slot.kind === 'pending-replace') return slot.previewUrl;
    return '';
  })();

  const resolvedName = destinationName || 'Destination Name';
  const cardDestination = {
    id: destinationId ?? '',
    slug: '',
    name: {en: resolvedName, vi: resolvedName},
    imageUrl: previewUrl,
    heroImage: '',
    size: size,
    isActive: true,
    tourCount: 3,
    carOnlyCount: 0,
    bikeOnlyCount: 2,
    bikeAndCarCount: 1,
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="type-label-sm text-on-surface-secondary">
            Card Size:
          </span>
          <SegmentedControl
            options={[
              {value: 'small', label: 'Small'},
              {value: 'large', label: 'Big'},
            ]}
            value={size}
            onChange={onSizeChange}
          />
        </div>
        {isDirty(slot) && destinationId && (
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={handleSave}
            loading={saving}
          >
            Save
          </Button>
        )}
      </div>

      <ImageUpload
        value={slot}
        onChange={setSlot}
        preset="card"
        error={error ?? undefined}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {size === 'large' ? (
          <>
            <div className="sm:col-span-2 sm:row-span-2 relative">
              <div className="absolute top-2 left-2 z-30 bg-primary text-on-primary px-2 py-0.5 type-label-sm uppercase">
                Editing
              </div>
              <div className="ring-2 ring-primary h-full [&_a]:pointer-events-none">
                <DestinationCard
                  destination={cardDestination}
                  className="h-full"
                />
              </div>
            </div>
            <PlaceholderCard />
            <PlaceholderCard />
            <PlaceholderCard />
            <PlaceholderCard />
          </>
        ) : (
          <>
            <div className="sm:col-span-2 sm:row-span-2">
              <PlaceholderCard big />
            </div>
            <div className="relative">
              <div className="absolute top-2 left-2 z-30 bg-primary text-on-primary px-2 py-0.5 type-label-sm uppercase">
                Editing
              </div>
              <div className="ring-2 ring-primary [&_a]:pointer-events-none">
                <DestinationCard destination={cardDestination} />
              </div>
            </div>
            <PlaceholderCard />
            <PlaceholderCard />
            <PlaceholderCard />
          </>
        )}
      </div>
    </div>
  );
}
