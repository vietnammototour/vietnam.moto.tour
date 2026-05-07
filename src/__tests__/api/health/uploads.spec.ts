import {createMocks} from 'node-mocks-http';
import fs from 'fs';
import path from 'path';
import os from 'os';
import handler from '@/pages/api/health/uploads';

describe('GET /api/health/uploads', () => {
  let tmpDir: string;
  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'vmt-h-'));
    process.env.UPLOAD_DIR = tmpDir;
  });
  afterEach(() => {
    fs.rmSync(tmpDir, {recursive: true, force: true});
  });

  it('reports writable + freeBytes when dir exists', async () => {
    const {req, res} = createMocks({method: 'GET'});
    await handler(req as any, res as any);
    expect(res._getStatusCode()).toBe(200);
    const body = res._getJSONData();
    expect(body.writable).toBe(true);
    expect(typeof body.freeBytes).toBe('number');
    expect(body.freeBytes).toBeGreaterThan(0);
  });

  it('reports writable=false when dir missing', async () => {
    fs.rmSync(tmpDir, {recursive: true});
    const {req, res} = createMocks({method: 'GET'});
    await handler(req as any, res as any);
    expect(res._getStatusCode()).toBe(503);
    expect(res._getJSONData().writable).toBe(false);
  });
});
