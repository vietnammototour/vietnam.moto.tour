import Link from 'next/link';
import {useState, useEffect, useRef} from 'react';
import {Button} from '@/components/ui';

export type BreadcrumbItem = {
  label: string;
  href?: string;
  editable?: {
    fieldLabel: string;
    onCommit: (value: string) => void;
  };
};

type Props = {
  items: BreadcrumbItem[];
};

export function AdminBreadcrumbs({items}: Props) {
  return (
    <nav
      aria-label="Breadcrumb"
      className="flex items-center gap-2 type-body-sm text-on-surface-secondary mb-2"
    >
      {items.map((item, i) => {
        const isLast = i === items.length - 1;
        const renderSegment = () => {
          if (item.href && !isLast) {
            return (
              <Link
                href={item.href}
                className="hover:text-primary transition-colors cursor-pointer"
              >
                {item.label}
              </Link>
            );
          }
          if (isLast && item.editable) {
            return (
              <EditableSegment
                label={item.label}
                fieldLabel={item.editable.fieldLabel}
                onCommit={item.editable.onCommit}
              />
            );
          }
          return (
            <span
              className={
                isLast
                  ? 'text-on-surface type-label-lg font-medium'
                  : 'text-on-surface-secondary'
              }
              aria-current={isLast ? 'page' : undefined}
            >
              {item.label}
            </span>
          );
        };
        return (
          <span key={i} className="flex items-center gap-2">
            {i > 0 && (
              <span className="text-on-surface-secondary/60" aria-hidden>
                /
              </span>
            )}
            {renderSegment()}
          </span>
        );
      })}
    </nav>
  );
}

function EditableSegment({
  label,
  fieldLabel,
  onCommit,
}: {
  label: string;
  fieldLabel: string;
  onCommit: (v: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(label);
  const inputRef = useRef<HTMLInputElement>(null);
  const cancelledRef = useRef(false);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  if (!editing) {
    return (
      <span className="inline-flex items-center gap-1">
        <span
          className="text-on-surface type-label-lg font-medium"
          aria-current="page"
        >
          {label}
        </span>
        <Button
          variant="secondary"
          iconOnly
          type="button"
          aria-label={`Edit ${fieldLabel}`}
          onClick={() => {
            cancelledRef.current = false;
            setDraft(label);
            setEditing(true);
          }}
        >
          <i className="fa fa-pencil" aria-hidden />
        </Button>
      </span>
    );
  }

  return (
    <input
      ref={inputRef}
      aria-label={fieldLabel}
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          onCommit(draft);
          setEditing(false);
        } else if (e.key === 'Escape') {
          e.preventDefault();
          cancelledRef.current = true;
          setDraft(label);
          setEditing(false);
        }
      }}
      onBlur={() => {
        if (cancelledRef.current) {
          cancelledRef.current = false;
          setEditing(false);
          return;
        }
        if (draft !== label) onCommit(draft);
        setEditing(false);
      }}
      className="text-on-surface type-label-lg font-medium bg-surface-elevated border border-dashed border-primary/40 focus:border-primary rounded px-1 outline-none cursor-text"
    />
  );
}
