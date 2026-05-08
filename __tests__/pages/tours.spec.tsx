import {render, screen} from '@/test-utils/render';
import Tours, {getServerSideProps} from '@/pages/tours';
import {buildTour} from '@/test-utils/factories';

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

const sampleTours = [
  buildTour({
    title: {en: 'Da Lat Tour', vi: 'Da Lat Tour'},
    slug: 'da-lat-tour',
  }),
  buildTour({
    title: {en: 'Hoi An Tour', vi: 'Hoi An Tour'},
    slug: 'hoi-an-tour',
    id: 'tour-2',
  }),
];

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
    render(<Tours allTours={sampleTours} isAdmin={false} />);
    for (const tour of sampleTours) {
      expect(screen.getByText(tour.title.en)).toBeInTheDocument();
    }
  });

  it('renders correct number of tour cards', () => {
    render(<Tours allTours={sampleTours} isAdmin={false} />);
    const prices = screen.getAllByText('priceUnitVehicle');
    expect(prices).toHaveLength(sampleTours.length);
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
