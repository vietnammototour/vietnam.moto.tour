'use client';

import {useState} from 'react';
import {useRouter} from 'next/router';
import {routes, api, useNavigate} from '@/routes';
import {HeroImagePreview} from './HeroImagePreview';
import type {DestinationFormData} from './DestinationEditTabs';
import type {Locale} from './LocalePicker';

type DestinationGeneralFormProps = {
  form: DestinationFormData;
  locale: Locale;
  mode: 'create' | 'edit';
  destinationId: string | null;
  imgVersion: number;
  onFieldChange: <K extends keyof DestinationFormData>(
    key: K,
    value: DestinationFormData[K],
  ) => void;
  onSaved?: (id: string) => void;
};

export function DestinationGeneralForm({
  form,
  locale,
  mode,
  destinationId,
  imgVersion,
  onFieldChange,
  onSaved,
}: DestinationGeneralFormProps) {
  const router = useRouter();
  const navigate = useNavigate();
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

    const result =
      mode === 'create'
        ? await api.admin.destinations.create(
            form as unknown as Record<string, unknown>,
          )
        : await api.admin.destinations.update(
            destinationId!,
            form as unknown as Record<string, unknown>,
          );

    setSaving(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    if (onSaved) {
      onSaved(String(result.data?.id ?? destinationId));
    } else {
      navigate.to(routes.admin.destinations.list);
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
        heroImage={form.heroImage ? `${form.heroImage}?v=${imgVersion}` : ''}
        destinationName={currentName || form.name}
        onImageChange={(url) => onFieldChange('heroImage', url)}
      />
    </form>
  );
}
