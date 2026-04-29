import {render, screen} from '@/test-utils/render';
import Home, {getStaticProps} from '@/pages/index';

jest.mock('@/data/queries', () => ({
  getAllTours: jest.fn().mockResolvedValue([]),
  getActiveDestinationsFromDb: jest.fn().mockResolvedValue([]),
}));

const mockDestinations = [
  {
    id: 1,
    name: 'Nha Trang',
    imageUrl: '/img/dest1.jpg',
    size: 'large' as const,
    tourCount: 2,
    hasCar: false,
    hasBike: true,
  },
  {
    id: 2,
    name: 'Dalat',
    imageUrl: '/img/dest2.jpg',
    size: 'small' as const,
    tourCount: 1,
    hasCar: true,
    hasBike: true,
  },
  {
    id: 3,
    name: 'Mui Ne',
    imageUrl: '/img/dest3.jpg',
    size: 'small' as const,
    tourCount: 1,
    hasCar: true,
    hasBike: false,
  },
  {
    id: 4,
    name: 'Quy Nhon',
    imageUrl: '/img/dest4.jpg',
    size: 'small' as const,
    tourCount: 1,
    hasCar: false,
    hasBike: true,
  },
  {
    id: 5,
    name: 'Hoi An',
    imageUrl: '/img/dest5.jpg',
    size: 'small' as const,
    tourCount: 1,
    hasCar: false,
    hasBike: true,
  },
];

describe('Home page', () => {
  it('renders hero section with title and subtitle translation keys', () => {
    render(<Home tours={[]} destinations={mockDestinations} />);
    expect(screen.getByText('heroTitle')).toBeInTheDocument();
    expect(screen.getByText('heroSubtitle')).toBeInTheDocument();
  });

  it('renders destinations section heading', () => {
    render(<Home tours={[]} destinations={mockDestinations} />);
    expect(screen.getByText('destinationLists')).toBeInTheDocument();
    expect(screen.getByText('goExoticPlaces')).toBeInTheDocument();
  });

  it('renders about section heading', () => {
    render(<Home tours={[]} destinations={mockDestinations} />);
    expect(screen.getByText('getToKnowUs')).toBeInTheDocument();
    expect(screen.getByText('planYourTrip')).toBeInTheDocument();
  });

  it('renders about section bullet points', () => {
    render(<Home tours={[]} destinations={mockDestinations} />);
    expect(screen.getByText('bulletMotorbike')).toBeInTheDocument();
    expect(screen.getByText('bulletFriendly')).toBeInTheDocument();
    expect(screen.getByText('bulletExperience')).toBeInTheDocument();
  });

  it('renders popular tours section heading', () => {
    render(<Home tours={[]} destinations={mockDestinations} />);
    expect(screen.getByText('featuredTours')).toBeInTheDocument();
    expect(screen.getByText('mostPopularTours')).toBeInTheDocument();
  });

  it('renders video/CTA section', () => {
    render(<Home tours={[]} destinations={mockDestinations} />);
    expect(screen.getByText('readyToTravel')).toBeInTheDocument();
    expect(screen.getByText('videoSectionHeading')).toBeInTheDocument();
  });

  it('renders value proposition cards', () => {
    render(<Home tours={[]} destinations={mockDestinations} />);
    expect(screen.getByText('localExperts')).toBeInTheDocument();
    expect(screen.getByText('hiddenRoutes')).toBeInTheDocument();
    expect(screen.getByText('yearsOnRoad')).toBeInTheDocument();
    expect(screen.getByText('dayAndMultiDay')).toBeInTheDocument();
    expect(screen.getByText('smallGroups')).toBeInTheDocument();
    expect(screen.getByText('allInclusive')).toBeInTheDocument();
  });

  it('renders play video button', () => {
    render(<Home tours={[]} destinations={mockDestinations} />);
    expect(screen.getByLabelText('Play video')).toBeInTheDocument();
  });

  it('renders gallery images', () => {
    render(<Home tours={[]} destinations={mockDestinations} />);
    const galleryButtons = screen.getAllByRole('button');
    expect(galleryButtons.length).toBeGreaterThanOrEqual(6);
  });

  it('renders book with us CTA', () => {
    render(<Home tours={[]} destinations={mockDestinations} />);
    expect(screen.getByText('bookWithUsNow')).toBeInTheDocument();
  });
});

describe('Home getStaticProps', () => {
  it('returns messages for vi locale', async () => {
    const result = await getStaticProps({locale: 'vi'} as never);
    expect(result).toHaveProperty('props.messages');
    expect(result.props.messages).toBeDefined();
  });

  it('returns messages for en locale', async () => {
    const result = await getStaticProps({locale: 'en'} as never);
    expect(result).toHaveProperty('props.messages');
    expect(result.props.messages).toBeDefined();
  });
});
