import type {ReactNode} from 'react';

type FormFieldProps = {
  label?: string;
  error?: string;
  hint?: string;
  required?: boolean;
  htmlFor?: string;
  children: ReactNode;
};

export function FormField({
  label,
  error,
  hint,
  required,
  htmlFor,
  children,
}: FormFieldProps) {
  return (
    <div>
      {label && (
        <label
          htmlFor={htmlFor}
          className="block type-label-sm text-on-surface-secondary mb-1"
        >
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}
      {children}
      {hint && !error && (
        <p className="text-on-surface-secondary text-sm mt-1">{hint}</p>
      )}
      {error && (
        <p className="text-red-500 text-sm mt-1" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
