'use client';

import {useState} from 'react';
import {useForm} from 'react-hook-form';
import {yupResolver} from '@hookform/resolvers/yup';
import {
  loginSchema,
  loginDefaults,
  submitLogin,
  type LoginFormData,
} from './LoginModal.form-utils';
import {TextInput, Button, Modal} from '@/components/ui';

type LoginModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

function LoginForm({onClose}: {onClose: () => void}) {
  const [submitError, setSubmitError] = useState('');

  const {
    register,
    handleSubmit,
    formState: {errors, isSubmitting},
  } = useForm<LoginFormData>({
    resolver: yupResolver(loginSchema),
    defaultValues: loginDefaults,
    shouldFocusError: true,
  });

  async function onSubmit(data: LoginFormData) {
    setSubmitError('');
    const {error} = await submitLogin(data);
    if (error) {
      setSubmitError(error);
      return;
    }
    onClose();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <TextInput
        label="Email"
        type="text"
        {...register('email')}
        error={errors.email?.message}
        autoComplete="username"
      />

      <TextInput
        label="Password"
        type="password"
        {...register('password')}
        error={errors.password?.message}
        autoComplete="current-password"
      />

      {submitError && (
        <p className="type-body-sm text-red-500" role="alert">
          {submitError}
        </p>
      )}

      <Button
        type="submit"
        disabled={isSubmitting}
        loading={isSubmitting}
        className="w-full py-3"
      >
        Sign In
      </Button>
    </form>
  );
}

export function LoginModal({isOpen, onClose}: LoginModalProps) {
  return (
    <Modal open={isOpen} onClose={onClose} title="Admin Login" size="sm">
      <LoginForm onClose={onClose} />
    </Modal>
  );
}
