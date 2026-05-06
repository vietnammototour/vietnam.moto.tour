'use client';

import {useState} from 'react';
import {ImageUpload} from '@/components/ui';
import {flushImageSlots} from '@/lib/submit-with-images';
import {savedSlot, type ImageSlot, isDirty} from '@/lib/image-slot';

type Props = {
  highlightId: string;
  initialUrl: string | null;
  onSaved: () => void;
};

export function HighlightRowImage({highlightId, initialUrl, onSaved}: Props) {
  const [slot, setSlot] = useState<ImageSlot>(savedSlot(initialUrl));
  const [error, setError] = useState<string | null>(null);

  async function handleChange(next: ImageSlot) {
    setSlot(next);
    if (!isDirty(next)) return;
    setError(null);
    const {errors} = await flushImageSlots({
      entityType: 'highlight',
      entityId: highlightId,
      slots: {card: next},
    });
    if (errors.card) {
      setError(errors.card);
      return;
    }
    onSaved();
  }

  return (
    <ImageUpload
      value={slot}
      onChange={handleChange}
      preset="card"
      error={error ?? undefined}
    />
  );
}
