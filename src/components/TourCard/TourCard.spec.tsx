import {render, screen} from '@/test-utils/render';
import {TourCard} from './TourCard';
import {buildTour} from '@/test-utils/factories';

describe('TourCard', () => {
  const tour = buildTour({
    title: {en: 'Da Lat Tour', vi: 'Da Lat Tour'},
    pricingGroups: [
      {
        type: 'vehicle',
        label: {en: 'By Motorbike', vi: 'Xe Máy'},
        tiers: [{label: {en: 'Solo', vi: 'Solo'}, price: 80}],
      },
    ],
    duration: 1,
    distance: 186,
    destinationId: 'dest-1',
    destinationName: 'Dalat',
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

  it('renders the priceUnitVehicle translation key for vehicle pricing', () => {
    render(<TourCard tour={tour} />);
    expect(screen.getByText('priceUnitVehicle')).toBeInTheDocument();
  });

  it('renders the priceUnitPerson translation key for group-size pricing', () => {
    const groupTour = buildTour({
      title: {en: 'Group Tour', vi: 'Group Tour'},
      pricingGroups: [
        {
          type: 'group-size',
          label: {en: 'Group', vi: 'Nhóm'},
          tiers: [
            {
              label: {en: '2-4', vi: '2-4'},
              price: 150,
              minGroupSize: 2,
              maxGroupSize: 4,
            },
          ],
        },
      ],
      slug: 'group-tour',
    });
    render(<TourCard tour={groupTour} />);
    expect(screen.getByText('priceUnitPerson')).toBeInTheDocument();
    expect(screen.getByText('$150')).toBeInTheDocument();
  });

  it('renders both prices when both pricing types are present', () => {
    const bothTour = buildTour({
      title: {en: 'Both Tour', vi: 'Both Tour'},
      pricingGroups: [
        {
          type: 'vehicle',
          label: {en: 'Bike', vi: 'Xe'},
          tiers: [{label: {en: 'Solo', vi: 'Solo'}, price: 80}],
        },
        {
          type: 'group-size',
          label: {en: 'Group', vi: 'Nhóm'},
          tiers: [
            {
              label: {en: '2-4', vi: '2-4'},
              price: 150,
              minGroupSize: 2,
              maxGroupSize: 4,
            },
          ],
        },
      ],
      slug: 'both-tour',
    });
    render(<TourCard tour={bothTour} />);
    expect(screen.getByText('$80')).toBeInTheDocument();
    expect(screen.getByText('$150')).toBeInTheDocument();
    expect(screen.getByText('priceUnitVehicle')).toBeInTheDocument();
    expect(screen.getByText('priceUnitPerson')).toBeInTheDocument();
  });

  it('renders the duration with translation key', () => {
    render(<TourCard tour={tour} />);
    expect(screen.getByText('daysCount:{"count":1}')).toBeInTheDocument();
  });

  it('renders the distance with translation key', () => {
    render(<TourCard tour={tour} />);
    expect(
      screen.getByText('kilometersCount:{"count":186}'),
    ).toBeInTheDocument();
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
