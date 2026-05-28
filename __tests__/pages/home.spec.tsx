import {render, screen} from '@/test-utils/render';
import Home, {getServerSideProps} from '@/pages/index';

jest.mock('next-auth/next', () => ({
  getServerSession: jest.fn().mockResolvedValue(null),
}));

jest.mock('@/lib/auth', () => ({
  authOptions: {},
}));

jest.mock('@/data/queries', () => ({
  getAllTours: jest.fn().mockResolvedValue([]),
  getActiveDestinationsFromDb: jest.fn().mockResolvedValue([]),
  getMessagesFromDb: jest.fn().mockResolvedValue(null),
  getImageCollection: jest.fn().mockResolvedValue(null),
}));

const mockDestinations = [
  {
    id: 'dest-1',
    slug: 'nha-trang',
    name: {en: 'Nha Trang', vi: 'Nha Trang'},
    imageUrl: '/img/dest1.jpg',
    heroImage: '',
    size: 'large' as const,
    isActive: true,
    tourCount: 2,
    carOnlyCount: 0,
    bikeOnlyCount: 0,
    bikeAndCarCount: 0,
  },
  {
    id: 'dest-2',
    slug: 'dalat',
    name: {en: 'Dalat', vi: 'Dalat'},
    imageUrl: '/img/dest2.jpg',
    heroImage: '',
    size: 'small' as const,
    isActive: true,
    tourCount: 1,
    carOnlyCount: 0,
    bikeOnlyCount: 0,
    bikeAndCarCount: 0,
  },
  {
    id: 'dest-3',
    slug: 'mui-ne',
    name: {en: 'Mui Ne', vi: 'Mũi Né'},
    imageUrl: '/img/dest3.jpg',
    heroImage: '',
    size: 'small' as const,
    isActive: true,
    tourCount: 1,
    carOnlyCount: 0,
    bikeOnlyCount: 0,
    bikeAndCarCount: 0,
  },
  {
    id: 'dest-4',
    slug: 'quy-nhon',
    name: {en: 'Quy Nhon', vi: 'Quy Nhơn'},
    imageUrl: '/img/dest4.jpg',
    heroImage: '',
    size: 'small' as const,
    isActive: true,
    tourCount: 1,
    carOnlyCount: 0,
    bikeOnlyCount: 0,
    bikeAndCarCount: 0,
  },
  {
    id: 'dest-5',
    slug: 'hoi-an',
    name: {en: 'Hoi An', vi: 'Hội An'},
    imageUrl: '/img/dest5.jpg',
    heroImage: '',
    size: 'small' as const,
    isActive: true,
    tourCount: 1,
    carOnlyCount: 0,
    bikeOnlyCount: 0,
    bikeAndCarCount: 0,
  },
];

describe('Home page', () => {
  it('renders hero section with title and subtitle translation keys', () => {
    render(
      <Home
        tours={[]}
        destinations={mockDestinations}
        isAdmin={false}
        gallery={null}
        locale="en"
      />,
    );
    expect(screen.getByText('heroTitle')).toBeInTheDocument();
    expect(screen.getByText('heroSubtitle')).toBeInTheDocument();
  });

  it('renders destinations section heading', () => {
    render(
      <Home
        tours={[]}
        destinations={mockDestinations}
        isAdmin={false}
        gallery={null}
        locale="en"
      />,
    );
    expect(screen.getByText('destinationLists')).toBeInTheDocument();
    expect(screen.getByText('goExoticPlaces')).toBeInTheDocument();
  });

  it('renders about section heading', () => {
    render(
      <Home
        tours={[]}
        destinations={mockDestinations}
        isAdmin={false}
        gallery={null}
        locale="en"
      />,
    );
    expect(screen.getByText('getToKnowUs')).toBeInTheDocument();
    expect(screen.getByText('planYourTrip')).toBeInTheDocument();
  });

  it('renders about section bullet points', () => {
    render(
      <Home
        tours={[]}
        destinations={mockDestinations}
        isAdmin={false}
        gallery={null}
        locale="en"
      />,
    );
    expect(screen.getByText('bulletMotorbike')).toBeInTheDocument();
    expect(screen.getByText('bulletFriendly')).toBeInTheDocument();
    expect(screen.getByText('bulletExperience')).toBeInTheDocument();
  });

  it('renders popular tours section heading', () => {
    render(
      <Home
        tours={[]}
        destinations={mockDestinations}
        isAdmin={false}
        gallery={null}
        locale="en"
      />,
    );
    expect(screen.getByText('mostPopularTours')).toBeInTheDocument();
  });

  it('renders video/CTA section', () => {
    render(
      <Home
        tours={[]}
        destinations={mockDestinations}
        isAdmin={false}
        gallery={null}
        locale="en"
      />,
    );
    expect(screen.getByText('videoSectionHeading')).toBeInTheDocument();
  });

  it('renders value proposition cards', () => {
    render(
      <Home
        tours={[]}
        destinations={mockDestinations}
        isAdmin={false}
        gallery={null}
        locale="en"
      />,
    );
    expect(screen.getByText('localExperts')).toBeInTheDocument();
    expect(screen.getByText('hiddenRoutes')).toBeInTheDocument();
    expect(screen.getByText('yearsOnRoad')).toBeInTheDocument();
    expect(screen.getByText('dayAndMultiDay')).toBeInTheDocument();
    expect(screen.getByText('smallGroups')).toBeInTheDocument();
    expect(screen.getByText('allInclusive')).toBeInTheDocument();
  });

  it('renders play video button', () => {
    render(
      <Home
        tours={[]}
        destinations={mockDestinations}
        isAdmin={false}
        gallery={null}
        locale="en"
      />,
    );
    expect(screen.getByLabelText('watchFieldReport')).toBeInTheDocument();
  });

  it('renders gallery images', () => {
    const gallery = {
      images: Array.from({length: 5}).map((_, i) => ({
        id: `img-${i}`,
        url: `/uploads/x${i}.webp`,
        altEn: `alt en ${i}`,
        altVi: `alt vi ${i}`,
      })),
    };
    render(
      <Home
        tours={[]}
        destinations={mockDestinations}
        isAdmin={false}
        gallery={gallery}
        locale="en"
      />,
    );
    const galleryButtons = screen.getAllByRole('button');
    expect(galleryButtons.length).toBeGreaterThanOrEqual(6);
  });

  it('renders book with us CTA', () => {
    render(
      <Home
        tours={[]}
        destinations={mockDestinations}
        isAdmin={false}
        gallery={null}
        locale="en"
      />,
    );
    const ctaElements = screen.getAllByText('bookWithUsNow');
    expect(ctaElements.length).toBeGreaterThanOrEqual(1);
  });
});

describe('Home getServerSideProps', () => {
  it('returns messages for vi locale', async () => {
    const result = await getServerSideProps({
      locale: 'vi',
      req: {},
      res: {},
    } as never);
    expect(result).toHaveProperty('props.messages');
    expect(result.props.messages).toBeDefined();
  });

  it('returns messages for en locale', async () => {
    const result = await getServerSideProps({
      locale: 'en',
      req: {},
      res: {},
    } as never);
    expect(result).toHaveProperty('props.messages');
    expect(result.props.messages).toBeDefined();
  });
});
