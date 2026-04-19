import {render, screen} from '@/test-utils/render';
import {DestinationCard} from './index';
import {buildDestination} from '@/test-utils/factories';

describe('DestinationCard', () => {
  const destination = buildDestination({
    name: 'Dalat',
    imageUrl: '/dalat.jpg',
    tours: 5,
  });

  it('renders the destination name as a link to /tours', () => {
    render(<DestinationCard destination={destination} />);
    const link = screen.getByText('Dalat').closest('a');
    expect(link).toHaveAttribute('href', '/tours');
  });

  it('renders the tour count with tours translation key', () => {
    render(<DestinationCard destination={destination} />);
    expect(screen.getByText('5 tours')).toBeInTheDocument();
  });

  it('renders the image with correct src and alt', () => {
    render(<DestinationCard destination={destination} />);
    const img = screen.getByAltText('Dalat');
    expect(img).toHaveAttribute('src', '/dalat.jpg');
  });

  it('applies className prop', () => {
    const {container} = render(
      <DestinationCard destination={destination} className="h-full" />,
    );
    expect(container.firstElementChild).toHaveClass('h-full');
  });
});
