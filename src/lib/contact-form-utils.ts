import * as yup from 'yup';

export const contactSchema = yup.object({
  name: yup.string().required('Name is required'),
  email: yup.string().email('Invalid email').required('Email is required'),
  message: yup.string().required('Message is required'),
});

export type ContactFormData = yup.InferType<typeof contactSchema>;

export const contactDefaults: ContactFormData = {
  name: '',
  email: '',
  message: '',
};

export async function submitContact(
  data: ContactFormData,
): Promise<{error?: string}> {
  // Stub until contact API route is built
  console.log('Contact form submitted:', data);
  return {};
}
