import {render, screen} from '@testing-library/react';
import {DestinationHero} from './DestinationHero';

jest.mock('@/hooks/use-cursor-spotlight', () => ({
  useCursorSpotlight: () => ({
    ref: {current: null},
    x: 0,
    y: 0,
    onMouseMove: () => {},
    onMouseLeave: () => {},
  }),
}));

const dest = {
  id: 'd1',
  slug: 'dalat',
  name: 'Da Lat',
  imageUrl: '/img/dalat.jpg',
  heroImage: '/img/dalat-hero.jpg',
  size: 'large' as const,
  isActive: true,
  description: {en: 'Mountain city', vi: 'Thành phố ngàn hoa'},
  highlights: [],
  highlightsTotal: 0,
  tours: [{id: 't1'} as never],
};

describe('DestinationHero', () => {
  it('renders the destination name as h1', () => {
    render(<DestinationHero destination={dest} locale="en" />);
    expect(
      screen.getByRole('heading', {level: 1, name: 'Da Lat'}),
    ).toBeInTheDocument();
  });

  it('renders English description when locale is en', () => {
    render(<DestinationHero destination={dest} locale="en" />);
    expect(screen.getByText('Mountain city')).toBeInTheDocument();
  });

  it('renders Vietnamese description when locale is vi', () => {
    render(<DestinationHero destination={dest} locale="vi" />);
    expect(screen.getByText('Thành phố ngàn hoa')).toBeInTheDocument();
  });

  it('renders the breadcrumb home + destinations links', () => {
    render(<DestinationHero destination={dest} locale="en" />);
    expect(screen.getByText('breadcrumbHome')).toBeInTheDocument();
    expect(screen.getByText('breadcrumbDestinations')).toBeInTheDocument();
  });
});
