import * as yup from 'yup';
import type {InferType} from 'yup';

export const vehicleDescriptionSchema = yup.object({
  en: yup.string().defined().default(''),
  vi: yup.string().defined().default(''),
});

export type VehicleDescriptionFormValues = InferType<
  typeof vehicleDescriptionSchema
>;

export function vehicleDescriptionDefaults(
  initial: {en: string; vi: string} | null,
): VehicleDescriptionFormValues {
  return {en: initial?.en ?? '', vi: initial?.vi ?? ''};
}
