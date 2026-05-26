import {render, screen} from '@/test-utils/render';
import userEvent from '@testing-library/user-event';
import {Button} from './Button';

describe('Button', () => {
  it('renders children as button text', () => {
    render(<Button>Submit</Button>);
    expect(screen.getByRole('button', {name: 'Submit'})).toBeInTheDocument();
  });

  it('calls onClick when clicked', async () => {
    const user = userEvent.setup();
    const onClick = jest.fn();
    render(<Button onClick={onClick}>Click</Button>);
    await user.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('does not call onClick when disabled', async () => {
    const user = userEvent.setup();
    const onClick = jest.fn();
    render(
      <Button onClick={onClick} disabled>
        Click
      </Button>,
    );
    await user.click(screen.getByRole('button'));
    expect(onClick).not.toHaveBeenCalled();
  });

  it('defaults to type button', () => {
    render(<Button>Go</Button>);
    expect(screen.getByRole('button')).toHaveAttribute('type', 'button');
  });

  it('passes type prop through', () => {
    render(<Button type="submit">Go</Button>);
    expect(screen.getByRole('button')).toHaveAttribute('type', 'submit');
  });

  it('renders loading state with aria-busy', () => {
    render(<Button loading>Save</Button>);
    expect(screen.getByRole('button')).toHaveAttribute('aria-busy', 'true');
  });

  it('is disabled when loading', () => {
    render(<Button loading>Save</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('renders icon when provided', () => {
    render(<Button icon={<i data-testid="icon" />}>Text</Button>);
    expect(screen.getByTestId('icon')).toBeInTheDocument();
    expect(screen.getByText('Text')).toBeInTheDocument();
  });

  it('renders iconOnly mode with aria-label', () => {
    render(
      <Button iconOnly aria-label="Scroll up">
        <i data-testid="arrow" />
      </Button>,
    );
    expect(screen.getByRole('button', {name: 'Scroll up'})).toBeInTheDocument();
  });

  it('renders primary variant by default', () => {
    render(<Button>Save</Button>);
    expect(screen.getByRole('button', {name: 'Save'})).toBeInTheDocument();
  });

  it('renders danger variant', () => {
    render(<Button variant="danger">Delete</Button>);
    expect(screen.getByRole('button', {name: 'Delete'})).toBeInTheDocument();
  });

  it('renders secondary variant', () => {
    render(<Button variant="secondary">Edit</Button>);
    expect(screen.getByRole('button', {name: 'Edit'})).toBeInTheDocument();
  });

  it('renders link variant', () => {
    render(<Button variant="link">More</Button>);
    expect(screen.getByRole('button', {name: 'More'})).toBeInTheDocument();
  });
});
