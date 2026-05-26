import {type ReactNode} from 'react';

type AdminPageShellProps = {
  header: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
};

export function AdminPageShell({
  header,
  footer,
  children,
}: AdminPageShellProps) {
  return (
    <div className="-m-8 flex flex-col h-full min-h-0">
      <div className="shrink-0 bg-surface border-b border-border">{header}</div>
      <section className="flex-1 overflow-y-auto px-6 lg:px-8 py-6 min-h-0">
        {children}
      </section>
      {footer ? (
        <div className="shrink-0 pt-4 pb-2 bg-gradient-to-t from-surface via-surface/95 to-transparent">
          {footer}
        </div>
      ) : null}
    </div>
  );
}
