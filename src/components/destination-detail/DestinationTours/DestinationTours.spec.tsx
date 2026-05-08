import {render, screen} from '@testing-library/react';
import {NextIntlClientProvider} from 'next-intl';
import {DestinationTours} from './DestinationTours';

jest.mock('@/components/TourCard', () => ({
  TourCard: ({tour}: {tour: {id: string}}) => (
    <div data-testid="tour-card">{tour.id}</div>
  ),
}));

const messages = {
  destinationDetail: {
    toursTitle: 'Tours',
    noTours: 'No tours yet',
  },
};

function wrap(ui: React.ReactNode) {
  return (
    <NextIntlClientProvider locale="en" messages={messages}>
      {ui}
    </NextIntlClientProvider>
  );
}

const tour = (id: string) => ({id}) as never;

describe('DestinationTours', () => {
  it('renders a TourCard per tour', () => {
    render(wrap(<DestinationTours tours={[tour('1'), tour('2')]} />));
    expect(screen.getAllByTestId('tour-card')).toHaveLength(2);
  });

  it('renders empty state when no tours', () => {
    render(wrap(<DestinationTours tours={[]} />));
    expect(screen.getByText('noTours')).toBeInTheDocument();
  });
});
