import * as yup from 'yup';
import {imageSlotSchema} from './image-slot';

describe('imageSlotSchema', () => {
  it('accepts empty', async () => {
    const s = yup.object({s: imageSlotSchema()});
    await expect(s.validate({s: {kind: 'empty'}})).resolves.toBeDefined();
  });

  it('accepts saved', async () => {
    const s = yup.object({s: imageSlotSchema()});
    await expect(
      s.validate({
        s: {kind: 'saved', url: '/uploads/tours/x/card.aaaaaaaa.webp'},
      }),
    ).resolves.toBeDefined();
  });

  it('accepts pending-replace with valid hash', async () => {
    const s = yup.object({s: imageSlotSchema()});
    await expect(
      s.validate({
        s: {
          kind: 'pending-replace',
          blob: new Blob(['x']),
          previewUrl: 'blob:http://x',
          hash: 'abcd1234',
        },
      }),
    ).resolves.toBeDefined();
  });

  it('rejects pending-replace with bad hash', async () => {
    const s = yup.object({s: imageSlotSchema()});
    await expect(
      s.validate({
        s: {
          kind: 'pending-replace',
          blob: new Blob(['x']),
          previewUrl: 'blob:http://x',
          hash: 'not-hex',
        },
      }),
    ).rejects.toThrow();
  });
});
