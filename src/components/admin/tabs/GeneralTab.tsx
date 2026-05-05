'use client';

import {useState} from 'react';
import {ImageUploadField} from '@/components/admin/ImageUploadField';
import {StatusPicker} from '@/components/admin/StatusPicker';
import type {TourStatus, LocalizedText} from '@/types';

export interface GeneralTabData {
  slug: string;
  destinationId: string;
  title: string;
  titleVi: string;
  titleEn: string;
  imageUrl: string;
  price: number;
  duration: number;
  distance: number;
  descriptionVi: string;
  descriptionEn: string;
  transportation: string;
  groupSize: number;
  hotel: string;
  guided: string;
  images: string[];
  included: LocalizedText[];
  excluded: LocalizedText[];
  paymentDetails: LocalizedText;
  notes: LocalizedText[];
  mealsInfo: LocalizedText;
  status: TourStatus;
}

interface GeneralTabProps {
  initialData: GeneralTabData;
  destinations: Array<{id: string; name: string}>;
  tourId: string | null;
  onDestinationChange?: (destinationId: string) => void;
  onSave: (data: GeneralTabData) => Promise<void>;
}

export function GeneralTab({
  initialData,
  destinations,
  tourId,
  onDestinationChange,
  onSave,
}: GeneralTabProps) {
  const [form, setForm] = useState<GeneralTabData>(initialData);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [savedForm, setSavedForm] = useState<GeneralTabData>(initialData);

  const isDirty = JSON.stringify(form) !== JSON.stringify(savedForm);

  function updateField<K extends keyof GeneralTabData>(
    key: K,
    value: GeneralTabData[K],
  ) {
    setForm((prev) => {
      const next = {...prev, [key]: value};
      if (key === 'destinationId') {
        onDestinationChange?.(value as string);
      }
      return next;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await onSave(form);
      setSavedForm(form);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <h2 className="type-title-lg text-on-surface">General Info</h2>
        <StatusPicker
          value={form.status}
          onChange={(status) => updateField('status', status)}
        />
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-lg type-body-sm">
          {error}
        </div>
      )}

      {/* Basic fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block type-label-sm text-on-surface-secondary mb-1">
            Slug
          </label>
          <input
            type="text"
            required
            value={form.slug}
            onChange={(e) => updateField('slug', e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-on-surface focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
          />
        </div>
        <div>
          <label className="block type-label-sm text-on-surface-secondary mb-1">
            Destination
          </label>
          <select
            required
            value={form.destinationId}
            onChange={(e) => updateField('destinationId', e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-on-surface focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
          >
            <option value="">Select...</option>
            {destinations.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block type-label-sm text-on-surface-secondary mb-1">
          Title
        </label>
        <input
          type="text"
          required
          value={form.title}
          onChange={(e) => updateField('title', e.target.value)}
          className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-on-surface focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
        />
      </div>

      {/* Localized descriptions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block type-label-sm text-on-surface-secondary mb-1">
            Description (EN)
          </label>
          <textarea
            rows={4}
            value={form.descriptionEn}
            onChange={(e) => updateField('descriptionEn', e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-on-surface focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
          />
        </div>
        <div>
          <label className="block type-label-sm text-on-surface-secondary mb-1">
            Description (VI)
          </label>
          <textarea
            rows={4}
            value={form.descriptionVi}
            onChange={(e) => updateField('descriptionVi', e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-on-surface focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
          />
        </div>
      </div>

      {/* Numeric fields */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {key: 'price' as const, label: 'Price ($)'},
          {key: 'duration' as const, label: 'Duration (days)'},
          {key: 'distance' as const, label: 'Distance (km)'},
          {key: 'groupSize' as const, label: 'Group Size'},
        ].map(({key, label}) => (
          <div key={key}>
            <label className="block type-label-sm text-on-surface-secondary mb-1">
              {label}
            </label>
            <input
              type="number"
              min={0}
              value={form[key]}
              onChange={(e) =>
                updateField(key, Number(e.target.value) as never)
              }
              className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-on-surface focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
            />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {[
          {key: 'transportation' as const, label: 'Transportation'},
          {key: 'hotel' as const, label: 'Hotel'},
          {key: 'guided' as const, label: 'Guided'},
        ].map(({key, label}) => (
          <div key={key}>
            <label className="block type-label-sm text-on-surface-secondary mb-1">
              {label}
            </label>
            <input
              type="text"
              value={form[key]}
              onChange={(e) => updateField(key, e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-on-surface focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
            />
          </div>
        ))}
      </div>

      {/* Image */}
      <ImageUploadField
        entityType="tour"
        entityId={tourId}
        imageType="card"
        currentUrl={form.imageUrl}
        onUploadComplete={(url) => updateField('imageUrl', url)}
        label="Card Image"
      />

      {/* Submit */}
      <div className="flex gap-4 pt-4">
        <button
          type="submit"
          disabled={saving || !isDirty}
          className="bg-primary hover:bg-primary-light text-on-primary px-6 py-2.5 rounded-lg type-label-sm uppercase transition-colors disabled:opacity-50 cursor-pointer"
        >
          {saving ? 'Saving...' : 'Save General'}
        </button>
      </div>

      {isDirty && (
        <p className="type-label-sm text-amber-500">Unsaved changes</p>
      )}
    </form>
  );
}
