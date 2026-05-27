import {forwardRef, useId, type TextareaHTMLAttributes} from 'react';
import {FormField} from '@/components/ui/FormField';

type TextareaProps = {
  label?: string;
  error?: string;
  hint?: string;
} & TextareaHTMLAttributes<HTMLTextAreaElement>;

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  function Textarea({label, error, hint, id, rows = 4, ...rest}, ref) {
    const generatedId = useId();
    const textareaId = id || generatedId;

    return (
      <FormField label={label} error={error} hint={hint} htmlFor={textareaId}>
        <textarea
          ref={ref}
          id={textareaId}
          rows={rows}
          className="w-full px-3 py-2 border border-border bg-surface text-on-surface focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
          {...rest}
        />
      </FormField>
    );
  },
);
