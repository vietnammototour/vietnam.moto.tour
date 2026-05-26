import * as yup from 'yup';
import type {InferType} from 'yup';
import {imageSlotSchema, savedSlot, type ImageSlot} from '@/lib/image-slot';

export const vehicleImagesSchema = yup.object({
  imageUrl: imageSlotSchema().required(),
});

export type VehicleImagesFormValues = InferType<typeof vehicleImagesSchema>;

export function vehicleImagesDefaults(
  initial: {imageUrl: string | null; images: string[]} | null,
): VehicleImagesFormValues {
  return {
    imageUrl: savedSlot(initial?.imageUrl ?? null) as ImageSlot,
  };
}
