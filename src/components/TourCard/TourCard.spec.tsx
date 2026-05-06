import {render, screen} from '@/test-utils/render';
import {TourCard} from './TourCard';
import {buildTour} from '@/test-utils/factories';

describe('TourCard', () => {
  const tour = buildTour({
    title: 'Da Lat Tour',
    price: 80,
    duration: 1,
    distance: 186,
    destinationId: 1,
    imageUrl: '/dalat.jpg',
    slug: 'da-lat-tour',
  });

  it('renders the tour title as a link to /tours/da-lat-tour', () => {
    render(<TourCard tour={tour} />);
    const link = screen.getByText('Da Lat Tour').closest('a');
    expect(link).toHaveAttribute('href', '/tours/da-lat-tour');
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
    expect(screen.getByText('1')).toBeInTheDocument();
  });

  it('renders the distance', () => {
    render(<TourCard tour={tour} />);
    expect(screen.getByText('186')).toBeInTheDocument();
  });

  it('renders the location', () => {
    render(<TourCard tour={tour} />);
    expect(screen.getByText('Dalat')).toBeInTheDocument();
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
