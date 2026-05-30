import type * as VMT from '@/domain';
import {Badge} from '@/components/ui';

const variantMap: Record<
  VMT.TourStatus,
  'warning' | 'success' | 'info' | 'neutral'
> = {
  DRAFT: 'warning',
  PUBLISHED: 'success',
  ARCHIVED: 'neutral',
};

type AdminStatusBadgeProps = {
  status: VMT.TourStatus;
};

export function AdminStatusBadge({status}: AdminStatusBadgeProps) {
  if (status === 'PUBLISHED') return null;

  return (
    <span className="fixed top-20 right-4 z-50">
      <Badge variant={variantMap[status]}>
        {status.charAt(0) + status.slice(1).toLowerCase()} — Not Public
      </Badge>
    </span>
  );
}
