import {render, screen} from '@/test-utils/render';
import Tours, {getServerSideProps} from '@/pages/tours';
import {toursData} from '@/data';

jest.mock('next-auth/next', () => ({
  getServerSession: jest.fn().mockResolvedValue(null),
}));

jest.mock('@/lib/auth', () => ({
  authOptions: {},
}));

jest.mock('@/data/queries', () => ({
  getAllTours: jest.fn().mockResolvedValue([]),
  getMessagesFromDb: jest.fn().mockResolvedValue(null),
}));

describe('Tours page', () => {
  it('renders meta title translation key', () => {
    render(<Tours allTours={[]} isAdmin={false} />);
    expect(document.title).toBe('toursTitle');
  });

  it('renders page header with title translation key', () => {
    render(<Tours allTours={[]} isAdmin={false} />);
    expect(screen.getByText('title')).toBeInTheDocument();
  });

  it('renders breadcrumbs', () => {
    render(<Tours allTours={[]} isAdmin={false} />);
    expect(screen.getByText('breadcrumbHome')).toBeInTheDocument();
    expect(screen.getByText('breadcrumbTours')).toBeInTheDocument();
  });

  it('renders a TourCard for each tour in data', () => {
    render(<Tours allTours={toursData} isAdmin={false} />);
    for (const tour of toursData) {
      expect(screen.getByText(tour.title)).toBeInTheDocument();
    }
  });

  it('renders correct number of tour cards', () => {
    render(<Tours allTours={toursData} isAdmin={false} />);
    const prices = screen.getAllByText('perPerson');
    expect(prices).toHaveLength(toursData.length);
  });
});

describe('Tours getServerSideProps', () => {
  it('returns messages for vi locale', async () => {
    const result = await getServerSideProps({
      locale: 'vi',
      req: {},
      res: {},
    } as never);
    expect(result).toHaveProperty('props.messages');
  });
});
