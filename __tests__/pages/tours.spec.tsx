import {render, screen} from '@/test-utils/render';
import Tours, {getStaticProps} from '@/pages/tours';
import {toursData} from '@/data';

describe('Tours page', () => {
  it('renders meta title translation key', () => {
    render(<Tours />);
    expect(document.title).toBe('toursTitle');
  });

  it('renders page header with title translation key', () => {
    render(<Tours />);
    expect(screen.getByText('title')).toBeInTheDocument();
  });

  it('renders breadcrumbs', () => {
    render(<Tours />);
    expect(screen.getByText('breadcrumbHome')).toBeInTheDocument();
    expect(screen.getByText('breadcrumbTours')).toBeInTheDocument();
  });

  it('renders a TourCard for each tour in data', () => {
    render(<Tours />);
    for (const tour of toursData) {
      expect(screen.getByText(tour.title)).toBeInTheDocument();
    }
  });

  it('renders correct number of tour cards', () => {
    render(<Tours />);
    const prices = screen.getAllByText('perPerson');
    expect(prices).toHaveLength(toursData.length);
  });
});

describe('Tours getStaticProps', () => {
  it('returns messages for vi locale', async () => {
    const result = await getStaticProps({locale: 'vi'} as never);
    expect(result).toHaveProperty('props.messages');
  });
});
