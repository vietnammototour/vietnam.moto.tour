import {forwardRef, useId, type InputHTMLAttributes} from 'react';
import {FormField} from '@/components/ui/FormField';

type TextInputProps = {
  label?: string;
  error?: string;
  hint?: string;
} & InputHTMLAttributes<HTMLInputElement>;

export const TextInput = forwardRef<HTMLInputElement, TextInputProps>(
  function TextInput({label, error, hint, id, ...rest}, ref) {
    const generatedId = useId();
    const inputId = id || generatedId;

    return (
      <FormField label={label} error={error} hint={hint} htmlFor={inputId}>
        <input
          ref={ref}
          id={inputId}
          className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-on-surface focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
          {...rest}
        />
      </FormField>
    );
  },
);
