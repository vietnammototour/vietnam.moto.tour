import {render, screen} from '@/test-utils/render';
import userEvent from '@testing-library/user-event';
import {TextInput} from './TextInput';

describe('TextInput', () => {
  it('renders an input element', () => {
    render(<TextInput />);
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('renders label when provided', () => {
    render(<TextInput label="Email" />);
    expect(screen.getByText('Email')).toBeInTheDocument();
  });

  it('renders error message', () => {
    render(<TextInput error="Required" />);
    expect(screen.getByText('Required')).toBeInTheDocument();
  });

  it('renders hint text', () => {
    render(<TextInput hint="Enter email" />);
    expect(screen.getByText('Enter email')).toBeInTheDocument();
  });

  it('accepts user input', async () => {
    const user = userEvent.setup();
    render(<TextInput />);
    const input = screen.getByRole('textbox');
    await user.type(input, 'hello');
    expect(input).toHaveValue('hello');
  });

  it('passes HTML attributes through (placeholder, disabled)', () => {
    render(<TextInput placeholder="Type here" disabled />);
    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('placeholder', 'Type here');
    expect(input).toBeDisabled();
  });

  it('works with react-hook-form register spread', () => {
    const mockRegister = {
      name: 'email',
      onChange: jest.fn(),
      onBlur: jest.fn(),
      ref: jest.fn(),
    };
    render(<TextInput {...mockRegister} label="Email" />);
    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('name', 'email');
  });
});
