import {type ReactNode} from 'react';

/**
 * Backward-compat wrapper for legacy admin pages that don't yet use
 * `AdminPageShell`. Provides the scroll + padding that the AdminLayout `<main>`
 * previously supplied. New admin pages should use `AdminPageShell` instead.
 */
type AdminPageLegacyProps = {
  children: ReactNode;
};

export function AdminPageLegacy({children}: AdminPageLegacyProps) {
  return <div className="flex-1 overflow-y-auto p-8 min-h-0">{children}</div>;
}
