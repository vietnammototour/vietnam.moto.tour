import {render, screen} from '@/test-utils/render';
import {PageHeader} from './index';

describe('PageHeader', () => {
  const defaultProps = {
    title: 'Test Title',
    breadcrumbs: [
      {label: 'Home', href: '/'},
      {label: 'Pages'},
      {label: 'Current'},
    ],
    backgroundImage: '/test-bg.jpg',
  };

  it('renders the title', () => {
    render(<PageHeader {...defaultProps} />);
    expect(screen.getByText('Test Title')).toBeInTheDocument();
  });

  it('renders breadcrumb labels', () => {
    render(<PageHeader {...defaultProps} />);
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Pages')).toBeInTheDocument();
    expect(screen.getByText('Current')).toBeInTheDocument();
  });

  it('renders breadcrumb links with correct href', () => {
    render(<PageHeader {...defaultProps} />);
    const homeLink = screen.getByText('Home').closest('a');
    expect(homeLink).toHaveAttribute('href', '/');
  });

  it('renders non-link breadcrumbs as spans', () => {
    render(<PageHeader {...defaultProps} />);
    const pages = screen.getByText('Pages');
    expect(pages.tagName).toBe('SPAN');
    expect(pages.closest('a')).toBeNull();
  });

  it('renders breadcrumb separators between items', () => {
    render(<PageHeader {...defaultProps} />);
    const separators = screen.getAllByText('/');
    expect(separators).toHaveLength(2);
  });
});
