import {render, screen} from '@/test-utils/render';
import Home, {getStaticProps} from '@/pages/index';

describe('Home page', () => {
  it('renders hero section with title and subtitle translation keys', () => {
    render(<Home />);
    expect(screen.getByText('heroTitle')).toBeInTheDocument();
    expect(screen.getByText('heroSubtitle')).toBeInTheDocument();
  });

  it('renders destinations section heading', () => {
    render(<Home />);
    expect(screen.getByText('destinationLists')).toBeInTheDocument();
    expect(screen.getByText('goExoticPlaces')).toBeInTheDocument();
  });

  it('renders about section heading', () => {
    render(<Home />);
    expect(screen.getByText('getToKnowUs')).toBeInTheDocument();
    expect(screen.getByText('planYourTrip')).toBeInTheDocument();
  });

  it('renders about section bullet points', () => {
    render(<Home />);
    expect(screen.getByText('bulletMotorbike')).toBeInTheDocument();
    expect(screen.getByText('bulletFriendly')).toBeInTheDocument();
    expect(screen.getByText('bulletExperience')).toBeInTheDocument();
  });

  it('renders popular tours section heading', () => {
    render(<Home />);
    expect(screen.getByText('featuredTours')).toBeInTheDocument();
    expect(screen.getByText('mostPopularTours')).toBeInTheDocument();
  });

  it('renders video/CTA section', () => {
    render(<Home />);
    expect(screen.getByText('readyToTravel')).toBeInTheDocument();
    expect(screen.getByText('videoSectionHeading')).toBeInTheDocument();
  });

  it('renders value proposition cards', () => {
    render(<Home />);
    expect(screen.getByText('localExperts')).toBeInTheDocument();
    expect(screen.getByText('hiddenRoutes')).toBeInTheDocument();
    expect(screen.getByText('yearsOnRoad')).toBeInTheDocument();
    expect(screen.getByText('dayAndMultiDay')).toBeInTheDocument();
    expect(screen.getByText('smallGroups')).toBeInTheDocument();
    expect(screen.getByText('allInclusive')).toBeInTheDocument();
  });

  it('renders play video button', () => {
    render(<Home />);
    expect(screen.getByLabelText('Play video')).toBeInTheDocument();
  });

  it('renders gallery images', () => {
    render(<Home />);
    const galleryButtons = screen.getAllByRole('button');
    expect(galleryButtons.length).toBeGreaterThanOrEqual(6);
  });

  it('renders book with us CTA', () => {
    render(<Home />);
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
