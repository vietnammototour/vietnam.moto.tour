import * as yup from 'yup';
import {api} from '@/routes';

export const addHighlightSchema = yup.object({
  titleEn: yup.string().trim().required('English title is required'),
  titleVi: yup.string().trim().required('Vietnamese title is required'),
  descriptionEn: yup.string().trim().default(''),
  descriptionVi: yup.string().trim().default(''),
});

export type AddHighlightFormData = yup.InferType<typeof addHighlightSchema>;

export const addHighlightDefaults: AddHighlightFormData = {
  titleEn: '',
  titleVi: '',
  descriptionEn: '',
  descriptionVi: '',
};

export async function submitAddHighlight(
  data: AddHighlightFormData,
  destinationId: string,
): Promise<{error?: string}> {
  const {error} = await api.admin.highlights.create({
    destinationId,
    titleEn: data.titleEn,
    titleVi: data.titleVi,
    descriptionEn: data.descriptionEn,
    descriptionVi: data.descriptionVi,
  });
  if (error) return {error};
  return {};
}
