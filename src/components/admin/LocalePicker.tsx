'use client';

type Locale = 'en' | 'vi';

interface LocalePickerProps {
  value: Locale;
  onChange: (locale: Locale) => void;
}

export function LocalePicker({value, onChange}: LocalePickerProps) {
  return (
    <div className="flex rounded-lg border border-border overflow-hidden">
      <button
        type="button"
        onClick={() => onChange('en')}
        className={`px-3.5 py-1.5 type-label-sm transition-colors cursor-pointer ${
          value === 'en'
            ? 'bg-primary text-on-primary'
            : 'bg-surface text-on-surface-secondary hover:bg-surface-alt'
        }`}
      >
        EN
      </button>
      <button
        type="button"
        onClick={() => onChange('vi')}
        className={`px-3.5 py-1.5 type-label-sm transition-colors cursor-pointer ${
          value === 'vi'
            ? 'bg-primary text-on-primary'
            : 'bg-surface text-on-surface-secondary hover:bg-surface-alt'
        }`}
      >
        VI
      </button>
    </div>
  );
}

export type {Locale};
