import {useForm, FormProvider} from 'react-hook-form';
import {yupResolver} from '@hookform/resolvers/yup';
import {Button} from '@/components/ui';
import {ImageUploadField} from '../ImageUploadField';
import {
  vehicleImagesSchema,
  vehicleImagesDefaults,
  type VehicleImagesFormValues,
} from './VehicleImagesForm.form-utils';

type Props = {
  initial: {imageUrl: string | null; images: string[]} | null;
  onSubmit: (values: VehicleImagesFormValues) => void | Promise<void>;
  onCancel?: () => void;
};

export function VehicleImagesForm({initial, onSubmit, onCancel}: Props) {
  const methods = useForm<VehicleImagesFormValues>({
    resolver: yupResolver(vehicleImagesSchema),
    defaultValues: vehicleImagesDefaults(initial),
  });

  const {
    handleSubmit,
    formState: {isSubmitting},
  } = methods;

  return (
    <FormProvider {...methods}>
      <form
        onSubmit={handleSubmit(async (values) => {
          await onSubmit(values);
        })}
        className="space-y-6 max-w-2xl"
      >
        <ImageUploadField name="imageUrl" preset="card" label="Primary image" />

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
    </FormProvider>
  );
}
