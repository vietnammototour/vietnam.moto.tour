import {render, screen} from '@/test-utils/render';
import {Footer} from './index';
import {contactInfo} from '@/utils';

describe('Footer', () => {
  it('renders the logo', () => {
    render(<Footer />);
    const logo = screen.getByAltText('Logo');
    expect(logo).toBeInTheDocument();
  });

  it('renders nav links with correct hrefs', () => {
    render(<Footer />);
    const toursLink = screen.getByText('tours').closest('a');
    expect(toursLink).toHaveAttribute('href', '/tours');

    const aboutLink = screen.getByText('aboutUs').closest('a');
    expect(aboutLink).toHaveAttribute('href', '/about-us');

    const contactLink = screen.getByText('contact').closest('a');
    expect(contactLink).toHaveAttribute('href', '/contact');
  });

  it('renders YouTube social link', () => {
    render(<Footer />);
    const ytLink = screen.getByLabelText('YouTube');
    expect(ytLink).toHaveAttribute('href', contactInfo.youtubeLink);
    expect(document.querySelector('.fa-youtube')).toBeInTheDocument();
  });

  it('renders TripAdvisor social link', () => {
    render(<Footer />);
    const taLink = screen.getByLabelText('TripAdvisor');
    expect(taLink).toHaveAttribute('href', contactInfo.tripadvisorLink);
    expect(document.querySelector('.fa-tripadvisor')).toBeInTheDocument();
  });

  it('renders WhatsApp social link', () => {
    render(<Footer />);
    const waLink = screen.getByLabelText('WhatsApp');
    expect(waLink).toHaveAttribute(
      'href',
      `https://wa.me/${contactInfo.whatsApp.replace(/[^0-9]/g, '')}`,
    );
    expect(document.querySelector('.fa-whatsapp')).toBeInTheDocument();
  });

  it('renders the phone number', () => {
    render(<Footer />);
    expect(screen.getByText(contactInfo.phone)).toBeInTheDocument();
  });

  it('renders the email', () => {
    render(<Footer />);
    expect(screen.getByText(contactInfo.email)).toBeInTheDocument();
  });

  it('renders phone link with tel: href', () => {
    render(<Footer />);
    const phoneLink = screen.getByText(contactInfo.phone).closest('a');
    expect(phoneLink).toHaveAttribute('href', `tel:${contactInfo.phone}`);
  });

  it('renders email link with mailto: href', () => {
    render(<Footer />);
    const emailLink = screen.getByText(contactInfo.email).closest('a');
    expect(emailLink).toHaveAttribute('href', `mailto:${contactInfo.email}`);
  });

  it('renders phone icon', () => {
    render(<Footer />);
    expect(document.querySelector('.fa-phone-alt')).toBeInTheDocument();
  });

  it('renders envelope icon', () => {
    render(<Footer />);
    expect(document.querySelector('.fa-envelope')).toBeInTheDocument();
  });

  it('renders copyright with year param', () => {
    render(<Footer />);
    const year = new Date().getFullYear();
    expect(
      screen.getByText(`copyright:{"year":${year}}`),
    ).toBeInTheDocument();
  });
});
