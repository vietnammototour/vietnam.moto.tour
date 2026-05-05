'use client';

import {useState} from 'react';
import {useRouter} from 'next/router';
import {ImageUploadField} from './ImageUploadField';
import {StatusPicker} from './StatusPicker';
import type {TourStatus} from '@/types';

interface TourFormData {
  slug: string;
  destinationId: string;
  title: string;
  titleVi: string;
  titleEn: string;
  imageUrl: string;
  rating: string;
  price: number;
  duration: string;
  distance: string;
  descriptionVi: string;
  descriptionEn: string;
  transportation: string;
  groupSize: string;
  hotel: string;
  guided: string;
  images: string[];
  highlights: Array<{en: string; vi: string}>;
  itinerary: Array<{
    dayLabel: {en: string; vi: string};
    items: Array<{time: string; description: {en: string; vi: string}}>;
  }>;
  pricingGroups: Array<{
    type: string;
    label: {en: string; vi: string};
    tiers: Array<{
      label: {en: string; vi: string};
      price: number;
      minGroupSize?: number;
      maxGroupSize?: number;
    }>;
  }>;
  included: Array<{en: string; vi: string}>;
  excluded: Array<{en: string; vi: string}>;
  paymentDetails: {en: string; vi: string};
  notes: Array<{en: string; vi: string}>;
  mealsInfo: {en: string; vi: string};
  status: TourStatus;
}

interface TourFormProps {
  initialData?: TourFormData;
  destinations: Array<{id: string; name: string}>;
  mode: 'create' | 'edit';
  tourId?: string;
}

const emptyForm: TourFormData = {
  slug: '',
  destinationId: '',
  title: '',
  titleVi: '',
  titleEn: '',
  imageUrl: '',
  rating: '',
  price: 0,
  duration: '',
  distance: '',
  descriptionVi: '',
  descriptionEn: '',
  transportation: '',
  groupSize: '',
  hotel: '',
  guided: '',
  images: [],
  highlights: [],
  itinerary: [],
  pricingGroups: [],
  included: [],
  excluded: [],
  paymentDetails: {en: '', vi: ''},
  notes: [],
  mealsInfo: {en: '', vi: ''},
  status: 'DRAFT' as TourStatus,
};

export function TourForm({
  initialData,
  destinations,
  mode,
  tourId,
}: TourFormProps) {
  const router = useRouter();
  const [form, setForm] = useState<TourFormData>(initialData ?? emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  function updateField<K extends keyof TourFormData>(
    key: K,
    value: TourFormData[K],
  ) {
    setForm((prev) => ({...prev, [key]: value}));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');

    const url =
      mode === 'create' ? '/api/admin/tours' : `/api/admin/tours/${tourId}`;
    const method = mode === 'create' ? 'POST' : 'PUT';

    const res = await fetch(url, {
      method,
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(form),
    });

    setSaving(false);

    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? 'Failed to save');
      return;
    }

    router.push('/admin/tours');
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl">
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
            className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
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
            className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
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
          className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
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
            className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
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
            className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>

      {/* Numeric / short fields */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div>
          <label className="block type-label-sm text-on-surface-secondary mb-1">
            Price ($)
          </label>
          <input
            type="number"
            value={form.price}
            onChange={(e) => updateField('price', Number(e.target.value))}
            className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div>
          <label className="block type-label-sm text-on-surface-secondary mb-1">
            Duration
          </label>
          <input
            type="text"
            value={form.duration}
            onChange={(e) => updateField('duration', e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div>
          <label className="block type-label-sm text-on-surface-secondary mb-1">
            Distance
          </label>
          <input
            type="text"
            value={form.distance}
            onChange={(e) => updateField('distance', e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div>
          <label className="block type-label-sm text-on-surface-secondary mb-1">
            Rating
          </label>
          <input
            type="text"
            value={form.rating}
            onChange={(e) => updateField('rating', e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div>
          <label className="block type-label-sm text-on-surface-secondary mb-1">
            Transportation
          </label>
          <input
            type="text"
            value={form.transportation}
            onChange={(e) => updateField('transportation', e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div>
          <label className="block type-label-sm text-on-surface-secondary mb-1">
            Group Size
          </label>
          <input
            type="text"
            value={form.groupSize}
            onChange={(e) => updateField('groupSize', e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div>
          <label className="block type-label-sm text-on-surface-secondary mb-1">
            Hotel
          </label>
          <input
            type="text"
            value={form.hotel}
            onChange={(e) => updateField('hotel', e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div>
          <label className="block type-label-sm text-on-surface-secondary mb-1">
            Guided
          </label>
          <input
            type="text"
            value={form.guided}
            onChange={(e) => updateField('guided', e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>

      {/* Image */}
      <ImageUploadField
        entityType="tour"
        entityId={tourId ?? null}
        imageType="card"
        currentUrl={form.imageUrl}
        onUploadComplete={(url) => updateField('imageUrl', url)}
        label="Card Image"
      />

      {/* Status */}
      <div>
        <label className="block type-label-sm text-on-surface-secondary mb-2">
          Status
        </label>
        <StatusPicker
          value={form.status}
          onChange={(status) => updateField('status', status)}
        />
      </div>

      {/* Submit */}
      <div className="flex gap-4 pt-4">
        <button
          type="submit"
          disabled={saving}
          className="bg-primary hover:bg-primary-light text-on-primary px-6 py-2.5 rounded-lg type-label-sm uppercase transition-colors disabled:opacity-50 cursor-pointer"
        >
          {saving
            ? 'Saving...'
            : mode === 'create'
              ? 'Create Tour'
              : 'Save Changes'}
        </button>
        <button
          type="button"
          onClick={() => router.push('/admin/tours')}
          className="px-6 py-2.5 rounded-lg border border-border type-label-sm text-on-surface-secondary hover:bg-surface-alt transition-colors cursor-pointer"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
