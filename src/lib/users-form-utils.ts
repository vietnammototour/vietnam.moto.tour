import * as yup from 'yup';
import {api} from '@/routes';

export const createUserSchema = yup.object({
  name: yup.string().required('Name is required'),
  email: yup.string().email('Invalid email').required('Email is required'),
  password: yup
    .string()
    .min(8, 'Password must be at least 8 characters')
    .required('Password is required'),
});

export type CreateUserFormData = yup.InferType<typeof createUserSchema>;

export const createUserDefaults: CreateUserFormData = {
  name: '',
  email: '',
  password: '',
};

export async function submitCreateUser(
  data: CreateUserFormData,
): Promise<{error?: string}> {
  const {error} = await api.admin.users.create(data);
  if (error) return {error};
  return {};
}
