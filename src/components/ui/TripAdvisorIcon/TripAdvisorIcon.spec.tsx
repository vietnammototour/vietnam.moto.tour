import {render} from '@/test-utils/render';
import {TripAdvisorIcon} from './TripAdvisorIcon';

describe('TripAdvisorIcon', () => {
  it('renders an svg with currentColor fill', () => {
    const {container} = render(<TripAdvisorIcon />);
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute('fill', 'currentColor');
  });

  it('forwards props to the svg element', () => {
    const {container} = render(<TripAdvisorIcon data-testid="ta" />);
    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('data-testid', 'ta');
  });

  it('is hidden from assistive tech by default', () => {
    const {container} = render(<TripAdvisorIcon />);
    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('aria-hidden', 'true');
    expect(svg).toHaveAttribute('focusable', 'false');
  });
});
