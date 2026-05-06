import {render, screen} from '@/test-utils/render';
import {Badge} from './Badge';

describe('Badge', () => {
  it('renders children', () => {
    render(<Badge>Draft</Badge>);
    expect(screen.getByText('Draft')).toBeInTheDocument();
  });

  it('defaults to neutral variant', () => {
    const {container} = render(<Badge>Info</Badge>);
    expect(container.firstChild).toHaveAttribute('data-variant', 'neutral');
  });

  it('sets data-variant for each variant', () => {
    const {container, rerender} = render(<Badge variant="success">OK</Badge>);
    expect(container.firstChild).toHaveAttribute('data-variant', 'success');

    rerender(<Badge variant="danger">Error</Badge>);
    expect(container.firstChild).toHaveAttribute('data-variant', 'danger');
  });

  it('sets data-size attribute', () => {
    const {container} = render(<Badge size="sm">Small</Badge>);
    expect(container.firstChild).toHaveAttribute('data-size', 'sm');
  });
});
