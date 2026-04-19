import {render, screen} from '@/test-utils/render';
import AboutUs, {getStaticProps} from '@/pages/about-us';

describe('AboutUs page', () => {
  it('renders meta title translation key', () => {
    render(<AboutUs />);
    expect(document.title).toBe('aboutTitle');
  });

  it('renders page header with title', () => {
    render(<AboutUs />);
    expect(screen.getByText('title')).toBeInTheDocument();
  });

  it('renders breadcrumbs', () => {
    render(<AboutUs />);
    expect(screen.getByText('breadcrumbHome')).toBeInTheDocument();
    expect(screen.getByText('breadcrumbPages')).toBeInTheDocument();
    expect(screen.getByText('breadcrumbAbout')).toBeInTheDocument();
  });

  it('renders about section heading keys', () => {
    render(<AboutUs />);
    expect(screen.getByText('learnAboutUs')).toBeInTheDocument();
    expect(screen.getByText('dareToExplore')).toBeInTheDocument();
    expect(screen.getByText('perfectPlace')).toBeInTheDocument();
  });

  it('renders progress bars with labels', () => {
    render(<AboutUs />);
    expect(screen.getByText('bestServices')).toBeInTheDocument();
    expect(screen.getByText('tourAgents')).toBeInTheDocument();
    expect(screen.getByText('77%')).toBeInTheDocument();
    expect(screen.getByText('38%')).toBeInTheDocument();
  });

  it('renders CTA section', () => {
    render(<AboutUs />);
    expect(screen.getByText('readyForTour')).toBeInTheDocument();
    expect(screen.getByText('bookTourNow')).toBeInTheDocument();
  });

  it('renders stats section', () => {
    render(<AboutUs />);
    expect(screen.getByText('870+')).toBeInTheDocument();
    expect(screen.getByText('totalTours')).toBeInTheDocument();
    expect(screen.getByText('480+')).toBeInTheDocument();
    expect(screen.getByText('happyRiders')).toBeInTheDocument();
  });

  it('renders play video button', () => {
    render(<AboutUs />);
    expect(screen.getByLabelText('Play video')).toBeInTheDocument();
  });
});

describe('AboutUs getStaticProps', () => {
  it('returns messages for vi locale', async () => {
    const result = await getStaticProps({locale: 'vi'} as never);
    expect(result).toHaveProperty('props.messages');
  });
});
