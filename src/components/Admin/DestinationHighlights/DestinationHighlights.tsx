'use client';

import {useState, useEffect, useCallback} from 'react';
import {useForm} from 'react-hook-form';
import {yupResolver} from '@hookform/resolvers/yup';
import {HighlightRowImage} from './HighlightRowImage';
import {TextInput, Button, ConfirmModal} from '@/components/ui';
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
  locale,
}: DestinationHighlightsProps) {
  const titleField = locale === 'en' ? 'titleEn' : 'titleVi';
  const descField = locale === 'en' ? 'descriptionEn' : 'descriptionVi';
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

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
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchHighlights();
  }, [fetchHighlights]);

  async function onSubmitAdd(data: AddHighlightFormData) {
    const {error} = await submitAddHighlight(data, destinationId, locale);
    if (!error) {
      reset();
      await fetchHighlights();
    }
  }

  async function performDelete() {
    if (!deleteId) return;
    setDeleting(true);
    setDeleteError(null);
    const {error} = await api.admin.highlights.delete(deleteId);
    setDeleting(false);
    if (error) {
      setDeleteError(error);
      return;
    }
    setDeleteId(null);
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
        {highlights.map((h) => (
          <div
            key={h.id}
            className="flex flex-col gap-3 p-3 rounded-lg border border-border bg-surface-elevated"
          >
            <HighlightRowImage
              highlightId={h.id}
              initialUrl={h.imageUrl}
              onSaved={fetchHighlights}
            />
            <div className="space-y-1">
              {(
                [
                  [titleField, 'Title'],
                  [descField, 'Description'],
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
            </div>
            <Button
              variant="danger"
              size="sm"
              type="button"
              onClick={() => setDeleteId(h.id)}
              className="self-end"
            >
              Delete
            </Button>
          </div>
        ))}

        <form
          onSubmit={handleSubmit(onSubmitAdd)}
          className="flex flex-col gap-3 p-3 rounded-lg border border-dashed border-border bg-surface-elevated/50"
        >
          <div className="h-[12.5rem] rounded-lg border-2 border-dashed border-border flex items-center justify-center type-body-sm text-on-surface-secondary">
            Add highlight
          </div>
          <div className="space-y-1">
            <TextInput
              {...register('title')}
              placeholder="Title"
              error={errors.title?.message}
            />
            <TextInput
              {...register('description')}
              placeholder="Description"
              error={errors.description?.message}
            />
          </div>
          <Button type="submit" loading={isSubmitting} size="sm">
            Add
          </Button>
        </form>
      </div>
      <ConfirmModal
        open={!!deleteId}
        title="Delete this highlight?"
        confirmLabel="Delete"
        variant="danger"
        loading={deleting}
        error={deleteError}
        onConfirm={performDelete}
        onCancel={() => {
          if (deleting) return;
          setDeleteId(null);
          setDeleteError(null);
        }}
      />
    </div>
  );
}
