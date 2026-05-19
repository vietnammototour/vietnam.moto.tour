import * as yup from 'yup';
import {api} from '@/routes';

export const destinationSchema = yup.object({
  slug: yup.string().required('Slug is required'),
  nameVi: yup.string().required('Vietnamese name is required'),
  nameEn: yup.string().required('English name is required'),
  imageUrl: yup.string().defined(),
  heroImage: yup.string().defined(),
  descriptionVi: yup.string().defined(),
  descriptionEn: yup.string().defined(),
  size: yup.string().defined(),
});

export type DestinationFormData = yup.InferType<typeof destinationSchema>;

export const destinationDefaults: DestinationFormData = {
  slug: '',
  nameVi: '',
  nameEn: '',
  imageUrl: '',
  heroImage: '',
  descriptionVi: '',
  descriptionEn: '',
  size: '',
};

export async function submitDestination(
  data: DestinationFormData,
  mode: 'create' | 'edit',
  destinationId: string | null,
): Promise<{data?: {id: string | number}; error?: string}> {
  const result =
    mode === 'create'
      ? await api.admin.destinations.create(
          data as unknown as Record<string, unknown>,
        )
      : await api.admin.destinations.update(
          destinationId!,
          data as unknown as Record<string, unknown>,
        );

  if (result.error) return {error: result.error};
  return {data: {id: result.data?.id ?? destinationId!}};
}
