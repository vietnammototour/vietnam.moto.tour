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
    email: yup
      .string()
      .default('')
      .test(
        'email-required-when-auth',
        t('validation.emailRequired'),
        function (v) {
          if (!this.parent.allowAuth) return true;
          return !!v && v.length > 0;
        },
      )
      .test(
        'email-format-when-auth',
        t('validation.emailFormat'),
        function (v) {
          if (!this.parent.allowAuth) return true;
          if (!v) return true;
          return yup.string().email().isValidSync(v);
        },
      ),
    password: yup
      .string()
      .default('')
      .test(
        'password-required',
        t('validation.passwordRequired'),
        function (v) {
          if (!this.parent.allowAuth) return true;
          if (mode !== 'create') return true;
          return !!v && v.length > 0;
        },
      )
      .test('password-min', t('validation.passwordShort'), function (v) {
        if (!this.parent.allowAuth) return true;
        if (!v) return mode !== 'create';
        return v.length >= 8;
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
