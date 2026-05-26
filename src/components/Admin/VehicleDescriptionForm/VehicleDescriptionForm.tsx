import {useState} from 'react';
import {useForm} from 'react-hook-form';
import {yupResolver} from '@hookform/resolvers/yup';
import {Button, Textarea, FormField} from '@/components/ui';
import {
  vehicleDescriptionSchema,
  vehicleDescriptionDefaults,
  type VehicleDescriptionFormValues,
} from './VehicleDescriptionForm.form-utils';

type Locale = 'vi' | 'en';

type Props = {
  initial: {en: string; vi: string} | null;
  onSubmit: (values: VehicleDescriptionFormValues) => void | Promise<void>;
  onCancel?: () => void;
};

export function VehicleDescriptionForm({initial, onSubmit, onCancel}: Props) {
  const [locale, setLocale] = useState<Locale>('vi');
  const {
    register,
    handleSubmit,
    formState: {isSubmitting},
  } = useForm<VehicleDescriptionFormValues>({
    resolver: yupResolver(vehicleDescriptionSchema),
    defaultValues: vehicleDescriptionDefaults(initial),
  });

  // Register both fields up-front so values persist across locale toggles
  // even though only the active locale's textarea is mounted.
  const viField = register('vi');
  const enField = register('en');

  return (
    <form
      onSubmit={handleSubmit((values) => onSubmit(values))}
      className="space-y-6 max-w-2xl"
    >
      <div className="inline-flex gap-2" role="group" aria-label="Locale">
        <Button
          variant={locale === 'vi' ? 'primary' : 'secondary'}
          type="button"
          onClick={() => setLocale('vi')}
          aria-pressed={locale === 'vi'}
        >
          VI
        </Button>
        <Button
          variant={locale === 'en' ? 'primary' : 'secondary'}
          type="button"
          onClick={() => setLocale('en')}
          aria-pressed={locale === 'en'}
        >
          EN
        </Button>
      </div>

      <FormField label="Description">
        {locale === 'vi' ? (
          <Textarea rows={8} aria-label="Description (VI)" {...viField} />
        ) : (
          <Textarea rows={8} aria-label="Description (EN)" {...enField} />
        )}
      </FormField>

      <p className="type-label-sm text-on-surface-tertiary uppercase tracking-wide">
        Stored as {'{en, vi}'} JSON shape.
      </p>

      <div className="flex gap-3 justify-end">
        {onCancel ? (
          <Button variant="secondary" type="button" onClick={onCancel}>
            Cancel
          </Button>
        ) : null}
        <Button variant="primary" type="submit" disabled={isSubmitting}>
          Save
        </Button>
      </div>
    </form>
  );
}
