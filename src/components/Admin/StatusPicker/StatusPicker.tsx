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
    activeClasses:
      'bg-status-draft text-on-status-draft border-status-draft',
  },
  {
    value: 'PUBLISHED',
    label: 'Published',
    activeClasses: 'bg-primary text-on-primary border-primary',
  },
  {
    value: 'ARCHIVED',
    label: 'Archived',
    activeClasses:
      'bg-status-default text-on-status-default border-status-default',
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
