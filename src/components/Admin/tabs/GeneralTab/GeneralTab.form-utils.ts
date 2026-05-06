import * as yup from 'yup';
import type * as VMT from '@/domain';

export const generalTabSchema = yup.object({
  slug: yup.string().required('Slug is required'),
  destinationId: yup.string().required('Destination is required'),
  title: yup.string().required('Title is required'),
  titleVi: yup.string().defined(),
  titleEn: yup.string().defined(),
  imageUrl: yup.string().defined(),
  price: yup
    .number()
    .min(0, 'Price must be positive')
    .required('Price is required'),
  duration: yup.number().min(0).required('Duration is required'),
  distance: yup.number().min(0).required('Distance is required'),
  descriptionVi: yup.string().defined(),
  descriptionEn: yup.string().defined(),
  transportation: yup.string().defined(),
  groupSize: yup.number().min(0).required('Group size is required'),
  hotel: yup.string().defined(),
  guided: yup.string().defined(),
  images: yup.array().of(yup.string().required()).defined(),
  included: yup.mixed<VMT.LocalizedText[]>().defined(),
  excluded: yup.mixed<VMT.LocalizedText[]>().defined(),
  paymentDetails: yup.mixed<VMT.LocalizedText>().defined(),
  notes: yup.mixed<VMT.LocalizedText[]>().defined(),
  mealsInfo: yup.mixed<VMT.LocalizedText>().defined(),
  status: yup.mixed<VMT.TourStatus>().required('Status is required'),
});

export type GeneralTabFormData = yup.InferType<typeof generalTabSchema>;
