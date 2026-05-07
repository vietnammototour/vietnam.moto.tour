/**
 * @jest-environment node
 */
import {createMocks} from 'node-mocks-http';
import {PassThrough} from 'stream';
import fs from 'fs';
import path from 'path';
import os from 'os';
import handler from '@/pages/api/admin/upload';
import {prisma} from '@/lib/prisma';

jest.mock('@/lib/admin-auth', () => ({
  requireAdmin: jest.fn().mockResolvedValue(true),
}));

jest.mock('@/lib/prisma', () => ({
  prisma: {
    tour: {findUnique: jest.fn(), update: jest.fn()},
    destination: {findUnique: jest.fn(), update: jest.fn()},
    highlight: {findUnique: jest.fn(), update: jest.fn()},
  },
}));

/**
 * Build a multipart/form-data body buffer with fields + one file part.
 */
function buildMultipartBody(opts: {
  entityType: string;
  entityId: string;
  imageType: string;
  file: {bytes: Buffer; filename: string; mime: string};
}): {body: Buffer; boundary: string} {
  const boundary = '----vmt-test-boundary';
  const crlf = '\r\n';

  function fieldPart(name: string, value: string): Buffer {
    return Buffer.from(
      `--${boundary}${crlf}` +
        `Content-Disposition: form-data; name="${name}"${crlf}${crlf}` +
        `${value}${crlf}`,
    );
  }

  const filePart = Buffer.concat([
    Buffer.from(
      `--${boundary}${crlf}` +
        `Content-Disposition: form-data; name="file"; filename="${opts.file.filename}"${crlf}` +
        `Content-Type: ${opts.file.mime}${crlf}${crlf}`,
    ),
    opts.file.bytes,
    Buffer.from(crlf),
  ]);

  const closing = Buffer.from(`--${boundary}--${crlf}`);

  const body = Buffer.concat([
    fieldPart('entityType', opts.entityType),
    fieldPart('entityId', opts.entityId),
    fieldPart('imageType', opts.imageType),
    filePart,
    closing,
  ]);

  return {body, boundary};
}

/**
 * Create a mock request that is a real PassThrough stream (so formidable can
 * parse it) with the correct headers, paired with a node-mocks-http response.
 */
function makeMultipartMock(opts: {
  entityType: string;
  entityId: string;
  imageType: string;
  file: {bytes: Buffer; filename: string; mime: string};
}) {
  const {body, boundary} = buildMultipartBody(opts);

  const stream = new PassThrough();
  // Attach the headers formidable needs
  (stream as any).headers = {
    'content-type': `multipart/form-data; boundary=${boundary}`,
    'content-length': String(body.length),
  };
  (stream as any).method = 'POST';

  const {res} = createMocks({method: 'POST'});

  // Feed body into the stream after current tick so consumers can attach
  process.nextTick(() => {
    stream.write(body);
    stream.end();
  });

  return {req: stream as any, res};
}

const VALID_WEBP = Buffer.concat([
  Buffer.from([0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50]),
  Buffer.alloc(50),
]);

describe('POST /api/admin/upload', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'vmt-up-'));
    process.env.UPLOAD_DIR = tmpDir;
    jest.clearAllMocks();
  });
  afterEach(() => fs.rmSync(tmpDir, {recursive: true, force: true}));

  it('writes hashed file + updates DB on valid webp', async () => {
    (prisma.tour.findUnique as jest.Mock).mockResolvedValue({
      id: 't1',
      imageUrl: null,
    });
    const {req, res} = makeMultipartMock({
      entityType: 'tour',
      entityId: 't1',
      imageType: 'card',
      file: {bytes: VALID_WEBP, filename: 'x.webp', mime: 'image/webp'},
    });
    await handler(req as any, res as any);
    expect(res._getStatusCode()).toBe(200);
    const body = JSON.parse(res._getData());
    expect(body.url).toMatch(/^\/uploads\/tours\/t1\/card\.[0-9a-f]{8}\.webp$/);
    expect(prisma.tour.update).toHaveBeenCalledWith({
      where: {id: 't1'},
      data: {imageUrl: body.url},
    });
    const onDisk = path.join(tmpDir, body.url.replace('/uploads/', ''));
    expect(fs.existsSync(onDisk)).toBe(true);
  });

  it('rejects non-webp mime', async () => {
    (prisma.tour.findUnique as jest.Mock).mockResolvedValue({id: 't1'});
    const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    const {req, res} = makeMultipartMock({
      entityType: 'tour',
      entityId: 't1',
      imageType: 'card',
      file: {bytes: png, filename: 'x.png', mime: 'image/png'},
    });
    await handler(req as any, res as any);
    expect(res._getStatusCode()).toBe(400);
  });

  it('rejects spoofed webp (mime says webp but bytes are not RIFF/WEBP)', async () => {
    (prisma.tour.findUnique as jest.Mock).mockResolvedValue({id: 't1'});
    const fake = Buffer.from([0x00, 0x01, 0x02, 0x03, 0x04]);
    const {req, res} = makeMultipartMock({
      entityType: 'tour',
      entityId: 't1',
      imageType: 'card',
      file: {bytes: fake, filename: 'x.webp', mime: 'image/webp'},
    });
    await handler(req as any, res as any);
    expect(res._getStatusCode()).toBe(400);
  });

  it('returns 404 for unknown entity', async () => {
    (prisma.tour.findUnique as jest.Mock).mockResolvedValue(null);
    const {req, res} = makeMultipartMock({
      entityType: 'tour',
      entityId: 'missing',
      imageType: 'card',
      file: {bytes: VALID_WEBP, filename: 'x.webp', mime: 'image/webp'},
    });
    await handler(req as any, res as any);
    expect(res._getStatusCode()).toBe(404);
  });

  it('rejects tour:hero combination', async () => {
    const {req, res} = makeMultipartMock({
      entityType: 'tour',
      entityId: 't1',
      imageType: 'hero',
      file: {bytes: VALID_WEBP, filename: 'x.webp', mime: 'image/webp'},
    });
    await handler(req as any, res as any);
    expect(res._getStatusCode()).toBe(400);
  });

  it('unlinks freshly written file when DB update fails', async () => {
    (prisma.tour.findUnique as jest.Mock).mockResolvedValue({id: 't1'});
    (prisma.tour.update as jest.Mock).mockRejectedValue(new Error('db down'));
    const {req, res} = makeMultipartMock({
      entityType: 'tour',
      entityId: 't1',
      imageType: 'card',
      file: {bytes: VALID_WEBP, filename: 'x.webp', mime: 'image/webp'},
    });
    await handler(req as any, res as any);
    expect(res._getStatusCode()).toBe(500);
    const dir = path.join(tmpDir, 'tours/t1');
    if (fs.existsSync(dir)) expect(fs.readdirSync(dir)).toHaveLength(0);
  });
});
