'use client';

import {useState, useEffect, useCallback} from 'react';
import Image from 'next/image';
import {useForm} from 'react-hook-form';
import {yupResolver} from '@hookform/resolvers/yup';
import {HighlightRowImage} from './HighlightRowImage';
import {TextInput, Button} from '@/components/ui';
import {api} from '@/routes';
import {
  addHighlightSchema,
  addHighlightDefaults,
  submitAddHighlight,
  type AddHighlightFormData,
} from './DestinationHighlights.form-utils';

type Highlight = {
  id: string;
  titleEn: string;
  titleVi: string;
  descriptionEn: string;
  descriptionVi: string;
  imageUrl: string | null;
};

type DestinationHighlightsProps = {
  destinationId: string;
  locale: 'en' | 'vi';
};

export function DestinationHighlights({
  destinationId,
}: DestinationHighlightsProps) {
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [loading, setLoading] = useState(true);

  const {
    register,
    handleSubmit,
    formState: {errors, isSubmitting},
    reset,
  } = useForm<AddHighlightFormData>({
    resolver: yupResolver(addHighlightSchema),
    defaultValues: addHighlightDefaults,
    shouldFocusError: true,
  });

  const fetchHighlights = useCallback(async () => {
    try {
      const {data, error} = await api.admin.highlights.list(destinationId);
      if (!error && data) setHighlights(data);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [destinationId]);

  useEffect(() => {
    fetchHighlights();
  }, [fetchHighlights]);

  async function onSubmitAdd(data: AddHighlightFormData) {
    const {error} = await submitAddHighlight(data, destinationId);
    if (!error) {
      reset();
      await fetchHighlights();
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this highlight?')) return;
    await api.admin.highlights.delete(id);
    await fetchHighlights();
  }

  async function handleUpdateField(
    id: string,
    field: 'titleEn' | 'titleVi' | 'descriptionEn' | 'descriptionVi',
    value: string,
  ) {
    await api.admin.highlights.update(id, {[field]: value});
    await fetchHighlights();
  }

  if (loading) {
    return (
      <p className="type-body-sm text-on-surface-secondary">
        Loading highlights...
      </p>
    );
  }

  return (
    <div>
      <h2 className="type-title-lg text-on-surface mb-4">
        Destination Highlights
      </h2>

      {/* Existing highlights — inline editing stays as-is */}
      <div className="space-y-3 mb-6">
        {highlights.map((h) => (
          <div
            key={h.id}
            className="flex items-start gap-3 p-3 rounded-lg border border-border bg-surface-elevated"
          >
            <div className="w-16 h-16 shrink-0">
              {h.imageUrl ? (
                <Image
                  src={h.imageUrl}
                  alt={h.titleEn}
                  width={64}
                  height={64}
                  className="rounded object-cover w-16 h-16"
                />
              ) : (
                <div className="w-16 h-16 rounded bg-surface-alt flex items-center justify-center type-label-sm text-on-surface-secondary">
                  No img
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0 space-y-1">
              {(
                [
                  ['titleEn', 'English title'],
                  ['titleVi', 'Vietnamese title'],
                  ['descriptionEn', 'English description'],
                  ['descriptionVi', 'Vietnamese description'],
                ] as const
              ).map(([field, placeholder]) => (
                <input
                  key={field}
                  type="text"
                  value={h[field]}
                  placeholder={placeholder}
                  onBlur={(e) => {
                    if (e.target.value !== h[field]) {
                      handleUpdateField(h.id, field, e.target.value);
                    }
                  }}
                  onChange={(e) => {
                    setHighlights((prev) =>
                      prev.map((x) =>
                        x.id === h.id ? {...x, [field]: e.target.value} : x,
                      ),
                    );
                  }}
                  className="w-full px-2 py-1 rounded border border-border bg-surface text-on-surface type-body-sm cursor-pointer"
                />
              ))}
              <HighlightRowImage
                highlightId={h.id}
                initialUrl={h.imageUrl}
                onSaved={fetchHighlights}
              />
            </div>
            <Button
              variant="danger"
              size="sm"
              onClick={() => handleDelete(h.id)}
            >
              Delete
            </Button>
          </div>
        ))}
      </div>

      {/* Add new — migrated to RHF */}
      <form
        onSubmit={handleSubmit(onSubmitAdd)}
        className="p-4 rounded-lg border border-dashed border-border"
      >
        <h3 className="type-title-sm text-on-surface mb-3">Add Highlight</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
          <TextInput
            {...register('titleEn')}
            placeholder="English title"
            error={errors.titleEn?.message}
          />
          <TextInput
            {...register('titleVi')}
            placeholder="Vietnamese title"
            error={errors.titleVi?.message}
          />
          <TextInput
            {...register('descriptionEn')}
            placeholder="English description"
            error={errors.descriptionEn?.message}
          />
          <TextInput
            {...register('descriptionVi')}
            placeholder="Vietnamese description"
            error={errors.descriptionVi?.message}
          />
        </div>
        <Button type="submit" loading={isSubmitting} size="sm">
          Add
        </Button>
      </form>
    </div>
  );
}
