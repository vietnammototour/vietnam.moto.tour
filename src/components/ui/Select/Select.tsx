import {forwardRef, useId, type SelectHTMLAttributes} from 'react';
import {FormField} from '@/components/ui/FormField';

type SelectProps = {
  label?: string;
  error?: string;
  hint?: string;
  fullWidth?: boolean;
  selectSize?: 'md' | 'sm';
} & SelectHTMLAttributes<HTMLSelectElement>;

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  function Select(
    {
      label,
      error,
      hint,
      id,
      className,
      children,
      fullWidth = true,
      selectSize = 'md',
      ...rest
    },
    ref,
  ) {
    const generatedId = useId();
    const selectId = id || generatedId;

    const sizeClass =
      selectSize === 'sm' ? 'px-2 py-1.5 type-label-sm' : 'px-3 py-2';
    const widthClass = fullWidth ? 'w-full' : '';
    const baseClass = `${widthClass} ${sizeClass} rounded-lg border border-border bg-surface text-on-surface focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer`;
    const finalClass = className ? `${baseClass} ${className}` : baseClass;

    const select = (
      <select ref={ref} id={selectId} className={finalClass} {...rest}>
        {children}
      </select>
    );

    if (label === undefined && error === undefined && hint === undefined) {
      return select;
    }

    return (
      <FormField label={label} error={error} hint={hint} htmlFor={selectId}>
        {select}
      </FormField>
    );
  },
);
