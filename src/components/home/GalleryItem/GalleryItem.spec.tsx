import {render, screen} from '@/test-utils/render';
import userEvent from '@testing-library/user-event';
import {GalleryItem} from './GalleryItem';

describe('GalleryItem', () => {
  it('renders an image with the correct src', () => {
    render(
      <GalleryItem
        imageSrc="/gallery/test.jpg"
        alt="Test gallery image"
        delay={100}
      />,
    );
    const img = screen.getByAltText('Test gallery image');
    expect(img).toHaveAttribute('src', '/gallery/test.jpg');
  });

  it('renders expand icon on hover area', () => {
    render(
      <GalleryItem
        imageSrc="/gallery/test.jpg"
        alt="Test gallery image"
        delay={100}
      />,
    );
    const icon = document.querySelector('.fa-expand');
    expect(icon).toBeInTheDocument();
  });

  it('opens lightbox on click', async () => {
    const user = userEvent.setup();
    render(
      <GalleryItem
        imageSrc="/gallery/test.jpg"
        alt="Test gallery image"
        delay={100}
      />,
    );
    const button = screen.getByRole('button', {name: 'Test gallery image'});
    await user.click(button);
    const closeButton = screen.getByLabelText('close');
    expect(closeButton).toBeInTheDocument();
    const images = document.querySelectorAll('img');
    expect(images).toHaveLength(2);
  });

  it('closes lightbox when close button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <GalleryItem
        imageSrc="/gallery/test.jpg"
        alt="Test gallery image"
        delay={100}
      />,
    );
    await user.click(screen.getByRole('button', {name: 'Test gallery image'}));
    await user.click(screen.getByLabelText('close'));
    expect(screen.queryByLabelText('close')).not.toBeInTheDocument();
  });
});
