'use client';

import {useState} from 'react';
import {useRouter} from 'next/router';
import {HeroImagePreview} from './HeroImagePreview';
import type {DestinationFormData} from './DestinationEditTabs';
import type {Locale} from './LocalePicker';

interface DestinationGeneralFormProps {
  form: DestinationFormData;
  locale: Locale;
  mode: 'create' | 'edit';
  destinationId: string | null;
  onFieldChange: <K extends keyof DestinationFormData>(
    key: K,
    value: DestinationFormData[K],
  ) => void;
  onSaved?: (id: string) => void;
}

export function DestinationGeneralForm({
  form,
  locale,
  mode,
  destinationId,
  onFieldChange,
  onSaved,
}: DestinationGeneralFormProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const nameField = locale === 'en' ? 'nameEn' : 'nameVi';
  const descField = locale === 'en' ? 'descriptionEn' : 'descriptionVi';
  const currentName = form[nameField];
  const currentDesc = form[descField];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');

    const url =
      mode === 'create'
        ? '/api/admin/destinations'
        : `/api/admin/destinations/${destinationId}`;
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

    if (onSaved) {
      const data = await res.json();
      onSaved(data.id ?? destinationId);
    } else {
      router.push('/admin/destinations');
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-lg type-body-sm">
          {error}
        </div>
      )}

      <div className="max-w-2xl space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block type-label-sm text-on-surface-secondary mb-1">
              Slug
            </label>
            <input
              type="text"
              required
              value={form.slug}
              onChange={(e) => onFieldChange('slug', e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div>
            <label className="block type-label-sm text-on-surface-secondary mb-1">
              Name
            </label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => onFieldChange('name', e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>

        <div>
          <label className="block type-label-sm text-on-surface-secondary mb-1">
            Name ({locale.toUpperCase()})
          </label>
          <input
            type="text"
            value={currentName}
            onChange={(e) => onFieldChange(nameField, e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div>
          <label className="block type-label-sm text-on-surface-secondary mb-1">
            Description ({locale.toUpperCase()})
          </label>
          <textarea
            rows={4}
            value={currentDesc}
            onChange={(e) => onFieldChange(descField, e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div className="flex gap-4 pt-4">
          <button
            type="submit"
            disabled={saving}
            className="bg-primary hover:bg-primary-light text-on-primary px-6 py-2.5 rounded-lg type-label-sm uppercase transition-colors disabled:opacity-50 cursor-pointer"
          >
            {saving
              ? 'Saving...'
              : mode === 'create'
                ? 'Create Destination'
                : 'Save Changes'}
          </button>
        </div>
      </div>

      {/* Hero Image Preview */}
      <HeroImagePreview
        destinationId={destinationId}
        heroImage={form.heroImage}
        destinationName={currentName || form.name}
        onImageChange={(url) => onFieldChange('heroImage', url)}
      />
    </form>
  );
}
