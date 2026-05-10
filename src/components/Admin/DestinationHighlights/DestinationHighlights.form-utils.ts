import * as yup from 'yup';
import {api} from '@/routes';

export const addHighlightSchema = yup.object({
  title: yup.string().trim().required('Title is required'),
  description: yup.string().trim().default(''),
});

export type AddHighlightFormData = yup.InferType<typeof addHighlightSchema>;

export const addHighlightDefaults: AddHighlightFormData = {
  title: '',
  description: '',
};

export async function submitAddHighlight(
  data: AddHighlightFormData,
  destinationId: string,
  _locale: 'en' | 'vi',
): Promise<{error?: string}> {
  const {error} = await api.admin.highlights.create({
    destinationId,
    titleEn: data.title,
    titleVi: data.title,
    descriptionEn: data.description,
    descriptionVi: data.description,
  });
  if (error) return {error};
  return {};
}
