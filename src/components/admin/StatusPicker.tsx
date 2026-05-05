import type {TourStatus} from '@/types';

const statuses: {value: TourStatus; label: string; activeClasses: string}[] = [
  {
    value: 'DRAFT',
    label: 'Draft',
    activeClasses: 'bg-amber-500 text-white border-amber-500',
  },
  {
    value: 'PUBLISHED',
    label: 'Published',
    activeClasses: 'bg-green-600 text-white border-green-600',
  },
  {
    value: 'FEATURED',
    label: 'Featured',
    activeClasses: 'bg-blue-500 text-white border-blue-500',
  },
  {
    value: 'ARCHIVED',
    label: 'Archived',
    activeClasses: 'bg-gray-500 text-white border-gray-500',
  },
];

type StatusPickerProps = {
  value: TourStatus;
  onChange: (status: TourStatus) => void;
  disabled?: boolean;
};

export function StatusPicker({
  value,
  onChange,
  disabled = false,
}: StatusPickerProps) {
  return (
    <div
      role="radiogroup"
      aria-label="Tour status"
      className="inline-flex rounded-lg border border-border overflow-hidden"
    >
      {statuses.map((s) => {
        const isSelected = s.value === value;
        return (
          <button
            key={s.value}
            type="button"
            role="radio"
            aria-checked={isSelected}
            disabled={disabled}
            onClick={() => onChange(s.value)}
            className={`px-3 py-1 type-label-sm transition-colors cursor-pointer border-r border-border last:border-r-0 ${
              isSelected
                ? s.activeClasses
                : 'bg-surface text-on-surface-secondary hover:bg-surface-alt'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {s.label}
          </button>
        );
      })}
    </div>
  );
}
