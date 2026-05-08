import {render, screen} from '@/test-utils/render';
import {DestinationCard} from './DestinationCard';
import {buildDestination} from '@/test-utils/factories';

describe('DestinationCard', () => {
  const destination = {
    ...buildDestination({
      name: 'Dalat',
      imageUrl: '/dalat.jpg',
      id: 'dest-dalat',
      slug: 'dalat',
    }),
    tourCount: 5,
    hasCar: true,
    hasBike: true,
    carTourCount: 2,
    bikeTourCount: 3,
  };

  it('renders bike tour count with motorcycle icon', () => {
    render(<DestinationCard destination={destination} />);
    expect(document.querySelector('.fa-motorcycle')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('renders car tour count with car icon', () => {
    render(<DestinationCard destination={destination} />);
    expect(document.querySelector('.fa-car')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('renders the destination name as a link to the destination detail page', () => {
    render(<DestinationCard destination={destination} />);
    expect(screen.getByTestId('destination-card')).toHaveAttribute(
      'href',
      '/destinations/dalat',
    );
  });

  it('renders the tour count with tours translation key', () => {
    render(<DestinationCard destination={destination} />);
    expect(screen.getByText('5 tours:{"count":5}')).toBeInTheDocument();
  });

  it('renders the image with correct src and alt', () => {
    render(<DestinationCard destination={destination} />);
    const img = screen.getByAltText('Dalat');
    expect(img).toHaveAttribute('src', '/dalat.jpg');
  });
});
