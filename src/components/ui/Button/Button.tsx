import Link from 'next/link';
import {forwardRef, type ButtonHTMLAttributes, type ReactNode} from 'react';

type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'danger'
  | 'ghost'
  | 'ghost-primary'
  | 'ghost-danger'
  | 'link';

type ButtonSize = 'sm' | 'md' | 'lg';

type CommonProps = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: ReactNode;
  iconOnly?: boolean;
  loading?: boolean;
  className?: string;
  children?: ReactNode;
};

type ButtonAsButton = CommonProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, keyof CommonProps> & {
    href?: undefined;
  };

type ButtonAsLink = CommonProps & {
  href: string;
  disabled?: boolean;
  'aria-label'?: string;
  target?: string;
  rel?: string;
};

type ButtonProps = ButtonAsButton | ButtonAsLink;

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-primary hover:bg-primary-light text-on-primary',
  secondary:
    'border border-border text-on-surface-secondary hover:bg-surface-alt',
  danger: 'bg-danger hover:bg-danger-hover text-on-danger',
  ghost: 'text-on-surface-secondary hover:bg-surface-alt',
  'ghost-primary': 'text-primary hover:bg-primary/10',
  'ghost-danger': 'text-error hover:bg-red-500/10',
  link: 'text-primary hover:underline',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-5 py-2',
  lg: 'px-6 py-2.5',
};

const baseClassButton =
  'inline-flex items-center justify-center type-label-sm uppercase tracking-wider font-bold transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed';

const baseClassLink =
  'inline-flex items-center justify-center type-label-sm font-semibold transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed';

export const Button = forwardRef<
  HTMLButtonElement | HTMLAnchorElement,
  ButtonProps
>(function Button(props, ref) {
  const variant = props.variant ?? 'primary';
  const size = props.size ?? 'md';
  const iconOnly = props.iconOnly ?? false;
  const loading = props.loading ?? false;
  const icon = props.icon;
  const className = props.className ?? '';
  const children = props.children;

  const isLink = variant === 'link';

  const classes = [
    isLink ? baseClassLink : baseClassButton,
    variantClasses[variant],
    iconOnly ? 'p-2' : sizeClasses[size],
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const content = loading ? (
    <span className="w-4 h-4 border-2 border-current border-t-transparent aspect-square animate-spin" />
  ) : (
    <>
      {icon && !iconOnly ? <span className="mr-2">{icon}</span> : null}
      {children}
    </>
  );

  if (props.href !== undefined) {
    if (props.disabled) {
      return (
        <span
          ref={ref as React.Ref<HTMLAnchorElement>}
          aria-disabled="true"
          className={classes}
        >
          {content}
        </span>
      );
    }
    return (
      <Link
        ref={ref as React.Ref<HTMLAnchorElement>}
        href={props.href}
        target={props.target}
        rel={props.rel}
        aria-label={props['aria-label']}
        className={classes}
      >
        {content}
      </Link>
    );
  }

  const {
    variant: _variant,
    size: _size,
    icon: _icon,
    iconOnly: _iconOnly,
    loading: _loading,
    className: _className,
    children: _children,
    disabled,
    type = 'button',
    ...rest
  } = props;
  void _variant;
  void _size;
  void _icon;
  void _iconOnly;
  void _loading;
  void _className;
  void _children;

  return (
    <button
      ref={ref as React.Ref<HTMLButtonElement>}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={classes}
      {...rest}
    >
      {content}
    </button>
  );
});
