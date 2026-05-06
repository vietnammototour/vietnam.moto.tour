import type {LocalizedText} from '../shared/localized-text';

export type ItineraryItem = {
  time: string;
  description: LocalizedText;
};

export type ItineraryDay = {
  dayLabel: LocalizedText;
  items: ItineraryItem[];
};
