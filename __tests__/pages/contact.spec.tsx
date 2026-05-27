import {render, screen} from '@/test-utils/render';
import Contact, {getStaticProps} from '@/pages/contact';
import {contactInfo} from '@/utils';

jest.mock('@/data/queries', () => ({
  getMessagesFromDb: jest.fn().mockResolvedValue(null),
}));

describe('Contact page', () => {
  it('renders meta title translation key', () => {
    render(<Contact />);
    expect(document.title).toBe('contactTitle');
  });

  it('renders page header with title', () => {
    render(<Contact />);
    expect(screen.getByText('title')).toBeInTheDocument();
  });

  it('renders breadcrumbs', () => {
    render(<Contact />);
    expect(screen.getByText('breadcrumbHome')).toBeInTheDocument();
    expect(screen.getByText('breadcrumbContact')).toBeInTheDocument();
  });

  it('renders contact form fields', () => {
    render(<Contact />);
    expect(screen.getByPlaceholderText('namePlaceholder')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('emailPlaceholder')).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText('messagePlaceholder'),
    ).toBeInTheDocument();
  });

  it('renders send message button', () => {
    render(<Contact />);
    expect(screen.getByText('sendMessage')).toBeInTheDocument();
  });

  it('renders talk with team heading', () => {
    render(<Contact />);
    expect(screen.getByText('talkWithTeam')).toBeInTheDocument();
    expect(screen.getByText('anyQuestion')).toBeInTheDocument();
  });

  it('renders contact info: address', () => {
    render(<Contact />);
    expect(screen.getByText(contactInfo.address)).toBeInTheDocument();
  });

  it('renders contact info: phone', () => {
    render(<Contact />);
    expect(screen.getByText(contactInfo.phone)).toBeInTheDocument();
  });

  it('renders contact info: email', () => {
    render(<Contact />);
    expect(screen.getByText(contactInfo.email)).toBeInTheDocument();
  });

  it('renders social media icons', () => {
    render(<Contact />);
    expect(document.querySelector('.fa-youtube')).toBeInTheDocument();
    expect(document.querySelector('.fa-tripadvisor')).toBeInTheDocument();
    expect(document.querySelector('.fa-whatsapp')).toBeInTheDocument();
  });

  it('renders the location map embed', () => {
    render(<Contact />);
    const mapFrame = screen.getByTitle('Nha Trang location map');
    expect(mapFrame).toBeInTheDocument();
  });
});

describe('Contact getStaticProps', () => {
  it('returns messages for vi locale', async () => {
    const result = await getStaticProps({locale: 'vi'} as never);
    expect(result).toHaveProperty('props.messages');
  });
});
