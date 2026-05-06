'use client';

import {Controller, useFormContext} from 'react-hook-form';
import {ImageUpload} from '@/components/ui';
import type {ImagePreset} from '@/lib/image-transcode';

type ImageUploadFieldProps = {
  name: string;
  preset: ImagePreset;
  label?: string;
};

export function ImageUploadField({name, preset, label}: ImageUploadFieldProps) {
  const {control} = useFormContext();
  return (
    <Controller
      control={control}
      name={name}
      render={({field, fieldState}) => (
        <ImageUpload
          value={field.value}
          onChange={field.onChange}
          preset={preset}
          label={label}
          error={fieldState.error?.message}
        />
      )}
    />
  );
}
