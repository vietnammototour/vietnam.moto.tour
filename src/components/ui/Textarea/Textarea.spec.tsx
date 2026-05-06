import {render, screen} from '@/test-utils/render';
import userEvent from '@testing-library/user-event';
import {Textarea} from './Textarea';

describe('Textarea', () => {
  it('renders a textarea element', () => {
    render(<Textarea />);
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('renders label when provided', () => {
    render(<Textarea label="Description" />);
    expect(screen.getByText('Description')).toBeInTheDocument();
  });

  it('renders error message', () => {
    render(<Textarea error="Too short" />);
    expect(screen.getByText('Too short')).toBeInTheDocument();
  });

  it('defaults to 4 rows', () => {
    render(<Textarea />);
    expect(screen.getByRole('textbox')).toHaveAttribute('rows', '4');
  });

  it('accepts custom rows', () => {
    render(<Textarea rows={8} />);
    expect(screen.getByRole('textbox')).toHaveAttribute('rows', '8');
  });

  it('accepts user input', async () => {
    const user = userEvent.setup();
    render(<Textarea />);
    await user.type(screen.getByRole('textbox'), 'hello');
    expect(screen.getByRole('textbox')).toHaveValue('hello');
  });
});
