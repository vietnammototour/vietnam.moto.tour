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
  };

  it('renders the destination name as a link to /tours with destination query param', () => {
    render(<DestinationCard destination={destination} />);
    const link = screen.getByText('Dalat').closest('a');
    expect(link).toHaveAttribute('href', '/tours?destination=dest-dalat');
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
