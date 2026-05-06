import {type ReactNode} from 'react';

export type TabPanelProps = {
  tabKey: string;
  children: ReactNode;
};

export function TabPanel({children}: TabPanelProps) {
  return <div role="tabpanel">{children}</div>;
}
