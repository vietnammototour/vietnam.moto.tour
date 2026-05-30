import fs from 'fs';
import os from 'os';
import path from 'path';
import {formatBackupFilename, parseBackupFilename, listBackups, enforceRetention, MAX_BACKUPS, createBackup} from './db-backup';

describe('formatBackupFilename', () => {
  it('encodes timestamp and source, filesystem-safe', () => {
    const d = new Date('2026-05-30T03:00:12.345Z');
    expect(formatBackupFilename(d, 'manual')).toBe(
      'vmt-2026-05-30T03-00-12Z-manual.dump',
    );
  });
});

describe('parseBackupFilename', () => {
  it('round-trips a valid name back to ISO createdAt + source', () => {
    expect(parseBackupFilename('vmt-2026-05-30T03-00-12Z-scheduled.dump')).toEqual({
      createdAt: '2026-05-30T03:00:12Z',
      source: 'scheduled',
    });
  });

  it('accepts a numeric collision suffix', () => {
    expect(parseBackupFilename('vmt-2026-05-30T03-00-12Z-manual-2.dump')).toEqual({
      createdAt: '2026-05-30T03:00:12Z',
      source: 'manual',
    });
  });

  it('returns null for non-backup filenames', () => {
    expect(parseBackupFilename('random.txt')).toBeNull();
    expect(parseBackupFilename('vmt-bad-name.dump')).toBeNull();
  });
});

describe('listBackups + enforceRetention', () => {
  let dir: string;
  const ORIGINAL = process.env.BACKUP_DIR;

  beforeEach(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'vmt-backups-'));
    process.env.BACKUP_DIR = dir;
  });
  afterEach(() => {
    fs.rmSync(dir, {recursive: true, force: true});
    process.env.BACKUP_DIR = ORIGINAL;
  });

  function touch(name: string) {
    fs.writeFileSync(path.join(dir, name), 'x');
  }

  it('lists only valid backups, newest first', () => {
    touch('vmt-2026-05-01T03-00-00Z-manual.dump');
    touch('vmt-2026-05-30T03-00-00Z-scheduled.dump');
    touch('ignore-me.txt');

    return listBackups().then((metas) => {
      expect(metas.map((m) => m.filename)).toEqual([
        'vmt-2026-05-30T03-00-00Z-scheduled.dump',
        'vmt-2026-05-01T03-00-00Z-manual.dump',
      ]);
      expect(metas[0].source).toBe('scheduled');
      expect(metas[0].byteSize).toBe(1);
    });
  });

  it('returns [] when the directory does not exist', () => {
    process.env.BACKUP_DIR = path.join(dir, 'nope');
    return expect(listBackups()).resolves.toEqual([]);
  });

  it('deletes oldest beyond MAX_BACKUPS', async () => {
    for (let i = 0; i < MAX_BACKUPS + 3; i++) {
      const day = String(i + 1).padStart(2, '0');
      touch(`vmt-2026-05-${day}T03-00-00Z-manual.dump`);
    }
    await enforceRetention();
    const remaining = fs.readdirSync(dir).filter((n) => n.endsWith('.dump'));
    expect(remaining).toHaveLength(MAX_BACKUPS);
    expect(remaining).toContain('vmt-2026-05-13T03-00-00Z-manual.dump');
    expect(remaining).not.toContain('vmt-2026-05-01T03-00-00Z-manual.dump');
  });
});

jest.mock('./pg-dump', () => ({
  dumpDatabase: jest.fn((_url: string, outPath: string) => {
    require('fs').writeFileSync(outPath, 'DUMP');
    return Promise.resolve();
  }),
}));

describe('createBackup', () => {
  let dir: string;
  const ORIGINAL_DIR = process.env.BACKUP_DIR;
  const ORIGINAL_DB = process.env.DATABASE_URL;

  beforeEach(() => {
    dir = require('fs').mkdtempSync(
      require('path').join(require('os').tmpdir(), 'vmt-create-'),
    );
    process.env.BACKUP_DIR = dir;
    process.env.DATABASE_URL = 'postgresql://u:p@h:5432/db?schema=public';
  });
  afterEach(() => {
    require('fs').rmSync(dir, {recursive: true, force: true});
    process.env.BACKUP_DIR = ORIGINAL_DIR;
    process.env.DATABASE_URL = ORIGINAL_DB;
    jest.clearAllMocks();
  });

  it('writes a dump file and returns its metadata', async () => {
    const meta = await createBackup('manual');
    expect(meta.source).toBe('manual');
    expect(meta.byteSize).toBe(4);
    expect(require('fs').existsSync(require('path').join(dir, meta.filename))).toBe(true);
  });

  it('passes a query-stripped DATABASE_URL to pg_dump', async () => {
    const {dumpDatabase} = require('./pg-dump');
    await createBackup('manual');
    expect(dumpDatabase).toHaveBeenCalledWith(
      'postgresql://u:p@h:5432/db',
      expect.stringContaining('.dump'),
    );
  });

  it('throws and cleans up the partial file when pg_dump fails', async () => {
    const {dumpDatabase} = require('./pg-dump');
    (dumpDatabase as jest.Mock).mockRejectedValueOnce(new Error('boom'));
    await expect(createBackup('manual')).rejects.toThrow('boom');
    expect(require('fs').readdirSync(dir).filter((n: string) => n.endsWith('.dump'))).toHaveLength(0);
  });

  it('throws when DATABASE_URL is unset', async () => {
    delete process.env.DATABASE_URL;
    await expect(createBackup('manual')).rejects.toThrow(/DATABASE_URL/);
  });
});
