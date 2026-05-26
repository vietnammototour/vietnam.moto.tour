import Link from 'next/link';
import type {VehicleTab} from '@/routes';

type Props = {
  active: VehicleTab;
  baseHref: (tab: VehicleTab) => string;
};

const TABS: ReadonlyArray<{key: VehicleTab; label: string}> = [
  {key: 'general', label: 'General'},
  {key: 'description', label: 'Description'},
  {key: 'images', label: 'Images'},
];

export function VehicleEditTabs({active, baseHref}: Props) {
  return (
    <nav
      role="tablist"
      className="flex gap-1 border-b border-border bg-surface px-4"
    >
      {TABS.map((tab) => {
        const isActive = tab.key === active;
        return (
          <Link
            key={tab.key}
            href={baseHref(tab.key)}
            role="tab"
            aria-selected={isActive}
            className={
              isActive
                ? 'cursor-pointer px-4 py-3 type-label-sm uppercase tracking-wide border-b-2 border-primary text-on-surface'
                : 'cursor-pointer px-4 py-3 type-label-sm uppercase tracking-wide text-on-surface-tertiary'
            }
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
