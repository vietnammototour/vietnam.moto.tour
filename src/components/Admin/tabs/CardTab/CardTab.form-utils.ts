import * as yup from 'yup';
import {imageSlotSchema} from '@/lib/image-slot';

export const cardTabSchema = yup.object({
  imageCard: imageSlotSchema().required(),
});

export type CardTabFormData = yup.InferType<typeof cardTabSchema>;
