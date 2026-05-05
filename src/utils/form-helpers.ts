import * as yup from 'yup';

export const localizedString = (label: string) =>
  yup.object({
    en: yup.string().required(`${label} (EN) is required`),
    vi: yup.string().required(`${label} (VI) is required`),
  });
