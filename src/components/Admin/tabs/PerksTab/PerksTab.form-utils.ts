import * as yup from 'yup';

export const perksTabSchema = yup.object({
  includedPerkIds: yup
    .array()
    .of(yup.string().required())
    .defined()
    .default([]),
  excludedPerkIds: yup
    .array()
    .of(yup.string().required())
    .defined()
    .default([]),
});

export type PerksTabValues = yup.InferType<typeof perksTabSchema>;

export const perksTabDefaults: PerksTabValues = {
  includedPerkIds: [],
  excludedPerkIds: [],
};
