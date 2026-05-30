jest.mock('./pg-dump', () => ({dumpDatabase: jest.fn().mockResolvedValue(undefined)}));
jest.mock('./tar-archive', () => ({archiveUploads: jest.fn().mockResolvedValue(undefined)}));

import {dumpDatabase} from './pg-dump';
import {archiveUploads} from './tar-archive';
import {
  DB_BACKUP_KIND,
  MEDIA_BACKUP_KIND,
  getBackupKind,
  parseAnyBackupFilename,
} from './backup-kinds';

describe('descriptors', () => {
  it('db kind has dump ext, max 10; media has tar.gz, max 3', () => {
    expect(DB_BACKUP_KIND).toMatchObject({id: 'db', ext: '.dump', max: 10});
    expect(MEDIA_BACKUP_KIND).toMatchObject({id: 'media', ext: '.tar.gz', max: 3});
  });
});

describe('DB_BACKUP_KIND.produce', () => {
  const ORIGINAL = process.env.DATABASE_URL;
  afterEach(() => {
    process.env.DATABASE_URL = ORIGINAL;
    jest.clearAllMocks();
  });
  it('strips the DATABASE_URL query and calls dumpDatabase', async () => {
    process.env.DATABASE_URL = 'postgresql://u:p@h:5432/db?schema=public';
    await DB_BACKUP_KIND.produce('/tmp/x.dump');
    expect(dumpDatabase).toHaveBeenCalledWith('postgresql://u:p@h:5432/db', '/tmp/x.dump');
  });
  it('throws when DATABASE_URL is unset', async () => {
    delete process.env.DATABASE_URL;
    await expect(DB_BACKUP_KIND.produce('/tmp/x.dump')).rejects.toThrow(/DATABASE_URL/);
  });
});

describe('MEDIA_BACKUP_KIND.produce', () => {
  afterEach(() => jest.clearAllMocks());
  it('calls archiveUploads with the out path', async () => {
    await MEDIA_BACKUP_KIND.produce('/tmp/x.tar.gz');
    expect(archiveUploads).toHaveBeenCalledWith('/tmp/x.tar.gz');
  });
});

describe('getBackupKind + parseAnyBackupFilename', () => {
  it('resolves kind ids, null for unknown', () => {
    expect(getBackupKind('db')).toBe(DB_BACKUP_KIND);
    expect(getBackupKind('media')).toBe(MEDIA_BACKUP_KIND);
    expect(getBackupKind('bogus')).toBeNull();
  });
  it('identifies the kind of any valid filename', () => {
    expect(parseAnyBackupFilename('vmt-2026-05-30T03-00-12Z-manual.dump')?.kind).toBe('db');
    expect(parseAnyBackupFilename('vmt-media-2026-05-30T03-00-12Z-scheduled.tar.gz')?.kind).toBe('media');
    expect(parseAnyBackupFilename('evil.txt')).toBeNull();
  });
});
