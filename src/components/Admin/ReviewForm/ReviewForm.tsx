import {useForm, Controller} from 'react-hook-form';
import {yupResolver} from '@hookform/resolvers/yup';
import {useTranslations} from 'next-intl';
import {TextInput, Textarea, NumberInput, Select} from '@/components/ui';
import {
  buildReviewSchema,
  reviewFormDefaults,
  type ReviewFormValues,
} from './ReviewForm.form-utils';

type TourOption = {id: string; label: string};

type ReviewFormProps = {
  id?: string;
  tours: TourOption[];
  defaults?: ReviewFormValues;
  onSubmit: (data: ReviewFormValues) => void;
};

export function ReviewForm({
  id = 'review-form',
  tours,
  defaults,
  onSubmit,
}: ReviewFormProps) {
  const t = useTranslations('admin.reviews');
  const {
    control,
    register,
    handleSubmit,
    formState: {errors},
  } = useForm<ReviewFormValues>({
    resolver: yupResolver(buildReviewSchema(t)),
    defaultValues: defaults ?? reviewFormDefaults,
  });

  return (
    <form
      id={id}
      onSubmit={handleSubmit((data) => onSubmit(data))}
      className="max-w-2xl space-y-6 bg-surface-elevated border border-border p-6"
    >
      <Controller
        control={control}
        name="tourId"
        render={({field, fieldState}) => (
          <Select
            label={t('tourLabel')}
            placeholder={t('tourPlaceholder')}
            options={tours.map((tour) => ({value: tour.id, label: tour.label}))}
            value={field.value}
            onChange={field.onChange}
            error={fieldState.error?.message}
          />
        )}
      />

      <TextInput
        label={t('reviewerNameLabel')}
        {...register('reviewerName')}
        error={errors.reviewerName?.message}
      />
      <TextInput
        label={t('reviewerLocationLabel')}
        {...register('reviewerLocation')}
        error={errors.reviewerLocation?.message}
      />
      <TextInput
        label={t('avatarUrlLabel')}
        {...register('avatarUrl')}
        error={errors.avatarUrl?.message}
      />
      <NumberInput
        label={t('ratingLabel')}
        {...register('rating', {valueAsNumber: true})}
        error={errors.rating?.message}
      />
      <TextInput
        label={t('titleLabel')}
        {...register('title')}
        error={errors.title?.message}
      />
      <Textarea
        label={t('bodyLabel')}
        rows={5}
        {...register('body')}
        error={errors.body?.message}
      />
      <TextInput
        label={t('reviewDateLabel')}
        type="date"
        {...register('reviewDate')}
        error={errors.reviewDate?.message}
      />
      <TextInput
        label={t('sourceUrlLabel')}
        {...register('sourceUrl')}
        error={errors.sourceUrl?.message}
      />

      <fieldset className="space-y-3">
        <legend className="block type-label-sm text-on-surface-secondary mb-1">
          {t('imagesLabel')}
        </legend>
        {[0, 1, 2, 3, 4].map((i) => (
          <TextInput
            key={i}
            label={t('imageUrlNth', {n: i + 1})}
            {...register(`images.${i}` as const)}
            error={errors.images?.[i]?.message}
          />
        ))}
      </fieldset>

      <NumberInput
        label={t('displayOrderLabel')}
        {...register('displayOrder', {valueAsNumber: true})}
        error={errors.displayOrder?.message}
      />
      <label className="flex items-center gap-2 cursor-pointer">
        <input type="checkbox" className="cursor-pointer" {...register('isFeatured')} />
        <span className="type-body-sm text-on-surface">{t('isFeaturedLabel')}</span>
      </label>
    </form>
  );
}
