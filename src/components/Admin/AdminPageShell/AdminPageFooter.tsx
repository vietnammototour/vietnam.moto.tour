import {type ReactNode} from 'react';

type AdminPageFooterProps = {
  status?: ReactNode;
  actions?: ReactNode;
};

export function AdminPageFooter({status, actions}: AdminPageFooterProps) {
  if (!status && !actions) return null;
  return (
    <div className="mx-6 mb-6 lg:mx-8 lg:mb-8 border border-border bg-surface-elevated px-6 py-3 flex items-center justify-between gap-4">
      <div className="min-w-0 type-label-sm text-on-surface-secondary">
        {status}
      </div>
      <div className="flex items-center gap-2 shrink-0">{actions}</div>
    </div>
  );
}
