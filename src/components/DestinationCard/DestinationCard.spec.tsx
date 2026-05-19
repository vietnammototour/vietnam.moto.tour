import {render, screen} from '@/test-utils/render';
import {DestinationCard} from './DestinationCard';
import {buildDestination} from '@/test-utils/factories';

describe('DestinationCard', () => {
  const destination = {
    ...buildDestination({
      name: {en: 'Dalat', vi: 'Dalat'},
      imageUrl: '/dalat.jpg',
      id: 'dest-dalat',
      slug: 'dalat',
    }),
    tourCount: 6,
    carOnlyCount: 2,
    bikeOnlyCount: 3,
    bikeAndCarCount: 1,
  };

  it('renders car-only chip with count and tours text', () => {
    render(<DestinationCard destination={destination} />);
    expect(
      screen.getByLabelText('2 car tours:{"count":2}'),
    ).toBeInTheDocument();
    expect(screen.getByText('2 tours:{"count":2}')).toBeInTheDocument();
  });

  it('renders bike-only chip with count and tours text', () => {
    render(<DestinationCard destination={destination} />);
    expect(
      screen.getByLabelText('3 motorbike tours:{"count":3}'),
    ).toBeInTheDocument();
    expect(screen.getByText('3 tours:{"count":3}')).toBeInTheDocument();
  });

  it('renders bike-and-car chip with count and tours text', () => {
    render(<DestinationCard destination={destination} />);
    expect(
      screen.getByLabelText('1 motorbike/car tours:{"count":1}'),
    ).toBeInTheDocument();
    expect(screen.getByText('1 tours:{"count":1}')).toBeInTheDocument();
  });

  it('hides chips for zero counts', () => {
    render(
      <DestinationCard
        destination={{
          ...destination,
          carOnlyCount: 0,
          bikeAndCarCount: 0,
        }}
      />,
    );
    expect(screen.queryByLabelText(/^\d+ car /)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/motorbike\/car/)).not.toBeInTheDocument();
    expect(
      screen.getByLabelText('3 motorbike tours:{"count":3}'),
    ).toBeInTheDocument();
  });

  it('renders the destination name as a link to the destination detail page', () => {
    render(<DestinationCard destination={destination} />);
    expect(screen.getByTestId('destination-card')).toHaveAttribute(
      'href',
      '/destinations/dalat',
    );
  });

  it('renders the image with correct src and alt', () => {
    render(<DestinationCard destination={destination} />);
    const img = screen.getByAltText('Dalat');
    expect(img).toHaveAttribute('src', '/dalat.jpg');
  });
});
