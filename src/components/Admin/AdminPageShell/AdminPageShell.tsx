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
    <div className="-m-8 flex flex-col min-h-[calc(100vh-0px)]">
      <div className="sticky top-0 z-20 bg-surface border-b border-border">
        {header}
      </div>
      <section className="flex-1 px-6 lg:px-8 py-6">{children}</section>
      {footer ? (
        <div className="sticky bottom-0 z-20 pt-4 pb-2 bg-gradient-to-t from-surface via-surface/95 to-transparent">
          {footer}
        </div>
      ) : null}
    </div>
  );
}
