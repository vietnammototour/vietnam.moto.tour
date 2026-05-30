import {buildWidgetUrl, WTYPE} from './buildWidgetUrl';

describe('buildWidgetUrl', () => {
  it('includes the locationId', () => {
    const url = buildWidgetUrl({variant: 'reviews', locationId: '5501636', locale: 'en', uniq: '1'});
    expect(url).toContain('locationId=5501636');
  });

  it('maps locale to a TripAdvisor lang token', () => {
    expect(buildWidgetUrl({variant: 'rating', locationId: '1', locale: 'vi', uniq: '1'})).toContain('lang=vi');
    expect(buildWidgetUrl({variant: 'rating', locationId: '1', locale: 'en', uniq: '1'})).toContain('lang=en_US');
  });

  it('uses the wtype for the variant', () => {
    expect(buildWidgetUrl({variant: 'reviews', locationId: '1', locale: 'en', uniq: '1'})).toContain(`wtype=${WTYPE.reviews}`);
    expect(buildWidgetUrl({variant: 'travelersChoice', locationId: '1', locale: 'en', uniq: '1'})).toContain(`wtype=${WTYPE.travelersChoice}`);
  });

  it('includes the uniq used to match the mount container', () => {
    expect(buildWidgetUrl({variant: 'rating', locationId: '1', locale: 'en', uniq: '908'})).toContain('uniq=908');
  });

  it('points at the jscache wejs endpoint', () => {
    expect(buildWidgetUrl({variant: 'rating', locationId: '1', locale: 'en', uniq: '1'})).toMatch(/^https:\/\/www\.jscache\.com\/wejs\?/);
  });
});
