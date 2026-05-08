'use client';

import {useMemo, useState} from 'react';
import {Modal, Button} from '@/components/ui';
import {FA_ICONS} from '@/data/fa-icons';

type IconPickerProps = {
  value: string;
  onChange: (className: string) => void;
  compact?: boolean;
};

export function IconPicker({
  value,
  onChange,
  compact = false,
}: IconPickerProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    if (!query) return FA_ICONS;
    const q = query.toLowerCase();
    return FA_ICONS.filter((c) => c.includes(q));
  }, [query]);

  return (
    <>
      {compact ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Pick icon"
          className="cursor-pointer flex items-center justify-center w-10 h-10 rounded-lg border border-border bg-surface hover:bg-surface-alt"
        >
          {value ? (
            <i
              data-testid="icon-picker-current"
              className={`${value} text-xl`}
            />
          ) : (
            <span
              data-testid="icon-picker-current"
              className="text-on-surface-secondary"
            >
              —
            </span>
          )}
        </button>
      ) : (
        <div className="flex items-center gap-3">
          {value ? (
            <i
              data-testid="icon-picker-current"
              className={`${value} text-xl`}
            />
          ) : (
            <span
              data-testid="icon-picker-current"
              className="text-on-surface-secondary"
            >
              —
            </span>
          )}
          <Button
            type="button"
            variant="secondary"
            onClick={() => setOpen(true)}
            aria-label="Pick icon"
          >
            Pick icon
          </Button>
        </div>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Pick an icon"
        size="lg"
      >
        <input
          type="search"
          placeholder="Search icons..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full mb-4 px-3 py-2 border rounded"
        />
        <div className="grid grid-cols-8 gap-2 max-h-96 overflow-auto">
          {filtered.map((cls) => (
            <button
              key={cls}
              type="button"
              data-testid="icon-option"
              title={cls}
              onClick={() => {
                onChange(cls);
                setOpen(false);
              }}
              className="cursor-pointer aspect-square flex items-center justify-center border rounded hover:bg-surface-secondary"
            >
              <i className={cls} />
            </button>
          ))}
        </div>
      </Modal>
    </>
  );
}
