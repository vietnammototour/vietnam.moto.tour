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

  it('calls onClose when overlay is clicked', async () => {
    const user = userEvent.setup();
    const onClose = jest.fn();
    render(<VideoModal {...defaultProps} isOpen={true} onClose={onClose} />);
    await user.click(screen.getByTestId('modal-backdrop'));
    expect(onClose).toHaveBeenCalled();
  });
});
