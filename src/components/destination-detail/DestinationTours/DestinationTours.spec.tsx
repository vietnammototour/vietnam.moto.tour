import {render, screen} from '@testing-library/react';
import {DestinationTours} from './DestinationTours';

jest.mock('@/components/TourCard', () => ({
  TourCard: ({tour}: {tour: {id: string}}) => (
    <div data-testid="tour-card">{tour.id}</div>
  ),
}));

const tour = (id: string) => ({id}) as never;

describe('DestinationTours', () => {
  it('renders a TourCard per tour', () => {
    render(
      <DestinationTours
        tours={[tour('1'), tour('2')]}
        destinationName="Da Lat"
      />,
    );
    expect(screen.getAllByTestId('tour-card')).toHaveLength(2);
  });

  it('renders the destination-aware title key', () => {
    render(<DestinationTours tours={[tour('1')]} destinationName="Da Lat" />);
    expect(
      screen.getByText('toursTitle:{"name":"Da Lat"}'),
    ).toBeInTheDocument();
  });

  it('renders empty state when no tours', () => {
    render(<DestinationTours tours={[]} destinationName="Da Lat" />);
    expect(screen.getByText('noTours')).toBeInTheDocument();
  });
});
