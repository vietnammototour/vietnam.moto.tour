import {render, screen} from '@testing-library/react';
import {DestinationHero} from './DestinationHero';

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
  tours: [],
};

describe('DestinationHero', () => {
  it('renders the destination name', () => {
    render(<DestinationHero destination={dest} locale="en" />);
    expect(screen.getByRole('heading', {name: 'Da Lat'})).toBeInTheDocument();
  });

  it('renders English description when locale is en', () => {
    render(<DestinationHero destination={dest} locale="en" />);
    expect(screen.getByText('Mountain city')).toBeInTheDocument();
  });

  it('renders Vietnamese description when locale is vi', () => {
    render(<DestinationHero destination={dest} locale="vi" />);
    expect(screen.getByText('Thành phố ngàn hoa')).toBeInTheDocument();
  });

  it('renders hero image', () => {
    render(<DestinationHero destination={dest} locale="en" />);
    expect(screen.getByAltText('Da Lat')).toBeInTheDocument();
  });
});
