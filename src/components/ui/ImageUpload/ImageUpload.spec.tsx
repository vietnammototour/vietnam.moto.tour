import {render, screen} from '@/test-utils/render';
import userEvent from '@testing-library/user-event';
import {ImageUpload} from './ImageUpload';

describe('ImageUpload', () => {
  it('renders upload button when no value', () => {
    render(<ImageUpload onChange={() => {}} />);
    expect(screen.getByText('Click to upload')).toBeInTheDocument();
  });

  it('renders image preview when value is provided', () => {
    render(<ImageUpload value="/test.jpg" onChange={() => {}} />);
    expect(screen.getByAltText('Upload preview')).toHaveAttribute(
      'src',
      '/test.jpg',
    );
  });

  it('renders label when provided', () => {
    render(<ImageUpload label="Card Image" onChange={() => {}} />);
    expect(screen.getByText('Card Image')).toBeInTheDocument();
  });

  it('renders error message', () => {
    render(<ImageUpload error="File too large" onChange={() => {}} />);
    expect(screen.getByText('File too large')).toBeInTheDocument();
  });

  it('calls onChange with file when file is selected', async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();
    render(<ImageUpload onChange={onChange} />);

    const file = new File(['png'], 'test.png', {type: 'image/png'});
    const input = document.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;
    await user.upload(input, file);

    expect(onChange).toHaveBeenCalledWith(file);
  });

  it('calls onRemove when remove button is clicked', async () => {
    const user = userEvent.setup();
    const onRemove = jest.fn();
    render(
      <ImageUpload value="/test.jpg" onChange={() => {}} onRemove={onRemove} />,
    );
    await user.click(screen.getByLabelText('Remove image'));
    expect(onRemove).toHaveBeenCalledTimes(1);
  });

  it('renders compact mode', () => {
    render(<ImageUpload compact onChange={() => {}} />);
    expect(screen.getByRole('button', {name: 'Upload'})).toBeInTheDocument();
  });
});
