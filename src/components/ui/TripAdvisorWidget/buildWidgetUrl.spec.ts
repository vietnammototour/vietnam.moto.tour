import {buildWidgetUrl, WTYPE} from './buildWidgetUrl';

describe('buildWidgetUrl', () => {
  it('includes the locationId', () => {
    const url = buildWidgetUrl({variant: 'reviews', locationId: '5501636', locale: 'en'});
    expect(url).toContain('locationId=5501636');
  });

  it('maps locale to a TripAdvisor lang token', () => {
    expect(buildWidgetUrl({variant: 'rating', locationId: '1', locale: 'vi'})).toContain('lang=vi');
    expect(buildWidgetUrl({variant: 'rating', locationId: '1', locale: 'en'})).toContain('lang=en_US');
  });

  it('uses the wtype for the variant', () => {
    expect(buildWidgetUrl({variant: 'reviews', locationId: '1', locale: 'en'})).toContain(`wtype=${WTYPE.reviews}`);
    expect(buildWidgetUrl({variant: 'travelersChoice', locationId: '1', locale: 'en'})).toContain(`wtype=${WTYPE.travelersChoice}`);
  });

  it('points at the jscache wejs endpoint', () => {
    expect(buildWidgetUrl({variant: 'rating', locationId: '1', locale: 'en'})).toMatch(/^https:\/\/www\.jscache\.com\/wejs\?/);
  });
});
