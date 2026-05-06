export type SniffedFormat =
  | 'jpeg'
  | 'png'
  | 'webp'
  | 'gif'
  | 'heic'
  | 'heif'
  | 'unknown';

export function sniffImageFormat(buf: ArrayBuffer): SniffedFormat {
  const v = new Uint8Array(buf);
  if (v.length < 4) return 'unknown';

  if (v[0] === 0xff && v[1] === 0xd8 && v[2] === 0xff) return 'jpeg';
  if (
    v.length >= 8 &&
    v[0] === 0x89 &&
    v[1] === 0x50 &&
    v[2] === 0x4e &&
    v[3] === 0x47 &&
    v[4] === 0x0d &&
    v[5] === 0x0a &&
    v[6] === 0x1a &&
    v[7] === 0x0a
  )
    return 'png';
  if (
    v[0] === 0x52 &&
    v[1] === 0x49 &&
    v[2] === 0x46 &&
    v[3] === 0x46 &&
    v.length >= 12 &&
    v[8] === 0x57 &&
    v[9] === 0x45 &&
    v[10] === 0x42 &&
    v[11] === 0x50
  )
    return 'webp';
  if (
    v.length >= 6 &&
    v[0] === 0x47 &&
    v[1] === 0x49 &&
    v[2] === 0x46 &&
    v[3] === 0x38 &&
    (v[4] === 0x37 || v[4] === 0x39) &&
    v[5] === 0x61
  )
    return 'gif';
  if (
    v.length >= 12 &&
    v[4] === 0x66 &&
    v[5] === 0x74 &&
    v[6] === 0x79 &&
    v[7] === 0x70
  ) {
    const brand = String.fromCharCode(v[8], v[9], v[10], v[11]);
    if (brand === 'heic' || brand === 'heix' || brand === 'mif1') return 'heic';
    if (brand === 'heif') return 'heif';
  }
  return 'unknown';
}
