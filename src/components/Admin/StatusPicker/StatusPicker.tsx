import type * as VMT from '@/domain';
import {SegmentedControl} from '@/components/ui';

const statusOptions: {
  value: VMT.TourStatus;
  label: string;
  activeClasses: string;
}[] = [
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
  value: VMT.TourStatus;
  onChange: (status: VMT.TourStatus) => void;
  disabled?: boolean;
};

export function StatusPicker({
  value,
  onChange,
  disabled = false,
}: StatusPickerProps) {
  return (
    <SegmentedControl
      options={statusOptions}
      value={value}
      onChange={onChange}
      disabled={disabled}
    />
  );
}
