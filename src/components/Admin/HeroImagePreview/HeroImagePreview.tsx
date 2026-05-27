'use client';

import {useState} from 'react';
import {TourHero} from '@/components/TourHero';
import {ImageUpload} from '@/components/ui';
import {flushImageSlots} from '@/lib/submit-with-images';
import {savedSlot, type ImageSlot, isDirty} from '@/lib/image-slot';
import {Button} from '@/components/ui/Button';

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
  const [slot, setSlot] = useState<ImageSlot>(savedSlot(heroImage));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    if (!destinationId || !isDirty(slot)) return;
    setSaving(true);
    setError(null);
    const {errors, updated} = await flushImageSlots({
      entityType: 'destination',
      entityId: destinationId,
      slots: {hero: slot},
    });
    setSaving(false);
    if (errors.hero) {
      setError(errors.hero);
      return;
    }
    const next = updated.hero!;
    setSlot(next);
    onImageChange(next.kind === 'saved' ? next.url : '');
  }

  const previewUrl = (() => {
    if (slot.kind === 'saved') return slot.url;
    if (slot.kind === 'pending-replace') return slot.previewUrl;
    return '';
  })();

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <span className="type-label-sm text-on-surface-secondary">
          Hero Image Preview
        </span>
        <div className="flex items-center gap-2">
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
      </div>
      <div className="mb-4">
        <ImageUpload
          value={slot}
          onChange={setSlot}
          preset="hero"
          error={error ?? undefined}
        />
      </div>
      <div className="overflow-hidden">
        <TourHero
          preview={{
            heroImage: previewUrl,
            destinationName: destinationName || 'Destination Name',
          }}
        />
      </div>
    </div>
  );
}
