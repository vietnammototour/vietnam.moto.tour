/**
 * @jest-environment node
 */
import {createMocks} from 'node-mocks-http';
import handler from '@/pages/api/admin/backups';

jest.mock('@/lib/admin-auth', () => ({
  requireAdmin: jest.fn().mockResolvedValue(true),
}));
jest.mock('@/lib/backup-core', () => ({
  listBackups: jest.fn(),
  createBackup: jest.fn(),
}));
jest.mock('@/lib/backup-kinds', () => {
  const DB = {id: 'db', max: 10};
  const MEDIA = {id: 'media', max: 3};
  return {
    DB_BACKUP_KIND: DB,
    MEDIA_BACKUP_KIND: MEDIA,
    getBackupKind: (id: string) => (id === 'db' ? DB : id === 'media' ? MEDIA : null),
  };
});

import {requireAdmin} from '@/lib/admin-auth';
import {listBackups, createBackup} from '@/lib/backup-core';
import {DB_BACKUP_KIND, MEDIA_BACKUP_KIND} from '@/lib/backup-kinds';

const dbMeta = {
  filename: 'vmt-2026-05-30T03-00-00Z-manual.dump',
  createdAt: '2026-05-30T03:00:00Z',
  source: 'manual' as const,
  byteSize: 1234,
  kind: 'db' as const,
};

describe('GET /api/admin/backups', () => {
  afterEach(() => jest.clearAllMocks());

  it('defaults to db kind, returns list + maxBackups', async () => {
    (listBackups as jest.Mock).mockResolvedValue([dbMeta]);
    const {req, res} = createMocks({method: 'GET'});
    await handler(req as never, res as never);
    expect(listBackups).toHaveBeenCalledWith(DB_BACKUP_KIND);
    expect(res._getStatusCode()).toBe(200);
    expect(res._getJSONData()).toEqual({backups: [dbMeta], maxBackups: 10});
  });

  it('uses media kind when ?kind=media', async () => {
    (listBackups as jest.Mock).mockResolvedValue([]);
    const {req, res} = createMocks({method: 'GET', query: {kind: 'media'}});
    await handler(req as never, res as never);
    expect(listBackups).toHaveBeenCalledWith(MEDIA_BACKUP_KIND);
    expect(res._getJSONData()).toEqual({backups: [], maxBackups: 3});
  });

  it('rejects an invalid kind with 400', async () => {
    const {req, res} = createMocks({method: 'GET', query: {kind: 'bogus'}});
    await handler(req as never, res as never);
    expect(res._getStatusCode()).toBe(400);
    expect(listBackups).not.toHaveBeenCalled();
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

  it('creates a backup of the requested kind and returns the updated list', async () => {
    (createBackup as jest.Mock).mockResolvedValue({...dbMeta, kind: 'media'});
    (listBackups as jest.Mock).mockResolvedValue([]);
    const {req, res} = createMocks({method: 'POST', query: {kind: 'media'}});
    await handler(req as never, res as never);
    expect(createBackup).toHaveBeenCalledWith(MEDIA_BACKUP_KIND, 'manual');
    expect(res._getStatusCode()).toBe(201);
    expect(res._getJSONData()).toEqual({backups: [], maxBackups: 3});
  });

  it('returns 500 when the producer fails', async () => {
    (createBackup as jest.Mock).mockRejectedValue(new Error('tar exited with code 1'));
    const {req, res} = createMocks({method: 'POST'});
    await handler(req as never, res as never);
    expect(res._getStatusCode()).toBe(500);
    expect(res._getJSONData().error).toMatch(/tar/);
  });

  it('rejects other methods with 405', async () => {
    const {req, res} = createMocks({method: 'DELETE'});
    await handler(req as never, res as never);
    expect(res._getStatusCode()).toBe(405);
  });
});
