import * as yup from 'yup';

export type UserFormValues = {
  name: string;
  email: string;
  password: string;
  orgRoleId: string;
  bioVi: string;
  bioEn: string;
  birthDate: string;
  imageId: string | null;
  isCoreTeam: boolean;
  allowAuth: boolean;
  teamOrder: number;
};

export const userFormDefaults: UserFormValues = {
  name: '',
  email: '',
  password: '',
  orgRoleId: '',
  bioVi: '',
  bioEn: '',
  birthDate: '',
  imageId: null,
  isCoreTeam: false,
  allowAuth: true,
  teamOrder: 0,
};

export function buildUserSchema(
  t: (k: string) => string,
  mode: 'create' | 'edit',
) {
  return yup.object({
    name: yup.string().required(t('validation.nameRequired')),
    email: yup.string().when('allowAuth', {
      is: true,
      then: (s) =>
        s
          .required(t('validation.emailRequired'))
          .email(t('validation.emailFormat')),
      otherwise: (s) => s.defined(),
    }),
    password: yup.string().when('allowAuth', {
      is: true,
      then: (s) =>
        mode === 'create'
          ? s
              .required(t('validation.passwordRequired'))
              .min(8, t('validation.passwordShort'))
          : s
              .defined()
              .test(
                'opt-min',
                t('validation.passwordShort'),
                (v) => !v || v.length >= 8,
              ),
      otherwise: (s) => s.defined(),
    }),
    orgRoleId: yup.string().required(t('validation.roleRequired')),
    bioVi: yup.string().defined(),
    bioEn: yup.string().defined(),
    birthDate: yup.string().defined(),
    imageId: yup.string().nullable().defined(),
    isCoreTeam: yup.boolean().default(false),
    allowAuth: yup.boolean().default(true),
    teamOrder: yup.number().integer().min(0).default(0),
  });
}
