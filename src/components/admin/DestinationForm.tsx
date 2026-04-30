'use client';

import {useState} from 'react';
import {useRouter} from 'next/router';
import {ImageUploadField} from './ImageUploadField';

interface DestinationFormData {
  slug: string;
  name: string;
  nameVi: string;
  nameEn: string;
  imageUrl: string;
  heroImage: string;
  descriptionVi: string;
  descriptionEn: string;
  size: string;
}

interface DestinationFormProps {
  initialData?: DestinationFormData;
  mode: 'create' | 'edit';
  destinationId?: string;
}

const emptyForm: DestinationFormData = {
  slug: '',
  name: '',
  nameVi: '',
  nameEn: '',
  imageUrl: '',
  heroImage: '',
  descriptionVi: '',
  descriptionEn: '',
  size: 'small',
};

export function DestinationForm({
  initialData,
  mode,
  destinationId,
}: DestinationFormProps) {
  const router = useRouter();
  const [form, setForm] = useState<DestinationFormData>(
    initialData ?? emptyForm,
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  function updateField<K extends keyof DestinationFormData>(
    key: K,
    value: DestinationFormData[K],
  ) {
    setForm((prev) => ({...prev, [key]: value}));
  }

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

    router.push('/admin/destinations');
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-lg type-body-sm">
          {error}
        </div>
      )}

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
            Name
          </label>
          <input
            type="text"
            required
            value={form.name}
            onChange={(e) => updateField('name', e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block type-label-sm text-on-surface-secondary mb-1">
            Name (EN)
          </label>
          <input
            type="text"
            value={form.nameEn}
            onChange={(e) => updateField('nameEn', e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div>
          <label className="block type-label-sm text-on-surface-secondary mb-1">
            Name (VI)
          </label>
          <input
            type="text"
            value={form.nameVi}
            onChange={(e) => updateField('nameVi', e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block type-label-sm text-on-surface-secondary mb-1">
            Description (EN)
          </label>
          <textarea
            rows={3}
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
            rows={3}
            value={form.descriptionVi}
            onChange={(e) => updateField('descriptionVi', e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <ImageUploadField
            entityType="destination"
            entityId={destinationId ?? null}
            imageType="card"
            currentUrl={form.imageUrl}
            onUploadComplete={(url) => updateField('imageUrl', url)}
            label="Card Image"
          />
        </div>
        <div>
          <label className="block type-label-sm text-on-surface-secondary mb-1">
            Size
          </label>
          <select
            value={form.size}
            onChange={(e) => updateField('size', e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="small">Small</option>
            <option value="large">Large</option>
          </select>
        </div>
      </div>

      <ImageUploadField
        entityType="destination"
        entityId={destinationId ?? null}
        imageType="hero"
        currentUrl={form.heroImage}
        onUploadComplete={(url) => updateField('heroImage', url)}
        label="Hero Image"
      />

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
        <button
          type="button"
          onClick={() => router.push('/admin/destinations')}
          className="px-6 py-2.5 rounded-lg border border-border type-label-sm text-on-surface-secondary hover:bg-surface-alt transition-colors cursor-pointer"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
