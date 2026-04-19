import {render, screen} from '@/test-utils/render';
import userEvent from '@testing-library/user-event';
import {VideoModal} from './index';

describe('VideoModal', () => {
  const defaultProps = {
    videoUrl: 'https://www.youtube.com/watch?v=abc123',
    isOpen: false,
    onClose: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders nothing when isOpen is false', () => {
    const {container} = render(<VideoModal {...defaultProps} />);
    expect(container.innerHTML).toBe('');
  });

  it('renders iframe with embed URL when isOpen is true', () => {
    render(<VideoModal {...defaultProps} isOpen={true} />);
    const iframe = screen.getByTitle('Video');
    expect(iframe).toHaveAttribute(
      'src',
      'https://www.youtube.com/embed/abc123?autoplay=1',
    );
  });

  it('renders close button with correct aria-label', () => {
    render(<VideoModal {...defaultProps} isOpen={true} />);
    expect(screen.getByLabelText('Close video')).toBeInTheDocument();
  });

  it('renders close icon (fa-times)', () => {
    render(<VideoModal {...defaultProps} isOpen={true} />);
    const icon = document.querySelector('.fa-times');
    expect(icon).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', async () => {
    const user = userEvent.setup();
    const onClose = jest.fn();
    render(<VideoModal {...defaultProps} isOpen={true} onClose={onClose} />);
    await user.click(screen.getByLabelText('Close video'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when overlay is clicked', async () => {
    const user = userEvent.setup();
    const onClose = jest.fn();
    const {container} = render(
      <VideoModal {...defaultProps} isOpen={true} onClose={onClose} />,
    );
    const overlay = container.firstElementChild!;
    await user.click(overlay);
    expect(onClose).toHaveBeenCalled();
  });
});
