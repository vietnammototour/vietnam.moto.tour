type SegmentedControlOption<T extends string> = {
  value: T;
  label: string;
  activeClasses?: string;
};

type SegmentedControlProps<T extends string> = {
  options: SegmentedControlOption<T>[];
  value: T;
  onChange: (value: T) => void;
  size?: 'sm' | 'md';
  disabled?: boolean;
};

const sizeClasses = {
  sm: 'px-3 py-1 type-label-sm',
  md: 'px-3.5 py-1.5 type-label-sm',
};

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  size = 'md',
  disabled = false,
}: SegmentedControlProps<T>) {
  return (
    <div
      role="radiogroup"
      className="inline-flex border border-border overflow-hidden"
    >
      {options.map((option) => {
        const isSelected = option.value === value;
        const activeStyle =
          option.activeClasses || 'bg-primary text-on-primary';

        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={isSelected}
            aria-label={option.label}
            disabled={disabled}
            onClick={() => onChange(option.value)}
            className={`${sizeClasses[size]} transition-colors cursor-pointer border-r border-border last:border-r-0 ${
              isSelected
                ? activeStyle
                : 'bg-surface text-on-surface-secondary hover:bg-surface-alt'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
