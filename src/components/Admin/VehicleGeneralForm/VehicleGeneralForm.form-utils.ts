import * as yup from 'yup';
import type {InferType} from 'yup';
import type {Vehicle, VehicleType, VehicleStatus} from '@/domain';

export const vehicleGeneralSchema = yup.object({
  slug: yup.string().defined().default(''),
  type: yup.mixed<VehicleType>().oneOf(['SCOOTER', 'BIKE']).required(),
  brand: yup.string().required('Brand is required'),
  model: yup.string().required('Model is required'),
  cc: yup
    .number()
    .typeError('Engine (cc) must be a number')
    .positive('Engine (cc) must be > 0')
    .integer()
    .required(),
  quantity: yup
    .number()
    .typeError('Quantity must be a number')
    .min(0, 'Quantity must be >= 0')
    .integer()
    .required(),
  priceUsdPerDay: yup
    .number()
    .typeError('Price must be a number')
    .min(0, 'Price must be >= 0')
    .integer()
    .required(),
  status: yup
    .mixed<VehicleStatus>()
    .oneOf(['DRAFT', 'PUBLISHED', 'ARCHIVED'])
    .required(),
  order: yup.number().integer().required(),
});

export type VehicleGeneralFormValues = InferType<typeof vehicleGeneralSchema>;

export function vehicleGeneralDefaults(
  v: Vehicle | null,
): VehicleGeneralFormValues {
  return {
    slug: v?.slug ?? '',
    type: v?.type ?? 'SCOOTER',
    brand: v?.brand ?? '',
    model: v?.model ?? '',
    cc: v?.cc ?? 0,
    quantity: v?.quantity ?? 0,
    priceUsdPerDay: v?.priceUsdPerDay ?? 0,
    status: v?.status ?? 'DRAFT',
    order: v?.order ?? 0,
  };
}

export function deriveSlug(brand: string, model: string): string {
  return `${brand}-${model}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
