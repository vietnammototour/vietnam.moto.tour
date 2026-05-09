import * as yup from 'yup';

export const newCollectionSchema = yup.object({
  key: yup
    .string()
    .matches(/^[a-z0-9-]+$/, 'lowercase letters, digits, dashes only')
    .required(),
  label: yup.string().trim().min(1).required(),
});

export type NewCollectionForm = yup.InferType<typeof newCollectionSchema>;

export const newCollectionDefaults: NewCollectionForm = {key: '', label: ''};
