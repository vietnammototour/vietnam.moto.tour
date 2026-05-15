import * as yup from 'yup';

export const KEY_REGEX = /^[a-z][a-z0-9_]*$/;

export type RoleFormValues = {
  key: string;
  labelVi: string;
  labelEn: string;
  order: number;
};

export const roleFormDefaults: RoleFormValues = {
  key: '',
  labelVi: '',
  labelEn: '',
  order: 0,
};

export function buildRoleSchema(t: (k: string) => string) {
  return yup.object({
    key: yup
      .string()
      .required(t('validation.keyFormat'))
      .matches(KEY_REGEX, t('validation.keyFormat')),
    labelVi: yup.string().required(t('validation.labelViRequired')),
    labelEn: yup.string().required(t('validation.labelEnRequired')),
    order: yup.number().integer().min(0).default(0),
  });
}
