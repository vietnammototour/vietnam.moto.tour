import {render, screen} from '@/test-utils/render';
import {TourCard} from './index';
import {buildTour} from '@/test-utils/factories';

describe('TourCard', () => {
  const tour = buildTour({
    title: 'Da Lat Tour',
    price: 80,
    duration: '1 Day',
    distance: '186 Miles',
    location: 'Da Lat',
    imageUrl: '/dalat.jpg',
  });

  it('renders the tour title as a link to /tours', () => {
    render(<TourCard tour={tour} />);
    const link = screen.getByText('Da Lat Tour').closest('a');
    expect(link).toHaveAttribute('href', '/tours');
  });

  it('renders the price', () => {
    render(<TourCard tour={tour} />);
    expect(screen.getByText('$80')).toBeInTheDocument();
  });

  it('renders the perPerson translation key', () => {
    render(<TourCard tour={tour} />);
    expect(screen.getByText('perPerson')).toBeInTheDocument();
  });

  it('renders the duration', () => {
    render(<TourCard tour={tour} />);
    expect(screen.getByText('1 Day')).toBeInTheDocument();
  });

  it('renders the distance', () => {
    render(<TourCard tour={tour} />);
    expect(screen.getByText('186 Miles')).toBeInTheDocument();
  });

  it('renders the location', () => {
    render(<TourCard tour={tour} />);
    expect(screen.getByText('Da Lat')).toBeInTheDocument();
  });

  it('renders the tour image with correct src and alt', () => {
    render(<TourCard tour={tour} />);
    const img = screen.getByAltText('Da Lat Tour');
    expect(img).toHaveAttribute('src', '/dalat.jpg');
  });

  it('renders clock icon', () => {
    render(<TourCard tour={tour} />);
    expect(document.querySelector('.fa-clock')).toBeInTheDocument();
  });

  it('renders road icon', () => {
    render(<TourCard tour={tour} />);
    expect(document.querySelector('.fa-road')).toBeInTheDocument();
  });

  it('renders map-marker-alt icon', () => {
    render(<TourCard tour={tour} />);
    expect(document.querySelector('.fa-map-marker-alt')).toBeInTheDocument();
  });
});
