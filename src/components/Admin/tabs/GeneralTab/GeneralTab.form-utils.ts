import * as yup from 'yup';

export const generalTabSchema = yup.object({
  slug: yup.string().required('Slug is required'),
  destinationId: yup.string().required('Destination is required'),
  title: yup.string().required('Title is required'),
  titleVi: yup.string().defined(),
  titleEn: yup.string().defined(),
  duration: yup.number().min(0).required('Duration is required'),
  distance: yup.number().min(0).required('Distance is required'),
  descriptionVi: yup.string().defined(),
  descriptionEn: yup.string().defined(),
  transportation: yup.string().defined(),
  hotel: yup.string().defined(),
  guided: yup.string().defined(),
});

export type GeneralTabFormData = yup.InferType<typeof generalTabSchema>;
