import {render, screen, act} from '@testing-library/react';
import {Avatar} from './Avatar';

describe('Avatar', () => {
  it('renders the image when src is provided', () => {
    render(<Avatar src="https://example.com/a.jpg" name="Jane Doe" />);
    const img = screen.getByRole('img');
    expect(img).toHaveAttribute('src', expect.stringContaining('example.com'));
  });

  it('renders initials when src is null', () => {
    render(<Avatar src={null} name="Jane Doe" />);
    expect(screen.getByText('JD')).toBeInTheDocument();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('derives a single initial from a one-word name', () => {
    render(<Avatar src={null} name="Wentris" />);
    expect(screen.getByText('W')).toBeInTheDocument();
  });

  it('falls back to initials after the image errors', () => {
    render(<Avatar src="https://example.com/broken.jpg" name="Jane Doe" />);
    const img = screen.getByRole('img');
    act(() => {
      img.dispatchEvent(new Event('error', {bubbles: true}));
    });
    expect(screen.getByText('JD')).toBeInTheDocument();
  });
});
