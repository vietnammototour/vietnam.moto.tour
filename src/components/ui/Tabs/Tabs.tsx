'use client';

import {
  type ReactNode,
  type ReactElement,
  Children,
  isValidElement,
} from 'react';
import {type TabPanelProps} from './TabPanel';

type TabItem = {
  key: string;
  label: string;
  disabled?: boolean;
};

type TabsProps = {
  items: TabItem[];
  activeKey: string;
  onChange: (key: string) => void;
  children: ReactNode;
};

export function Tabs({items, activeKey, onChange, children}: TabsProps) {
  const activePanel = Children.toArray(children).find(
    (child) =>
      isValidElement(child) &&
      (child as ReactElement<TabPanelProps>).props.tabKey === activeKey,
  );

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div role="tablist" className="flex border-b-2 border-border shrink-0">
        {items.map((item) => {
          const isActive = item.key === activeKey;
          const stateClass = (() => {
            if (isActive)
              return 'text-primary border-b-2 border-primary -mb-[2px] font-semibold';
            if (item.disabled)
              return 'text-on-surface-secondary/40 cursor-not-allowed';
            return 'text-on-surface-secondary hover:text-on-surface';
          })();
          return (
            <button
              key={item.key}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-disabled={item.disabled || undefined}
              disabled={item.disabled}
              onClick={() => !item.disabled && onChange(item.key)}
              className={`px-6 py-3 type-label-sm transition-colors cursor-pointer ${stateClass}`}
            >
              {item.label}
            </button>
          );
        })}
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto">{activePanel}</div>
    </div>
  );
}
