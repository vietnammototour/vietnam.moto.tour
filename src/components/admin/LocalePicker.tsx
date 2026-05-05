'use client';

interface LocalePickerProps {
  value: 'en' | 'vi';
  onChange: (locale: 'en' | 'vi') => void;
}

export function LocalePicker({value, onChange}: LocalePickerProps) {
  return (
    <div className="inline-flex rounded-lg border border-border overflow-hidden">
      <button
        type="button"
        onClick={() => onChange('en')}
        className={`px-4 py-1.5 type-label-sm transition-colors cursor-pointer ${
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
        className={`px-4 py-1.5 type-label-sm transition-colors cursor-pointer ${
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
