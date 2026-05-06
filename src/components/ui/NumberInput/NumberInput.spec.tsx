import {render, screen} from '@/test-utils/render';
import {NumberInput} from './NumberInput';

describe('NumberInput', () => {
  it('renders an input with type number', () => {
    render(<NumberInput />);
    expect(screen.getByRole('spinbutton')).toBeInTheDocument();
  });

  it('renders label', () => {
    render(<NumberInput label="Price" />);
    expect(screen.getByText('Price')).toBeInTheDocument();
  });

  it('renders error message', () => {
    render(<NumberInput error="Must be positive" />);
    expect(screen.getByText('Must be positive')).toBeInTheDocument();
  });

  it('passes min, max, step as HTML attributes', () => {
    render(<NumberInput min={0} max={100} step={5} />);
    const input = screen.getByRole('spinbutton');
    expect(input).toHaveAttribute('min', '0');
    expect(input).toHaveAttribute('max', '100');
    expect(input).toHaveAttribute('step', '5');
  });

  it('passes through additional props', () => {
    render(<NumberInput placeholder="0" disabled />);
    const input = screen.getByRole('spinbutton');
    expect(input).toHaveAttribute('placeholder', '0');
    expect(input).toBeDisabled();
  });
});
