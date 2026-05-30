/**
 * @jest-environment node
 */
import {createMocks} from 'node-mocks-http';
import fs from 'fs';
import os from 'os';
import path from 'path';
import handler from '@/pages/api/admin/backups/[filename]/download';

jest.mock('@/lib/admin-auth', () => ({
  requireAdmin: jest.fn().mockResolvedValue(true),
}));
import {requireAdmin} from '@/lib/admin-auth';

describe('GET /api/admin/backups/[filename]/download', () => {
  let dir: string;
  const ORIGINAL = process.env.BACKUP_DIR;
  const VALID = 'vmt-2026-05-30T03-00-00Z-manual.dump';

  beforeEach(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'vmt-dl-'));
    process.env.BACKUP_DIR = dir;
    fs.writeFileSync(path.join(dir, VALID), 'DUMP');
  });
  afterEach(() => {
    fs.rmSync(dir, {recursive: true, force: true});
    process.env.BACKUP_DIR = ORIGINAL;
    jest.clearAllMocks();
  });

  it('streams the file with an attachment header', async () => {
    const {req, res} = createMocks({method: 'GET', query: {filename: VALID}});
    await handler(req as never, res as never);
    expect(res._getStatusCode()).toBe(200);
    expect(res.getHeader('Content-Disposition')).toContain(`filename="${VALID}"`);
    expect(res.getHeader('Content-Type')).toBe('application/octet-stream');
  });

  it('rejects a non-backup filename with 400', async () => {
    const {req, res} = createMocks({method: 'GET', query: {filename: 'evil.txt'}});
    await handler(req as never, res as never);
    expect(res._getStatusCode()).toBe(400);
  });

  it('rejects a traversal filename with 400', async () => {
    const {req, res} = createMocks({
      method: 'GET',
      query: {filename: '../../etc/passwd'},
    });
    await handler(req as never, res as never);
    expect(res._getStatusCode()).toBe(400);
  });

  it('returns 404 for a missing but valid-named file', async () => {
    const {req, res} = createMocks({
      method: 'GET',
      query: {filename: 'vmt-2026-01-01T00-00-00Z-manual.dump'},
    });
    await handler(req as never, res as never);
    expect(res._getStatusCode()).toBe(404);
  });

  it('blocks unauthorized callers', async () => {
    (requireAdmin as jest.Mock).mockResolvedValueOnce(false);
    const {req, res} = createMocks({method: 'GET', query: {filename: VALID}});
    await handler(req as never, res as never);
    expect(res._getStatusCode()).not.toBe(200);
  });
});
