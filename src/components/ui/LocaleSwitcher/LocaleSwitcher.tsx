'use client';

import {SegmentedControl} from '@/components/ui/SegmentedControl';

export type AdminLocale = 'en' | 'vi';

const options: {value: AdminLocale; label: string}[] = [
  {value: 'en', label: 'EN'},
  {value: 'vi', label: 'VI'},
];

type LocaleSwitcherProps = {
  value: AdminLocale;
  onChange: (locale: AdminLocale) => void;
};

export function LocaleSwitcher({value, onChange}: LocaleSwitcherProps) {
  return (
    <SegmentedControl options={options} value={value} onChange={onChange} />
  );
}
