import fs from 'fs';
import os from 'os';
import path from 'path';
import {formatBackupFilename, parseBackupFilename, listBackups, enforceRetention, MAX_BACKUPS} from './db-backup';

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
