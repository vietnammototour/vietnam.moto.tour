'use client';

import {useState, useEffect, useCallback} from 'react';
import {signIn} from 'next-auth/react';

type LoginModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

function LoginForm({onClose}: {onClose: () => void}) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await signIn('credentials', {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError('Invalid email or password');
      return;
    }

    onClose();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
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
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-4 py-2.5 rounded-lg border border-border bg-surface text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
          autoComplete="username"
        />
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
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-4 py-2.5 rounded-lg border border-border bg-surface text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
          autoComplete="current-password"
        />
      </div>

      {error && (
        <p className="type-body-sm text-red-500" role="alert">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-primary hover:bg-primary-light text-on-primary type-label-sm uppercase py-3 rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
      >
        {loading ? '...' : 'Sign In'}
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
