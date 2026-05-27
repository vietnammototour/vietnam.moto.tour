import {forwardRef, useId, type InputHTMLAttributes} from 'react';
import {FormField} from '@/components/ui/FormField';

type NumberInputProps = {
  label?: string;
  error?: string;
  hint?: string;
} & Omit<InputHTMLAttributes<HTMLInputElement>, 'type'>;

export const NumberInput = forwardRef<HTMLInputElement, NumberInputProps>(
  function NumberInput({label, error, hint, id, ...rest}, ref) {
    const generatedId = useId();
    const inputId = id || generatedId;

    return (
      <FormField label={label} error={error} hint={hint} htmlFor={inputId}>
        <input
          ref={ref}
          id={inputId}
          type="number"
          className="w-full px-3 py-2 border border-border bg-surface text-on-surface focus:outline-none focus:ring-2 focus:ring-primary cursor-text disabled:bg-surface-alt disabled:text-on-surface-tertiary disabled:cursor-not-allowed disabled:border-border/50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          {...rest}
        />
      </FormField>
    );
  },
);
