/**
 * @jest-environment node
 */
import {createMocks} from 'node-mocks-http';
import handler from '@/pages/api/admin/backups';

jest.mock('@/lib/admin-auth', () => ({
  requireAdmin: jest.fn().mockResolvedValue(true),
}));

jest.mock('@/lib/db-backup', () => ({
  MAX_BACKUPS: 10,
  listBackups: jest.fn(),
  createBackup: jest.fn(),
}));

import {requireAdmin} from '@/lib/admin-auth';
import {listBackups, createBackup} from '@/lib/db-backup';

const sampleMeta = {
  filename: 'vmt-2026-05-30T03-00-00Z-manual.dump',
  createdAt: '2026-05-30T03:00:00Z',
  source: 'manual' as const,
  byteSize: 1234,
};

describe('GET /api/admin/backups', () => {
  afterEach(() => jest.clearAllMocks());

  it('returns the backup list and maxBackups', async () => {
    (listBackups as jest.Mock).mockResolvedValue([sampleMeta]);
    const {req, res} = createMocks({method: 'GET'});
    await handler(req as never, res as never);
    expect(res._getStatusCode()).toBe(200);
    expect(res._getJSONData()).toEqual({backups: [sampleMeta], maxBackups: 10});
  });

  it('blocks unauthorized callers', async () => {
    (requireAdmin as jest.Mock).mockResolvedValueOnce(false);
    const {req, res} = createMocks({method: 'GET'});
    await handler(req as never, res as never);
    expect(listBackups).not.toHaveBeenCalled();
  });
});

describe('POST /api/admin/backups', () => {
  afterEach(() => jest.clearAllMocks());

  it('creates a backup and returns the updated list', async () => {
    (createBackup as jest.Mock).mockResolvedValue(sampleMeta);
    (listBackups as jest.Mock).mockResolvedValue([sampleMeta]);
    const {req, res} = createMocks({method: 'POST'});
    await handler(req as never, res as never);
    expect(createBackup).toHaveBeenCalledWith('manual');
    expect(res._getStatusCode()).toBe(201);
    expect(res._getJSONData()).toEqual({backups: [sampleMeta], maxBackups: 10});
  });

  it('returns 500 when pg_dump fails', async () => {
    (createBackup as jest.Mock).mockRejectedValue(new Error('pg_dump exited with code 1'));
    const {req, res} = createMocks({method: 'POST'});
    await handler(req as never, res as never);
    expect(res._getStatusCode()).toBe(500);
    expect(res._getJSONData().error).toMatch(/pg_dump/);
  });

  it('rejects other methods with 405', async () => {
    const {req, res} = createMocks({method: 'DELETE'});
    await handler(req as never, res as never);
    expect(res._getStatusCode()).toBe(405);
  });
});
