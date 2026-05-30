import {useState} from 'react';

type AvatarProps = {
  src?: string | null;
  name: string;
  size?: 'sm' | 'md' | 'lg';
  alt?: string;
};

const sizeClasses: Record<NonNullable<AvatarProps['size']>, string> = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-14 w-14 text-base',
};

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

export function Avatar({src, name, size = 'md', alt}: AvatarProps) {
  const [failed, setFailed] = useState(false);
  const base = `inline-flex items-center justify-center overflow-hidden rounded-full bg-surface-alt text-on-surface font-semibold shrink-0 ${sizeClasses[size]}`;

  if (src && !failed) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={alt ?? name}
        className={`${base} object-cover`}
        onError={() => setFailed(true)}
      />
    );
  }

  return (
    <span className={base} aria-label={alt ?? name}>
      {initials(name)}
    </span>
  );
}
