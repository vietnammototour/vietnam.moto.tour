import type {ReactNode} from 'react';

type BadgeProps = {
  variant?: 'info' | 'success' | 'warning' | 'danger' | 'neutral';
  size?: 'sm' | 'md';
  children: ReactNode;
};

const variantClasses: Record<NonNullable<BadgeProps['variant']>, string> = {
  info: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  success: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  warning:
    'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  danger: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  neutral: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
};

const sizeClasses: Record<NonNullable<BadgeProps['size']>, string> = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-3 py-1 text-sm',
};

export function Badge({
  variant = 'neutral',
  size = 'md',
  children,
}: BadgeProps) {
  return (
    <span
      data-variant={variant}
      data-size={size}
      className={`inline-flex items-center font-medium ${variantClasses[variant]} ${sizeClasses[size]}`}
    >
      {children}
    </span>
  );
}
