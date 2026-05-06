import {sniffImageFormat, type SniffedFormat} from './image-magic';

export type ImagePreset = 'card' | 'hero';

export const TARGETS: Record<
  ImagePreset,
  {maxWidth: number; maxHeight: number}
> = {
  card: {maxWidth: 1200, maxHeight: 800},
  hero: {maxWidth: 2400, maxHeight: 1200},
};

export type TranscodedImage = {
  blob: Blob;
  hash: string;
  width: number;
  height: number;
  byteSize: number;
};

export type TranscodeError =
  | {code: 'unsupported_format'; mime: string; sniffed: SniffedFormat}
  | {code: 'too_large'; bytes: number}
  | {code: 'decode_failed'; reason: string}
  | {code: 'encode_failed'};

const MAX_INPUT_BYTES = 25 * 1024 * 1024;
const MAX_OUTPUT_BYTES = 2 * 1024 * 1024;
const MAX_DECODED_DIM = 8000;

export async function transcodeImage(
  file: File,
  preset: ImagePreset,
): Promise<TranscodedImage> {
  if (file.size > MAX_INPUT_BYTES) {
    throw {code: 'too_large', bytes: file.size} satisfies TranscodeError;
  }

  // Read the first 16 bytes for format sniffing.
  // We avoid file.slice().arrayBuffer() because it is unreliable in some
  // environments (e.g. jsdom). Instead we read the whole file buffer and
  // take a 16-byte view — the size guard above keeps this safe.
  const fileBuf = await file.arrayBuffer();
  const headBuf = fileBuf.slice(0, 16);
  const sniffed = sniffImageFormat(headBuf);

  if (
    sniffed !== 'jpeg' &&
    sniffed !== 'png' &&
    sniffed !== 'webp' &&
    sniffed !== 'gif'
  ) {
    throw {
      code: 'unsupported_format',
      mime: file.type,
      sniffed,
    } satisfies TranscodeError;
  }

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file, {
      imageOrientation: 'from-image',
    });
  } catch (e) {
    throw {
      code: 'decode_failed',
      reason: e instanceof Error ? e.message : String(e),
    } satisfies TranscodeError;
  }
  if (bitmap.width > MAX_DECODED_DIM || bitmap.height > MAX_DECODED_DIM) {
    bitmap.close();
    throw {code: 'too_large', bytes: file.size} satisfies TranscodeError;
  }

  const {maxWidth, maxHeight} = TARGETS[preset];
  const scale = Math.min(maxWidth / bitmap.width, maxHeight / bitmap.height, 1);
  const outW = Math.round(bitmap.width * scale);
  const outH = Math.round(bitmap.height * scale);

  let blob = await encodeWebp(bitmap, outW, outH, 0.85);
  if (blob.size > MAX_OUTPUT_BYTES) {
    blob = await encodeWebp(bitmap, outW, outH, 0.7);
  }
  bitmap.close();

  if (blob.size > MAX_OUTPUT_BYTES) {
    throw {code: 'encode_failed'} satisfies TranscodeError;
  }

  const buf = await blob.arrayBuffer();
  const hash = await sha256Hex8(buf);

  return {blob, hash, width: outW, height: outH, byteSize: blob.size};
}

async function encodeWebp(
  bitmap: ImageBitmap,
  w: number,
  h: number,
  quality: number,
): Promise<Blob> {
  const canvas = new OffscreenCanvas(w, h);
  const ctx = canvas.getContext('2d');
  if (!ctx) throw {code: 'encode_failed'} satisfies TranscodeError;
  ctx.drawImage(bitmap, 0, 0, w, h);
  return canvas.convertToBlob({type: 'image/webp', quality});
}

async function sha256Hex8(buf: ArrayBuffer): Promise<string> {
  // Copy bytes into a fresh Uint8Array to avoid cross-realm ArrayBuffer
  // issues (e.g. jsdom realm vs Node webcrypto realm in tests).
  const input = new Uint8Array(buf);
  const digest = await crypto.subtle.digest('SHA-256', input);
  const arr = Array.from(new Uint8Array(digest)).slice(0, 4);
  return arr.map((b) => b.toString(16).padStart(2, '0')).join('');
}
