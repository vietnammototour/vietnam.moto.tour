import {useState} from 'react';
import {useForm, Controller} from 'react-hook-form';
import {yupResolver} from '@hookform/resolvers/yup';
import {useTranslations} from 'next-intl';
import {Button, TextInput, Textarea, NumberInput, Select} from '@/components/ui';
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
  const tCommon = useTranslations('common');
  const {
    control,
    register,
    handleSubmit,
    getValues,
    setValue,
    formState: {errors},
  } = useForm<ReviewFormValues>({
    resolver: yupResolver(buildReviewSchema(t)),
    defaultValues: defaults ?? reviewFormDefaults,
  });

  const initialImages = defaults?.images ?? reviewFormDefaults.images;
  const [visibleImages, setVisibleImages] = useState(() => {
    const filled = initialImages.filter((u) => u.trim().length > 0).length;
    return Math.min(5, Math.max(1, filled));
  });

  // Removes the field at `index`, shifting later URLs up so indices stay
  // contiguous, and hides the now-empty trailing field.
  function removeImage(index: number) {
    const imgs = [...getValues('images')];
    for (let j = index; j < 4; j++) imgs[j] = imgs[j + 1] ?? '';
    imgs[4] = '';
    setValue('images', imgs, {shouldDirty: true});
    setVisibleImages((v) => Math.max(1, v - 1));
  }

  return (
    <form
      id={id}
      onSubmit={handleSubmit((data) => onSubmit(data))}
      className="w-full grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6 bg-surface-elevated border border-border p-6"
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
      <NumberInput
        label={t('displayOrderLabel')}
        {...register('displayOrder', {valueAsNumber: true})}
        error={errors.displayOrder?.message}
      />
      <label className="flex items-center gap-2 cursor-pointer self-end pb-2">
        <input type="checkbox" className="cursor-pointer" {...register('isFeatured')} />
        <span className="type-body-sm text-on-surface">{t('isFeaturedLabel')}</span>
      </label>

      <div className="md:col-span-2">
        <Textarea
          label={t('bodyLabel')}
          rows={5}
          {...register('body')}
          error={errors.body?.message}
        />
      </div>

      <fieldset className="md:col-span-2 space-y-3">
        <legend className="block type-label-sm text-on-surface-secondary mb-1">
          {t('imagesLabel')}
        </legend>
        {Array.from({length: visibleImages}, (_, i) => (
          <div key={i} className="flex items-start gap-2">
            <div className="flex-1">
              <TextInput
                label={t('imageUrlNth', {n: i + 1})}
                {...register(`images.${i}` as const)}
                error={errors.images?.[i]?.message}
              />
            </div>
            {visibleImages > 1 && (
              <Button
                type="button"
                variant="ghost-danger"
                size="sm"
                className="mt-6"
                icon={<i className="fa fa-times text-xs" />}
                onClick={() => removeImage(i)}
              >
                {tCommon('remove')}
              </Button>
            )}
          </div>
        ))}
        {visibleImages < 5 && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            icon={<i className="fa fa-plus text-xs" />}
            onClick={() => setVisibleImages((v) => Math.min(5, v + 1))}
          >
            {t('addPhotoUrl')}
          </Button>
        )}
      </fieldset>
    </form>
  );
}
