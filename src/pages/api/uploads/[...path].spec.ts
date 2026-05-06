import {createMocks} from 'node-mocks-http';
import fs from 'fs';
import path from 'path';
import os from 'os';
import handler from './[...path]';

describe('GET /api/uploads/[...path]', () => {
  let tmpDir: string;
  const ORIGINAL_ENV = process.env.UPLOAD_DIR;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'vmt-up-'));
    process.env.UPLOAD_DIR = tmpDir;
  });

  afterEach(() => {
    process.env.UPLOAD_DIR = ORIGINAL_ENV;
    fs.rmSync(tmpDir, {recursive: true, force: true});
  });

  function writeFixture(rel: string, bytes: Buffer) {
    const full = path.join(tmpDir, rel);
    fs.mkdirSync(path.dirname(full), {recursive: true});
    fs.writeFileSync(full, bytes);
    return full;
  }

  it('serves an existing webp with correct headers', async () => {
    writeFixture('tours/abc/card.aaaaaaaa.webp', Buffer.from('RIFFwebpfake'));
    const {req, res} = createMocks({
      method: 'GET',
      query: {path: ['tours', 'abc', 'card.aaaaaaaa.webp']},
    });
    await handler(req as any, res as any);
    expect(res._getStatusCode()).toBe(200);
    expect(res.getHeader('Content-Type')).toBe('image/webp');
    expect(res.getHeader('Cache-Control')).toMatch(/immutable/);
    expect(res.getHeader('ETag')).toBe('aaaaaaaa');
  });

  it('serves legacy jpeg with derived Content-Type and mtime ETag', async () => {
    writeFixture('tours/abc/card.jpg', Buffer.from('jpg'));
    const {req, res} = createMocks({
      method: 'GET',
      query: {path: ['tours', 'abc', 'card.jpg']},
    });
    await handler(req as any, res as any);
    expect(res._getStatusCode()).toBe(200);
    expect(res.getHeader('Content-Type')).toBe('image/jpeg');
    expect(res.getHeader('ETag')).toMatch(/^\d+-\d+$/);
  });

  it('rejects unknown extension', async () => {
    writeFixture('tours/abc/card.exe', Buffer.from('mz'));
    const {req, res} = createMocks({
      method: 'GET',
      query: {path: ['tours', 'abc', 'card.exe']},
    });
    await handler(req as any, res as any);
    expect(res._getStatusCode()).toBe(404);
  });

  it('returns placeholder on missing file', async () => {
    const {req, res} = createMocks({
      method: 'GET',
      query: {path: ['tours', 'nonexistent', 'card.webp']},
    });
    await handler(req as any, res as any);
    expect(res._getStatusCode()).toBe(404);
    expect(res.getHeader('Content-Type')).toBe('image/svg+xml');
  });

  it('blocks path traversal', async () => {
    const {req, res} = createMocks({
      method: 'GET',
      query: {path: ['..', '..', 'etc', 'passwd']},
    });
    await handler(req as any, res as any);
    expect(res._getStatusCode()).toBe(400);
  });

  it('rejects non-GET methods', async () => {
    const {req, res} = createMocks({
      method: 'POST',
      query: {path: ['tours', 'a', 'card.webp']},
    });
    await handler(req as any, res as any);
    expect(res._getStatusCode()).toBe(405);
  });
});
