import {useForm} from 'react-hook-form';
import {yupResolver} from '@hookform/resolvers/yup';
import {
  Button,
  TextInput,
  NumberInput,
  SegmentedControl,
  FormField,
} from '@/components/ui';
import type {Vehicle} from '@/domain';
import {
  vehicleGeneralSchema,
  vehicleGeneralDefaults,
  deriveSlug,
  type VehicleGeneralFormValues,
} from './VehicleGeneralForm.form-utils';

type Props = {
  initial: Vehicle | null;
  onSubmit: (values: VehicleGeneralFormValues) => void | Promise<void>;
  onCancel?: () => void;
};

export function VehicleGeneralForm({initial, onSubmit, onCancel}: Props) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: {errors, isSubmitting},
  } = useForm<VehicleGeneralFormValues>({
    resolver: yupResolver(vehicleGeneralSchema),
    defaultValues: vehicleGeneralDefaults(initial),
  });

  const type = watch('type');
  const status = watch('status');
  const brand = watch('brand');
  const model = watch('model');

  return (
    <form
      onSubmit={handleSubmit(async (values) => {
        const next = {
          ...values,
          slug: values.slug || deriveSlug(brand, model),
        };
        await onSubmit(next);
      })}
      className="space-y-6 max-w-2xl"
    >
      <FormField label="Type">
        <SegmentedControl
          value={type}
          onChange={(v) => setValue('type', v)}
          options={[
            {value: 'SCOOTER', label: 'Scooter'},
            {value: 'BIKE', label: 'Bike'},
          ]}
        />
      </FormField>

      <TextInput
        label="Brand"
        {...register('brand')}
        error={errors.brand?.message}
      />

      <TextInput
        label="Model"
        {...register('model')}
        error={errors.model?.message}
      />

      <NumberInput
        label="Engine (cc)"
        {...register('cc', {valueAsNumber: true})}
        error={errors.cc?.message}
      />

      <NumberInput
        label="Quantity in stock"
        {...register('quantity', {valueAsNumber: true})}
        error={errors.quantity?.message}
      />

      <NumberInput
        label="Price / day (USD)"
        {...register('priceUsdPerDay', {valueAsNumber: true})}
        error={errors.priceUsdPerDay?.message}
      />

      <FormField label="Status">
        <SegmentedControl
          value={status}
          onChange={(v) => setValue('status', v)}
          options={[
            {value: 'DRAFT', label: 'Draft'},
            {value: 'PUBLISHED', label: 'Published'},
            {value: 'ARCHIVED', label: 'Archived'},
          ]}
        />
      </FormField>

      <NumberInput
        label="Sort order"
        {...register('order', {valueAsNumber: true})}
        error={errors.order?.message}
      />

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
