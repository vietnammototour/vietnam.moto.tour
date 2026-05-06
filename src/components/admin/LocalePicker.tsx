'use client';

import {SegmentedControl} from '@/components/ui';

type Locale = 'en' | 'vi';

const localeOptions: {value: Locale; label: string}[] = [
  {value: 'en', label: 'EN'},
  {value: 'vi', label: 'VI'},
];

type LocalePickerProps = {
  value: Locale;
  onChange: (locale: Locale) => void;
};

export function LocalePicker({value, onChange}: LocalePickerProps) {
  return (
    <SegmentedControl options={localeOptions} value={value} onChange={onChange} />
  );
}

export type {Locale};
