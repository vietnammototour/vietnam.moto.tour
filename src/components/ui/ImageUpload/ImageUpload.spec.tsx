import {render, screen, fireEvent, waitFor} from '@testing-library/react';
import {ImageUpload} from './ImageUpload';
import * as transcodeMod from '@/lib/image-transcode';

jest.mock('@/lib/image-transcode');

beforeEach(() => {
  (transcodeMod.transcodeImage as jest.Mock).mockResolvedValue({
    blob: new Blob(['x'], {type: 'image/webp'}),
    hash: 'abcd1234',
    width: 100,
    height: 100,
    byteSize: 1,
  });
  if (!global.URL.createObjectURL) {
    Object.defineProperty(global.URL, 'createObjectURL', {
      value: jest.fn(() => 'blob:fake'),
      writable: true,
    });
    Object.defineProperty(global.URL, 'revokeObjectURL', {
      value: jest.fn(),
      writable: true,
    });
  }
});

it('renders empty state with picker', () => {
  const onChange = jest.fn();
  render(
    <ImageUpload value={{kind: 'empty'}} onChange={onChange} preset="card" />,
  );
  expect(screen.getByText(/click to upload/i)).toBeInTheDocument();
});

it('renders saved preview', () => {
  render(
    <ImageUpload
      value={{kind: 'saved', url: '/uploads/t/abc/card.aaaaaaaa.webp'}}
      onChange={() => {}}
      preset="card"
    />,
  );
  const img = screen.getByRole('img', {name: /upload/i}) as HTMLImageElement;
  expect(img.src).toContain('/uploads/t/abc/card.aaaaaaaa.webp');
});

it('transcodes on file pick and emits pending-replace', async () => {
  const onChange = jest.fn();
  render(
    <ImageUpload value={{kind: 'empty'}} onChange={onChange} preset="card" />,
  );
  const input = screen.getByLabelText('upload-input');
  fireEvent.change(input, {
    target: {files: [new File(['x'], 'x.png', {type: 'image/png'})]},
  });
  await waitFor(() => expect(onChange).toHaveBeenCalled());
  const arg = onChange.mock.calls[0][0];
  expect(arg.kind).toBe('pending-replace');
  expect(arg.hash).toBe('abcd1234');
});

it('emits pending-delete when removing a saved image', () => {
  const onChange = jest.fn();
  render(
    <ImageUpload
      value={{kind: 'saved', url: '/uploads/x.webp'}}
      onChange={onChange}
      preset="card"
    />,
  );
  fireEvent.click(screen.getByRole('button', {name: /delete/i}));
  expect(onChange).toHaveBeenCalledWith({
    kind: 'pending-delete',
    previousUrl: '/uploads/x.webp',
  });
});

it('renders error prop', () => {
  render(
    <ImageUpload
      value={{kind: 'empty'}}
      onChange={() => {}}
      preset="card"
      error="oops"
    />,
  );
  expect(screen.getByText('oops')).toBeInTheDocument();
});
