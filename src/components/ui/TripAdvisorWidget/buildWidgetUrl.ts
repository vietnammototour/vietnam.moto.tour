export type ScriptVariant = 'reviews' | 'rating' | 'travelersChoice';

export const WTYPE: Record<ScriptVariant, string> = {
  reviews: 'cdsscrollingravewide',
  rating: 'selfserveprop',
  travelersChoice: 'cdspromo',
};

const LANG: Record<'en' | 'vi', string> = {
  en: 'en_US',
  vi: 'vi',
};

export function buildWidgetUrl(args: {
  variant: ScriptVariant;
  locationId: string;
  locale: 'en' | 'vi';
}) {
  const params = new URLSearchParams({
    wtype: WTYPE[args.variant],
    locationId: args.locationId,
    lang: LANG[args.locale],
    border: 'false',
    display_version: '2',
  });
  return `https://www.jscache.com/wejs?${params.toString()}`;
}
