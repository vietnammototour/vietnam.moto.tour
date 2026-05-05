'use client';

import {useState, useEffect, useCallback} from 'react';
import {useForm} from 'react-hook-form';
import {yupResolver} from '@hookform/resolvers/yup';
import {
  loginSchema,
  loginDefaults,
  submitLogin,
  type LoginFormData,
} from './LoginModal.form-utils';
import {FormFieldError} from './FormFieldError';

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
      <div>
        <label
          htmlFor="login-email"
          className="block type-label-sm text-on-surface-secondary mb-1"
        >
          Email
        </label>
        <input
          id="login-email"
          type="text"
          {...register('email')}
          className="w-full px-4 py-2.5 rounded-lg border border-border bg-surface text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
          autoComplete="username"
        />
        <FormFieldError message={errors.email?.message} />
      </div>

      <div>
        <label
          htmlFor="login-password"
          className="block type-label-sm text-on-surface-secondary mb-1"
        >
          Password
        </label>
        <input
          id="login-password"
          type="password"
          {...register('password')}
          className="w-full px-4 py-2.5 rounded-lg border border-border bg-surface text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
          autoComplete="current-password"
        />
        <FormFieldError message={errors.password?.message} />
      </div>

      {submitError && (
        <p className="type-body-sm text-red-500" role="alert">
          {submitError}
        </p>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-primary hover:bg-primary-light text-on-primary type-label-sm uppercase py-3 rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
      >
        {isSubmitting ? '...' : 'Sign In'}
      </button>
    </form>
  );
}

export function LoginModal({isOpen, onClose}: LoginModalProps) {
  const handleEscape = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    },
    [onClose],
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, handleEscape]);

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-[80] bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
        <div
          className="bg-surface-elevated rounded-xl shadow-2xl w-full max-w-md p-8"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="type-title-lg text-on-surface">Admin Login</h2>
            <button
              onClick={onClose}
              className="text-on-surface-secondary hover:text-on-surface transition-colors cursor-pointer"
              aria-label="Close"
            >
              <i className="fa fa-times text-xl" />
            </button>
          </div>

          <LoginForm onClose={onClose} />
        </div>
      </div>
    </>
  );
}
