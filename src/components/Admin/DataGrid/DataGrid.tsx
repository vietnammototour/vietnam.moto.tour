import {Fragment} from 'react';
import type {DataGridProps, GridColumn, GridSection} from './DataGrid.types';

function cellValue<T>(col: GridColumn<T>, row: T): React.ReactNode {
  if (col.render) return col.render(row);
  const raw = (row as Record<string, unknown>)[col.key];
  return raw == null ? '' : String(raw);
}

export function DataGrid<T>({
  columns,
  sections,
  items,
  rowKey,
  onRowClick,
  emptyState,
  ariaLabel,
}: DataGridProps<T>) {
  const template = columns.map((c) => c.track).join(' ');
  const resolvedSections: GridSection<T>[] =
    sections ?? (items ? [{id: '__flat__', label: '', items}] : []);
  const total = resolvedSections.reduce((n, s) => n + s.items.length, 0);
  const showBands = !!sections;

  return (
    <div
      role="table"
      aria-label={ariaLabel}
      className="border border-border bg-surface-elevated overflow-hidden"
    >
      {/* Header row — always visible, even when empty */}
      <div
        role="row"
        className="grid gap-3 px-4 py-2 bg-surface border-b border-border sticky top-0 z-[1]"
        style={{gridTemplateColumns: template}}
      >
        {columns.map((col) => (
          <div
            key={col.key}
            role="columnheader"
            className={`type-label-sm uppercase tracking-wide text-on-surface-tertiary ${
              col.align === 'end' ? 'text-right' : 'text-left'
            }`}
          >
            {col.header}
          </div>
        ))}
      </div>

      {/* Body: empty state or sectioned rows */}
      {total === 0 ? (
        <div
          className="p-8 text-center type-body-md text-on-surface-secondary"
          role="status"
        >
          {emptyState ?? 'Nothing here yet.'}
        </div>
      ) : (
        resolvedSections.map((section) => (
          <Fragment key={section.id}>
            {showBands && (
              <div className="flex items-center justify-between px-4 py-2.5 bg-surface-alt border-b border-border">
                <span className="type-label-sm uppercase tracking-wide text-on-surface-secondary">
                  {section.label}
                </span>
                {section.count != null && (
                  <span className="type-body-sm text-on-surface-tertiary tabular-nums">
                    ({section.count})
                  </span>
                )}
              </div>
            )}
            {section.items.map((row) => (
              <div
                key={rowKey(row)}
                role="row"
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={`grid gap-3 px-4 py-3 border-b border-border last:border-0 ${
                  onRowClick ? 'cursor-pointer hover:bg-surface-alt/50' : ''
                }`}
                style={{gridTemplateColumns: template}}
              >
                {columns.map((col) => (
                  <div
                    key={col.key}
                    role="cell"
                    className={`min-w-0 type-body-sm text-on-surface-secondary self-center ${
                      col.align === 'end' ? 'text-right' : 'text-left'
                    }`}
                  >
                    {cellValue(col, row)}
                  </div>
                ))}
              </div>
            ))}
          </Fragment>
        ))
      )}
    </div>
  );
}
