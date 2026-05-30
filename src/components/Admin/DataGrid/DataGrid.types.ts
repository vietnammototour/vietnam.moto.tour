import type {ReactNode} from 'react';

export type GridColumn<T> = {
  /** unique column id; also the default value accessor key */
  key: string;
  header: ReactNode;
  /** a CSS grid track, e.g. 'minmax(0,1fr)' or '80px' */
  track: string;
  align?: 'start' | 'end';
  render?: (row: T) => ReactNode;
};

export type GridSection<T> = {
  id: string;
  label: ReactNode;
  count?: number;
  items: T[];
};

export type DataGridProps<T> = {
  columns: GridColumn<T>[];
  /** sectioned mode — mutually exclusive with `items` */
  sections?: GridSection<T>[];
  /** flat mode — mutually exclusive with `sections` */
  items?: T[];
  rowKey: (row: T) => string;
  onRowClick?: (row: T) => void;
  emptyState?: ReactNode;
  ariaLabel?: string;
};
