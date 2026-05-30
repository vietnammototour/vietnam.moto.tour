import {useForm, Controller} from 'react-hook-form';
import {yupResolver} from '@hookform/resolvers/yup';
import {useTranslations} from 'next-intl';
import {Select, NumberInput} from '@/components/ui';
import {EditableProvider} from '@/components/Admin/EditableContext';
import {ReviewCard} from '@/components/reviews/ReviewCard';
import {
  buildReviewSchema,
  reviewFormDefaults,
  type ReviewFormValues,
} from '@/components/Admin/ReviewForm/ReviewForm.form-utils';
import type * as VMT from '@/domain';

type TourOption = {id: string; label: string};

type ReviewCardEditorProps = {
  id?: string;
  tours: TourOption[];
  defaults?: ReviewFormValues;
  onSubmit: (data: ReviewFormValues) => void;
};

function toDraft(values: ReviewFormValues): VMT.Review {
  return {
    id: 'draft',
    tourId: values.tourId,
    reviewerName: values.reviewerName,
    reviewerLocation: values.reviewerLocation || null,
    avatarUrl: values.avatarUrl || null,
    rating: values.rating,
    title: values.title,
    body: values.body,
    reviewDate: values.reviewDate,
    sourceUrl: values.sourceUrl,
    images: values.images,
    isFeatured: values.isFeatured,
    displayOrder: values.displayOrder,
    createdAt: '',
    updatedAt: '',
  };
}

export function ReviewCardEditor({
  id = 'review-form',
  tours,
  defaults,
  onSubmit,
}: ReviewCardEditorProps) {
  const t = useTranslations('admin.reviews');
  const tReviews = useTranslations('reviews');
  const {
    control,
    register,
    handleSubmit,
    watch,
    getValues,
    setValue,
    formState: {errors},
  } = useForm<ReviewFormValues>({
    resolver: yupResolver(buildReviewSchema(t)),
    defaultValues: defaults ?? reviewFormDefaults,
  });

  const values = watch();

  function handleFieldChange(path: string, value: string | number) {
    if (path.startsWith('images.')) {
      const i = Number(path.slice('images.'.length));
      const next = [...getValues('images')];
      next[i] = String(value);
      setValue('images', next, {shouldDirty: true});
      return;
    }
    if (path === 'rating') {
      setValue('rating', Number(value), {shouldDirty: true});
      return;
    }
    setValue(path as keyof ReviewFormValues, value as never, {
      shouldDirty: true,
    });
  }

  function handleRemoveItem(path: string) {
    if (!path.startsWith('images.')) return;
    const i = Number(path.slice('images.'.length));
    const next = getValues('images').filter((_, idx) => idx !== i);
    setValue('images', next, {shouldDirty: true});
  }

  const errorList = Object.values(errors)
    .map((e) => e?.message)
    .filter((m): m is string => typeof m === 'string');

  return (
    <form
      id={id}
      onSubmit={handleSubmit((data) => onSubmit(data))}
      className="flex flex-col gap-6"
    >
      {/* Meta bar — off-card controls */}
      <div className="flex flex-wrap items-end gap-4 border border-border bg-surface-elevated p-4">
        <div className="min-w-56 flex-1">
          <Controller
            control={control}
            name="tourId"
            render={({field, fieldState}) => (
              <Select
                label={t('tourLabel')}
                placeholder={t('tourPlaceholder')}
                options={tours.map((tour) => ({
                  value: tour.id,
                  label: tour.label,
                }))}
                value={field.value}
                onChange={field.onChange}
                error={fieldState.error?.message}
              />
            )}
          />
        </div>
        <div className="w-32">
          <NumberInput
            label={t('displayOrderLabel')}
            {...register('displayOrder', {valueAsNumber: true})}
            error={errors.displayOrder?.message}
          />
        </div>
        <label className="flex items-center gap-2 cursor-pointer pb-2">
          <input
            type="checkbox"
            className="cursor-pointer"
            {...register('isFeatured')}
          />
          <span className="type-body-sm text-on-surface">
            {t('isFeaturedLabel')}
          </span>
        </label>
      </div>

      {errorList.length > 0 && (
        <div
          role="alert"
          className="border border-error/40 bg-error/5 p-3 font-mono text-xs text-error"
        >
          <ul className="list-disc pl-4">
            {errorList.map((m) => (
              <li key={m}>{m}</li>
            ))}
          </ul>
        </div>
      )}

      {/* The public widget, rendered as an inline editor */}
      <EditableProvider
        locale="en"
        onFieldChange={handleFieldChange}
        onRemoveItem={handleRemoveItem}
      >
        <div className="max-w-2xl">
          <ReviewCard
            review={toDraft(values)}
            verifyLabel={tReviews('verifiedOn')}
            photoLabel={(n) => tReviews('photoNth', {n})}
          />
        </div>
      </EditableProvider>
    </form>
  );
}
