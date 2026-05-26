'use client';

import {
  forwardRef,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
} from 'react';
import {FormField} from '@/components/ui/FormField';

export type SelectOption = {
  value: string;
  label: string;
  disabled?: boolean;
};

type SelectProps = {
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  hint?: string;
  fullWidth?: boolean;
  selectSize?: 'md' | 'sm';
  disabled?: boolean;
  id?: string;
  name?: string;
  className?: string;
  'aria-label'?: string;
};

export const Select = forwardRef<HTMLButtonElement, SelectProps>(
  function Select(
    {
      options,
      value,
      onChange,
      placeholder = 'Select…',
      label,
      error,
      hint,
      fullWidth = true,
      selectSize = 'md',
      disabled = false,
      id,
      name,
      className = '',
      'aria-label': ariaLabel,
    },
    ref,
  ) {
    const generatedId = useId();
    const selectId = id || generatedId;
    const containerRef = useRef<HTMLDivElement>(null);
    const listRef = useRef<HTMLUListElement>(null);
    const [open, setOpen] = useState(false);
    const [activeIndex, setActiveIndex] = useState<number>(() =>
      Math.max(
        0,
        options.findIndex((o) => o.value === value),
      ),
    );

    const selected = options.find((o) => o.value === value);

    const sizeClass =
      selectSize === 'sm' ? 'px-2 py-1.5 type-label-sm' : 'px-3 py-2';
    const widthClass = fullWidth ? 'w-full' : '';
    const triggerClass = [
      widthClass,
      sizeClass,
      'inline-flex items-center justify-between gap-2 rounded-lg border border-border bg-surface text-on-surface focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed text-left',
      className,
    ]
      .filter(Boolean)
      .join(' ');

    const close = useCallback(() => setOpen(false), []);

    useEffect(() => {
      if (!open) return;
      function handleClick(e: MouseEvent) {
        if (!containerRef.current?.contains(e.target as Node)) close();
      }
      function handleKey(e: globalThis.KeyboardEvent) {
        if (e.key === 'Escape') close();
      }
      document.addEventListener('mousedown', handleClick);
      document.addEventListener('keydown', handleKey);
      return () => {
        document.removeEventListener('mousedown', handleClick);
        document.removeEventListener('keydown', handleKey);
      };
    }, [open, close]);

    function pick(idx: number) {
      const opt = options[idx];
      if (!opt || opt.disabled) return;
      onChange(opt.value);
      setActiveIndex(idx);
      close();
    }

    function handleTriggerKey(e: KeyboardEvent<HTMLButtonElement>) {
      if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        setOpen(true);
      }
    }

    function handleListKey(e: KeyboardEvent<HTMLUListElement>) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIndex((i) => Math.min(options.length - 1, i + 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIndex((i) => Math.max(0, i - 1));
      } else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        pick(activeIndex);
      } else if (e.key === 'Home') {
        e.preventDefault();
        setActiveIndex(0);
      } else if (e.key === 'End') {
        e.preventDefault();
        setActiveIndex(options.length - 1);
      }
    }

    useEffect(() => {
      if (open && listRef.current) {
        const el = listRef.current.querySelector<HTMLLIElement>(
          `[data-index="${activeIndex}"]`,
        );
        el?.scrollIntoView({block: 'nearest'});
        listRef.current.focus();
      }
    }, [open, activeIndex]);

    const trigger = (
      <div
        ref={containerRef}
        className={`relative ${fullWidth ? 'w-full' : ''}`}
      >
        <button
          ref={ref}
          type="button"
          id={selectId}
          name={name}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-label={ariaLabel}
          disabled={disabled}
          onClick={() => setOpen((o) => !o)}
          onKeyDown={handleTriggerKey}
          className={triggerClass}
        >
          <span
            className={
              selected ? 'truncate' : 'truncate text-on-surface-tertiary'
            }
          >
            {selected ? selected.label : placeholder}
          </span>
          <i className="fa fa-chevron-down text-xs text-on-surface-secondary" />
        </button>
        {open ? (
          <ul
            ref={listRef}
            tabIndex={-1}
            role="listbox"
            aria-activedescendant={`${selectId}-opt-${activeIndex}`}
            onKeyDown={handleListKey}
            className="absolute z-50 mt-1 max-h-64 w-full overflow-y-auto rounded-lg border border-border bg-surface-elevated shadow-lg focus:outline-none"
          >
            {options.map((opt, idx) => {
              const isSelected = opt.value === value;
              const isActive = idx === activeIndex;
              return (
                <li
                  key={opt.value}
                  id={`${selectId}-opt-${idx}`}
                  data-index={idx}
                  role="option"
                  aria-selected={isSelected}
                  aria-disabled={opt.disabled || undefined}
                  onMouseEnter={() => setActiveIndex(idx)}
                  onClick={() => pick(idx)}
                  className={[
                    'px-3 py-2 type-body-md cursor-pointer flex items-center justify-between gap-2',
                    opt.disabled
                      ? 'opacity-50 cursor-not-allowed'
                      : isActive
                        ? 'bg-surface-alt'
                        : '',
                    isSelected ? 'text-primary' : 'text-on-surface',
                  ].join(' ')}
                >
                  <span className="truncate">{opt.label}</span>
                  {isSelected ? (
                    <i className="fa fa-check text-xs text-primary" />
                  ) : null}
                </li>
              );
            })}
            {options.length === 0 ? (
              <li className="px-3 py-2 type-body-sm text-on-surface-tertiary">
                No options
              </li>
            ) : null}
          </ul>
        ) : null}
      </div>
    );

    if (label === undefined && error === undefined && hint === undefined) {
      return trigger;
    }

    return (
      <FormField label={label} error={error} hint={hint} htmlFor={selectId}>
        {trigger}
      </FormField>
    );
  },
);
