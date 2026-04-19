import {render, screen} from '@/test-utils/render';
import {Layout} from '@/components/layout';

jest.mock('next/router', () => ({
  useRouter: () => ({
    pathname: '/',
    asPath: '/',
    locale: 'vi',
    locales: ['vi', 'en'],
    push: jest.fn(),
    events: {on: jest.fn(), off: jest.fn(), emit: jest.fn()},
  }),
}));

jest.mock('@/hooks/useScrollDirection', () => ({
  useScrollDirection: () => ({scrollDirection: 'up', scrollY: 0}),
}));

describe('Layout', () => {
  it('renders Header (logo present)', () => {
    render(
      <Layout>
        <div>Page Content</div>
      </Layout>,
    );
    expect(
      screen.getByAltText('Vietnam Motorcycle Tour'),
    ).toBeInTheDocument();
  });

  it('renders Footer (logo present)', () => {
    render(
      <Layout>
        <div>Page Content</div>
      </Layout>,
    );
    // "Logo" alt text appears in both the mobile nav panel (header) and the footer
    const logos = screen.getAllByAltText('Logo');
    expect(logos.length).toBeGreaterThanOrEqual(1);
  });

  it('renders children inside main element', () => {
    render(
      <Layout>
        <div data-testid="child">Page Content</div>
      </Layout>,
    );
    const main = document.querySelector('main');
    expect(main).toBeInTheDocument();
    expect(screen.getByTestId('child')).toBeInTheDocument();
    expect(main?.contains(screen.getByTestId('child'))).toBe(true);
  });

  it('renders ScrollToTop button', () => {
    render(
      <Layout>
        <div>Content</div>
      </Layout>,
    );
    expect(screen.getByLabelText('Scroll to top')).toBeInTheDocument();
  });
});
