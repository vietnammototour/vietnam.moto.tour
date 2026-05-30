import Image from 'next/image';

type ReviewerAvatarProps = {
  name: string;
  avatarUrl: string | null;
  size?: 'sm' | 'md';
};

const boxClass = {sm: 'h-8 w-8', md: 'h-12 w-12'} as const;
const boxPx = {sm: 32, md: 48} as const;
const textClass = {sm: 'text-[10px]', md: 'text-sm'} as const;

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

export function ReviewerAvatar({
  name,
  avatarUrl,
  size = 'md',
}: ReviewerAvatarProps) {
  if (avatarUrl) {
    return (
      <span
        className={`relative ${boxClass[size]} shrink-0 overflow-hidden border border-border bg-surface-elevated`}
      >
        <Image
          src={avatarUrl}
          alt={name}
          fill
          sizes={`${boxPx[size]}px`}
          className="object-cover"
        />
      </span>
    );
  }
  return (
    <span
      className={`flex ${boxClass[size]} shrink-0 items-center justify-center border border-border bg-surface-elevated font-mono ${textClass[size]} tracking-[0.05em] text-on-surface-secondary`}
    >
      {initials(name)}
    </span>
  );
}
