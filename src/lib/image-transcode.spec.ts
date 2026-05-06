/**
 * @jest-environment jsdom
 */
import {transcodeImage, TARGETS} from './image-transcode';

const PNG_2x2 = Uint8Array.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d, 0x49,
  0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x02, 0x00, 0x00, 0x00, 0x02, 0x08, 0x02,
  0x00, 0x00, 0x00, 0xfd, 0xd4, 0x9a, 0x73, 0x00, 0x00, 0x00, 0x16, 0x49, 0x44,
  0x41, 0x54, 0x78, 0x9c, 0x62, 0xfc, 0xcf, 0xc0, 0xc0, 0xc0, 0xc4, 0xc0, 0xc0,
  0xc0, 0x40, 0x80, 0x91, 0x05, 0x00, 0x00, 0x00, 0xff, 0xff, 0x03, 0x00, 0x06,
  0x68, 0x01, 0xeb, 0xa3, 0xa3, 0x4e, 0x57, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45,
  0x4e, 0x44, 0xae, 0x42, 0x60, 0x82,
]);

describe('transcodeImage', () => {
  it('preset bounds', () => {
    expect(TARGETS.card).toEqual({maxWidth: 1200, maxHeight: 800});
    expect(TARGETS.hero).toEqual({maxWidth: 2400, maxHeight: 1200});
  });

  it('rejects unsupported format', async () => {
    const file = new File([new Uint8Array([0, 1, 2, 3])], 'x.bin');
    await expect(transcodeImage(file, 'card')).rejects.toMatchObject({
      code: 'unsupported_format',
    });
  });

  it('rejects HEIC as unsupported_format', async () => {
    const arr = new Uint8Array(16);
    arr.set([0, 0, 0, 0x18, 0x66, 0x74, 0x79, 0x70, 0x68, 0x65, 0x69, 0x63]);
    const file = new File([arr], 'photo.heic', {type: 'image/heic'});
    await expect(transcodeImage(file, 'card')).rejects.toMatchObject({
      code: 'unsupported_format',
      sniffed: 'heic',
    });
  });

  it('rejects oversize input', async () => {
    const big = new Uint8Array(26 * 1024 * 1024);
    big.set(PNG_2x2.subarray(0, 8));
    const file = new File([big], 'x.png');
    await expect(transcodeImage(file, 'card')).rejects.toMatchObject({
      code: 'too_large',
    });
  });

  it('returns webp blob + 8-char hash for valid PNG', async () => {
    const file = new File([PNG_2x2], 'tiny.png', {type: 'image/png'});
    const out = await transcodeImage(file, 'card');
    expect(out.blob.type).toBe('image/webp');
    expect(out.hash).toMatch(/^[0-9a-f]{8}$/);
    expect(out.byteSize).toBeGreaterThan(0);
    expect(out.width).toBeGreaterThan(0);
    expect(out.height).toBeGreaterThan(0);
  });
});
