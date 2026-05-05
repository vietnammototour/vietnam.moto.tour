import type {TourStatus} from '@/types';

const statusConfig: Record<TourStatus, {label: string; classes: string}> = {
  DRAFT: {
    label: 'Draft',
    classes: 'bg-amber-500/90 text-white',
  },
  PUBLISHED: {
    label: 'Published',
    classes: 'bg-green-500/90 text-white',
  },
  FEATURED: {
    label: 'Featured',
    classes: 'bg-blue-500/90 text-white',
  },
  ARCHIVED: {
    label: 'Archived',
    classes: 'bg-gray-500/90 text-white',
  },
};

type AdminStatusBadgeProps = {
  status: TourStatus;
};

export function AdminStatusBadge({status}: AdminStatusBadgeProps) {
  if (status === 'PUBLISHED') return null;

  const config = statusConfig[status];

  return (
    <span
      className={`fixed top-20 right-4 z-50 px-3 py-1.5 rounded-full type-label-sm uppercase tracking-wider shadow-lg ${config.classes}`}
    >
      {config.label} — Not Public
    </span>
  );
}
