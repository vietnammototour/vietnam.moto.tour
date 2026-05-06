import {render, screen, fireEvent, waitFor} from '@testing-library/react';
import {useForm, FormProvider} from 'react-hook-form';
import {ImageUploadField} from './ImageUploadField';
import * as transcodeMod from '@/lib/image-transcode';

jest.mock('@/lib/image-transcode');

function Harness({initial}: {initial?: unknown}) {
  const methods = useForm({
    defaultValues: {card: initial ?? {kind: 'empty'}},
  });
  return (
    <FormProvider {...methods}>
      <ImageUploadField name="card" preset="card" label="Card" />
    </FormProvider>
  );
}

beforeEach(() => {
  (transcodeMod.transcodeImage as jest.Mock).mockResolvedValue({
    blob: new Blob(['x'], {type: 'image/webp'}),
    hash: 'abcd1234',
    width: 1,
    height: 1,
    byteSize: 1,
  });
});

it('renders empty state', () => {
  render(<Harness />);
  expect(screen.getByText(/click to upload/i)).toBeInTheDocument();
});

it('updates field value on file pick — no fetch happens', async () => {
  const fetchSpy = jest.fn();
  global.fetch = fetchSpy as unknown as typeof fetch;
  render(<Harness />);
  const input = screen.getByLabelText('upload-input');
  fireEvent.change(input, {
    target: {files: [new File(['x'], 'x.png', {type: 'image/png'})]},
  });
  await waitFor(() => expect(transcodeMod.transcodeImage).toHaveBeenCalled());
  expect(fetchSpy).not.toHaveBeenCalled();
});
