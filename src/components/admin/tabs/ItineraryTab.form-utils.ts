import * as yup from 'yup';
import {localizedString} from '@/utils/form-helpers';

const itineraryItemSchema = yup.object({
  time: yup.string().required('Time is required'),
  description: localizedString('Description'),
});

const itineraryDaySchema = yup.object({
  dayLabel: localizedString('Day label'),
  items: yup.array().of(itineraryItemSchema).defined(),
});

export const itinerarySchema = yup.object({
  days: yup
    .array()
    .of(itineraryDaySchema)
    .min(1, 'At least one day required')
    .defined(),
});

export type ItineraryFormData = yup.InferType<typeof itinerarySchema>;
