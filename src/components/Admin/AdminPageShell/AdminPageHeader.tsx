import {type ReactNode} from 'react';
import {
  AdminBreadcrumbs,
  type BreadcrumbItem,
} from '@/components/Admin/AdminBreadcrumbs';

type AdminPageHeaderProps = {
  title: string;
  breadcrumbs: BreadcrumbItem[];
  status?: ReactNode;
  actions?: ReactNode;
  localeSwitcher?: ReactNode;
};

export function AdminPageHeader({
  title,
  breadcrumbs,
  status,
  actions,
  localeSwitcher,
}: AdminPageHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-4 px-6 lg:px-8 py-4">
      <div className="min-w-0">
        <AdminBreadcrumbs items={breadcrumbs} />
        <h1 className="type-headline-sm truncate">{title}</h1>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        {status}
        {localeSwitcher}
        {actions}
      </div>
    </div>
  );
}
