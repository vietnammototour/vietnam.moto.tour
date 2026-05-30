import * as yup from 'yup';

export type ReviewFormValues = {
  tourId: string;
  reviewerName: string;
  reviewerLocation: string;
  avatarUrl: string;
  rating: number;
  title: string;
  body: string;
  reviewDate: string;
  sourceUrl: string;
  images: string[];
  isFeatured: boolean;
  displayOrder: number;
};

export const reviewFormDefaults: ReviewFormValues = {
  tourId: '',
  reviewerName: '',
  reviewerLocation: '',
  avatarUrl: '',
  rating: 5,
  title: '',
  body: '',
  reviewDate: '',
  sourceUrl: '',
  images: [''],
  isFeatured: false,
  displayOrder: 0,
};

export function buildReviewSchema(t: (k: string) => string) {
  return yup.object({
    tourId: yup.string().required(t('validation.tourRequired')),
    reviewerName: yup.string().required(t('validation.nameRequired')),
    reviewerLocation: yup.string().default(''),
    avatarUrl: yup
      .string()
      .url(t('validation.urlInvalid'))
      .transform((v) => v || '')
      .default(''),
    rating: yup
      .number()
      .typeError(t('validation.ratingRange'))
      .integer()
      .min(1, t('validation.ratingRange'))
      .max(5, t('validation.ratingRange'))
      .required(),
    title: yup.string().default(''),
    body: yup.string().required(t('validation.bodyRequired')),
    reviewDate: yup.string().required(t('validation.dateRequired')),
    sourceUrl: yup
      .string()
      .url(t('validation.urlInvalid'))
      .required(t('validation.sourceRequired')),
    images: yup
      .array()
      .of(yup.string().default(''))
      .max(5)
      .default(['']),
    isFeatured: yup.boolean().default(false),
    displayOrder: yup
      .number()
      .typeError(t('validation.displayOrderRange'))
      .integer(t('validation.displayOrderRange'))
      .min(0, t('validation.displayOrderRange'))
      .default(0),
  });
}

// Drops blank image URLs and shapes the create/update payload.
export function toReviewPayload(values: ReviewFormValues): Record<string, unknown> {
  return {
    ...values,
    images: values.images.map((u) => u.trim()).filter((u) => u.length > 0),
  };
}
