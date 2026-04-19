import {render, screen} from '@/test-utils/render';
import userEvent from '@testing-library/user-event';
import {GalleryItem} from './index';

describe('GalleryItem', () => {
  it('renders an image with the correct src', () => {
    render(<GalleryItem imageSrc="/gallery/test.jpg" delay={100} />);
    // Images have empty alt so they are role="presentation", query via tag
    const img = document.querySelector('img');
    expect(img).toHaveAttribute('src', '/gallery/test.jpg');
  });

  it('renders expand icon on hover area', () => {
    render(<GalleryItem imageSrc="/gallery/test.jpg" delay={100} />);
    const icon = document.querySelector('.fa-expand');
    expect(icon).toBeInTheDocument();
  });

  it('opens lightbox on click', async () => {
    const user = userEvent.setup();
    render(<GalleryItem imageSrc="/gallery/test.jpg" delay={100} />);
    const button = screen.getByRole('button');
    await user.click(button);
    const closeButton = screen.getByLabelText('Close lightbox');
    expect(closeButton).toBeInTheDocument();
    // Images have empty alt so they are role="presentation", query via tag
    const images = document.querySelectorAll('img');
    expect(images).toHaveLength(2);
  });

  it('closes lightbox when close button is clicked', async () => {
    const user = userEvent.setup();
    render(<GalleryItem imageSrc="/gallery/test.jpg" delay={100} />);
    await user.click(screen.getByRole('button'));
    await user.click(screen.getByLabelText('Close lightbox'));
    expect(screen.queryByLabelText('Close lightbox')).not.toBeInTheDocument();
  });
});
