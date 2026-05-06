import {render, screen} from '@/test-utils/render';
import userEvent from '@testing-library/user-event';
import {Modal} from './Modal';

describe('Modal', () => {
  it('renders nothing when open is false', () => {
    render(
      <Modal open={false} onClose={() => {}}>
        Content
      </Modal>,
    );
    expect(screen.queryByText('Content')).not.toBeInTheDocument();
  });

  it('renders children when open is true', () => {
    render(
      <Modal open={true} onClose={() => {}}>
        Content
      </Modal>,
    );
    expect(screen.getByText('Content')).toBeInTheDocument();
  });

  it('renders title when provided', () => {
    render(
      <Modal open={true} onClose={() => {}} title="Edit Tour">
        Body
      </Modal>,
    );
    expect(screen.getByText('Edit Tour')).toBeInTheDocument();
  });

  it('calls onClose when Escape is pressed', async () => {
    const user = userEvent.setup();
    const onClose = jest.fn();
    render(
      <Modal open={true} onClose={onClose}>
        Content
      </Modal>,
    );
    await user.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when backdrop is clicked', async () => {
    const user = userEvent.setup();
    const onClose = jest.fn();
    render(
      <Modal open={true} onClose={onClose}>
        Content
      </Modal>,
    );
    await user.click(screen.getByTestId('modal-backdrop'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('does not call onClose when modal content is clicked', async () => {
    const user = userEvent.setup();
    const onClose = jest.fn();
    render(
      <Modal open={true} onClose={onClose}>
        <button>Inner</button>
      </Modal>,
    );
    await user.click(screen.getByText('Inner'));
    expect(onClose).not.toHaveBeenCalled();
  });

  it('renders close button that calls onClose', async () => {
    const user = userEvent.setup();
    const onClose = jest.fn();
    render(
      <Modal open={true} onClose={onClose} title="Test">
        Content
      </Modal>,
    );
    await user.click(screen.getByLabelText('Close'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('renders footer when provided', () => {
    render(
      <Modal open={true} onClose={() => {}} footer={<button>Save</button>}>
        Body
      </Modal>,
    );
    expect(screen.getByText('Save')).toBeInTheDocument();
  });
});
