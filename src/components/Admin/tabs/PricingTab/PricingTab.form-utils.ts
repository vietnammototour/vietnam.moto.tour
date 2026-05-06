import * as yup from 'yup';
import {localizedString} from '@/utils/form-helpers';

const pricingTierSchema = yup.object({
  label: localizedString('Label'),
  description: yup
    .object({en: yup.string().defined(), vi: yup.string().defined()})
    .optional(),
  price: yup
    .number()
    .min(0, 'Price must be positive')
    .required('Price is required'),
  minGroupSize: yup.number().optional(),
  maxGroupSize: yup.number().optional(),
});

const pricingGroupSchema = yup.object({
  type: yup
    .string()
    .oneOf(['group-size', 'vehicle'] as const)
    .required('Type is required'),
  label: localizedString('Group label'),
  icon: yup.string().optional(),
  tiers: yup.array().of(pricingTierSchema).defined(),
});

export const pricingSchema = yup.object({
  groups: yup.array().of(pricingGroupSchema).defined(),
});

export type PricingFormData = yup.InferType<typeof pricingSchema>;
