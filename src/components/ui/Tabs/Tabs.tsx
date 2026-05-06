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
    <div>
      <div role="tablist" className="flex border-b-2 border-border">
        {items.map((item) => {
          const isActive = item.key === activeKey;
          return (
            <button
              key={item.key}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-disabled={item.disabled || undefined}
              disabled={item.disabled}
              onClick={() => !item.disabled && onChange(item.key)}
              className={`px-6 py-3 type-label-sm transition-colors cursor-pointer ${
                isActive
                  ? 'text-primary border-b-2 border-primary -mb-[2px] font-semibold'
                  : item.disabled
                    ? 'text-on-surface-secondary/40 cursor-not-allowed'
                    : 'text-on-surface-secondary hover:text-on-surface'
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </div>
      {activePanel}
    </div>
  );
}
