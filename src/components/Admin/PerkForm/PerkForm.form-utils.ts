import * as yup from 'yup';
import type * as VMT from '@/domain';

const CATEGORIES: VMT.PerkCategory[] = [
  'TRANSPORT',
  'FOOD',
  'ACCOMMODATION',
  'GUIDE',
  'SUPPORT',
  'OTHER',
];

export const perkFormSchema = yup.object({
  labelEn: yup.string().trim().required('Label (EN) is required'),
  labelVi: yup.string().defined().default(''),
  icon: yup.string().defined().default(''),
  category: yup
    .mixed<VMT.PerkCategory>()
    .oneOf(CATEGORIES)
    .required('Category is required'),
  archived: yup.boolean().defined().default(false),
});

export type PerkFormValues = yup.InferType<typeof perkFormSchema>;

export const perkFormDefaults: PerkFormValues = {
  labelEn: '',
  labelVi: '',
  icon: '',
  category: 'OTHER',
  archived: false,
};

export const PERK_CATEGORIES = CATEGORIES;
