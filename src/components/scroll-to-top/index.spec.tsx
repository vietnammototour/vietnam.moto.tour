import {render, screen} from '@/test-utils/render';
import userEvent from '@testing-library/user-event';
import {ScrollToTop} from './index';

let mockScrollY = 0;
jest.mock('@/hooks/useScrollDirection', () => ({
  useScrollDirection: () => ({
    scrollDirection: 'up' as const,
    scrollY: mockScrollY,
  }),
}));

describe('ScrollToTop', () => {
  beforeEach(() => {
    mockScrollY = 0;
    window.scrollTo = jest.fn();
  });

  it('renders button with correct aria-label', () => {
    render(<ScrollToTop />);
    expect(screen.getByLabelText('Scroll to top')).toBeInTheDocument();
  });

  it('renders arrow-up icon', () => {
    render(<ScrollToTop />);
    const icon = document.querySelector('.fa-arrow-up');
    expect(icon).toBeInTheDocument();
  });

  it('has pointer-events-none class when scrollY is below 400', () => {
    mockScrollY = 100;
    render(<ScrollToTop />);
    const button = screen.getByLabelText('Scroll to top');
    expect(button.className).toContain('pointer-events-none');
  });

  it('does not have pointer-events-none class when scrollY exceeds 400', () => {
    mockScrollY = 500;
    render(<ScrollToTop />);
    const button = screen.getByLabelText('Scroll to top');
    expect(button.className).not.toContain('pointer-events-none');
  });

  it('calls window.scrollTo on click', async () => {
    mockScrollY = 500;
    const user = userEvent.setup();
    render(<ScrollToTop />);
    await user.click(screen.getByLabelText('Scroll to top'));
    expect(window.scrollTo).toHaveBeenCalledWith({
      top: 0,
      behavior: 'smooth',
    });
  });
});
