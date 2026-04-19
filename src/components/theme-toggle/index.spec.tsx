import {render, screen} from '@/test-utils/render';
import userEvent from '@testing-library/user-event';
import ThemeToggle from './index';

describe('ThemeToggle', () => {
  it('renders the label translation key', () => {
    render(<ThemeToggle />);
    expect(screen.getByText('label')).toBeInTheDocument();
  });

  it('renders a switch role element', () => {
    render(<ThemeToggle />);
    expect(screen.getByRole('switch')).toBeInTheDocument();
  });

  it('starts with aria-checked false (light mode)', () => {
    render(<ThemeToggle />);
    expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'false');
  });

  it('has aria-label with light translation key in light mode', () => {
    render(<ThemeToggle />);
    expect(screen.getByRole('switch')).toHaveAttribute('aria-label', 'light');
  });

  it('toggles to dark mode on click', async () => {
    const user = userEvent.setup();
    render(<ThemeToggle />);
    await user.click(screen.getByRole('switch'));
    expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByRole('switch')).toHaveAttribute('aria-label', 'dark');
  });

  it('renders sun symbol', () => {
    const {container} = render(<ThemeToggle />);
    expect(container.textContent).toContain('\u2600');
  });

  it('renders moon symbol', () => {
    const {container} = render(<ThemeToggle />);
    expect(container.textContent).toContain('\u263E');
  });
});
