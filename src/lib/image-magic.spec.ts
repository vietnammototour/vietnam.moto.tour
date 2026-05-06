import {sniffImageFormat} from './image-magic';

function bytes(...nums: number[]) {
  return new Uint8Array(nums).buffer;
}

describe('sniffImageFormat', () => {
  it('detects JPEG', () => {
    expect(sniffImageFormat(bytes(0xff, 0xd8, 0xff, 0xe0))).toBe('jpeg');
  });
  it('detects PNG', () => {
    expect(
      sniffImageFormat(bytes(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a)),
    ).toBe('png');
  });
  it('detects WebP', () => {
    const arr = new Uint8Array(12);
    arr.set([0x52, 0x49, 0x46, 0x46], 0);
    arr.set([0x00, 0x00, 0x00, 0x00], 4);
    arr.set([0x57, 0x45, 0x42, 0x50], 8);
    expect(sniffImageFormat(arr.buffer)).toBe('webp');
  });
  it('detects GIF', () => {
    expect(sniffImageFormat(bytes(0x47, 0x49, 0x46, 0x38, 0x39, 0x61))).toBe(
      'gif',
    );
  });
  it('detects HEIC (ftypheic)', () => {
    const arr = new Uint8Array(12);
    arr.set([0, 0, 0, 0x18, 0x66, 0x74, 0x79, 0x70, 0x68, 0x65, 0x69, 0x63]);
    expect(sniffImageFormat(arr.buffer)).toBe('heic');
  });
  it('returns unknown for arbitrary bytes', () => {
    expect(sniffImageFormat(bytes(0x00, 0x01, 0x02, 0x03))).toBe('unknown');
  });
});
