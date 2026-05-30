import * as yup from 'yup';

export const generalTabSchema = yup.object({
  slug: yup.string().required('Slug is required'),
  destinationId: yup.string().required('Destination is required'),
  titleVi: yup.string().required('Vietnamese title is required'),
  titleEn: yup.string().required('English title is required'),
  duration: yup.number().min(0).required('Duration is required'),
  distance: yup.number().min(0).required('Distance is required'),
  descriptionVi: yup.string().defined(),
  descriptionEn: yup.string().defined(),
  transportation: yup.string().defined(),
  hotel: yup.string().defined(),
  guided: yup.string().defined(),
  tripadvisorLocationId: yup.string().default(''),
});

export type GeneralTabFormData = yup.InferType<typeof generalTabSchema>;
