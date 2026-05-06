import * as yup from 'yup';
import {api} from '@/routes';

export const addHighlightSchema = yup.object({
  text: yup.string().trim().required('Highlight text is required'),
});

export type AddHighlightFormData = yup.InferType<typeof addHighlightSchema>;

export const addHighlightDefaults: AddHighlightFormData = {
  text: '',
};

export async function submitAddHighlight(
  data: AddHighlightFormData,
  destinationId: string,
  locale: 'en' | 'vi',
): Promise<{error?: string}> {
  const field = locale === 'en' ? 'textEn' : 'textVi';
  const {error} = await api.admin.highlights.create({
    destinationId,
    [field]: data.text,
  });
  if (error) return {error};
  return {};
}
