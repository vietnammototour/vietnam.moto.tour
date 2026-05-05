import * as yup from 'yup';
import {signIn} from 'next-auth/react';

export const loginSchema = yup.object({
  email: yup.string().required('Email is required'),
  password: yup.string().required('Password is required'),
});

export type LoginFormData = yup.InferType<typeof loginSchema>;

export const loginDefaults: LoginFormData = {
  email: '',
  password: '',
};

export async function submitLogin(
  data: LoginFormData,
): Promise<{error?: string}> {
  const result = await signIn('credentials', {
    redirect: false,
    email: data.email,
    password: data.password,
  });

  if (result?.error) return {error: 'Invalid email or password'};
  return {};
}
