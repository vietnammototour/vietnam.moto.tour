import {render, screen} from '@/test-utils/render';
import userEvent from '@testing-library/user-event';
import {Header} from './index';
import {useRouter} from 'next/router';

jest.mock('next/router', () => ({
  useRouter: jest.fn(),
}));

jest.mock('@/hooks/useScrollDirection', () => ({
  useScrollDirection: () => ({scrollDirection: 'up', scrollY: 0}),
}));

describe('Header', () => {
  beforeEach(() => {
    (useRouter as jest.Mock).mockReturnValue({
      pathname: '/',
      asPath: '/',
      locale: 'vi',
      locales: ['vi', 'en'],
      push: jest.fn(),
      events: {on: jest.fn(), off: jest.fn(), emit: jest.fn()},
    });
  });

  it('renders the logo', () => {
    render(<Header />);
    const logo = screen.getByAltText('Vietnam Motorcycle Tour');
    expect(logo).toBeInTheDocument();
  });

  it('renders Home nav link', () => {
    render(<Header />);
    expect(screen.getAllByText('home').length).toBeGreaterThanOrEqual(1);
  });

  it('renders Tours nav link', () => {
    render(<Header />);
    expect(screen.getAllByText('tours').length).toBeGreaterThanOrEqual(1);
  });

  it('renders About Us nav link', () => {
    render(<Header />);
    expect(screen.getAllByText('aboutUs').length).toBeGreaterThanOrEqual(1);
  });

  it('renders Contact nav link', () => {
    render(<Header />);
    expect(screen.getAllByText('contact').length).toBeGreaterThanOrEqual(1);
  });

  it('marks active link with text-primary when on home page', () => {
    render(<Header />);
    const homeLinks = screen.getAllByText('home');
    const desktopLink = homeLinks[0].closest('a');
    expect(desktopLink?.className).toContain('text-primary');
  });

  it('marks tours link active when on /tours', () => {
    (useRouter as jest.Mock).mockReturnValue({
      pathname: '/tours',
      asPath: '/tours',
      locale: 'vi',
      locales: ['vi', 'en'],
      push: jest.fn(),
      events: {on: jest.fn(), off: jest.fn(), emit: jest.fn()},
    });
    render(<Header />);
    const toursLinks = screen.getAllByText('tours');
    const desktopLink = toursLinks[0].closest('a');
    expect(desktopLink?.className).toContain('text-primary');
  });

  it('renders YouTube social link in top bar', () => {
    render(<Header />);
    const icons = document.querySelectorAll('.fa-youtube');
    expect(icons.length).toBeGreaterThanOrEqual(1);
  });

  it('renders TripAdvisor social link in top bar', () => {
    render(<Header />);
    const icons = document.querySelectorAll('.fa-tripadvisor');
    expect(icons.length).toBeGreaterThanOrEqual(1);
  });

  it('renders WhatsApp social link in top bar', () => {
    render(<Header />);
    const icons = document.querySelectorAll('.fa-whatsapp');
    expect(icons.length).toBeGreaterThanOrEqual(1);
  });

  it('renders mobile menu button with aria-label', () => {
    render(<Header />);
    expect(screen.getByLabelText('Open menu')).toBeInTheDocument();
  });

  it('opens mobile menu on button click', async () => {
    const user = userEvent.setup();
    render(<Header />);
    await user.click(screen.getByLabelText('Open menu'));
    expect(screen.getByLabelText('Close menu')).toBeInTheDocument();
  });

  it('closes mobile menu on close button click', async () => {
    const user = userEvent.setup();
    render(<Header />);
    await user.click(screen.getByLabelText('Open menu'));
    await user.click(screen.getByLabelText('Close menu'));
    const closeIcon = screen.queryByLabelText('Close menu');
    expect(closeIcon).toBeInTheDocument();
  });

  it('renders LanguageSwitcher', () => {
    render(<Header />);
    expect(screen.getAllByText('VI').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('EN').length).toBeGreaterThanOrEqual(1);
  });
});
