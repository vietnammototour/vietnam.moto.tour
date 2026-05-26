import {forwardRef, type ButtonHTMLAttributes, type ReactNode} from 'react';

type ButtonProps = {
  variant?: 'primary' | 'danger' | 'secondary' | 'link';
  size?: 'sm' | 'md' | 'lg';
  icon?: ReactNode;
  iconOnly?: boolean;
  loading?: boolean;
} & ButtonHTMLAttributes<HTMLButtonElement>;

const variantClasses: Record<NonNullable<ButtonProps['variant']>, string> = {
  primary: 'bg-primary hover:bg-primary-light text-on-primary',
  danger: 'bg-danger hover:bg-danger-hover text-on-danger',
  secondary: 'border border-border text-on-surface hover:bg-surface-alt',
  link: 'text-primary hover:underline',
};

const sizeClasses: Record<NonNullable<ButtonProps['size']>, string> = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-5 py-2',
  lg: 'px-6 py-2.5',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    {
      variant = 'primary',
      size = 'md',
      icon,
      iconOnly = false,
      loading = false,
      disabled,
      className = '',
      children,
      type = 'button',
      ...rest
    },
    ref,
  ) {
    const isLink = variant === 'link';

    const base = isLink
      ? 'inline-flex items-center justify-center type-label-sm font-semibold transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed'
      : 'inline-flex items-center justify-center rounded-lg type-label-sm uppercase tracking-wide font-semibold transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed';

    const classes = [
      base,
      variantClasses[variant],
      iconOnly ? 'p-2' : sizeClasses[size],
      className,
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        className={classes}
        {...rest}
      >
        {loading ? (
          <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
        ) : (
          <>
            {icon && !iconOnly && <span className="mr-2">{icon}</span>}
            {children}
          </>
        )}
      </button>
    );
  },
);
