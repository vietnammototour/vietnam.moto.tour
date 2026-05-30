import fs from 'fs';
import os from 'os';
import path from 'path';
import {
  formatBackupFilename,
  parseBackupFilename,
  listBackups,
  enforceRetention,
  nextAvailableFilename,
  createBackup,
  type BackupKind,
} from './backup-core';

const DB: BackupKind = {
  id: 'db',
  prefix: 'vmt-',
  ext: '.dump',
  max: 10,
  nameRe:
    /^vmt-(\d{4}-\d{2}-\d{2})T(\d{2})-(\d{2})-(\d{2})Z-(manual|scheduled)(?:-\d+)?\.dump$/,
  produce: (out) => {
    fs.writeFileSync(out, 'DUMP');
    return Promise.resolve();
  },
};
const MEDIA: BackupKind = {
  id: 'media',
  prefix: 'vmt-media-',
  ext: '.tar.gz',
  max: 3,
  nameRe:
    /^vmt-media-(\d{4}-\d{2}-\d{2})T(\d{2})-(\d{2})-(\d{2})Z-(manual|scheduled)(?:-\d+)?\.tar\.gz$/,
  produce: (out) => {
    fs.writeFileSync(out, 'TARGZ');
    return Promise.resolve();
  },
};

describe('formatBackupFilename', () => {
  const d = new Date('2026-05-30T03:00:12.345Z');
  it('encodes db filename', () => {
    expect(formatBackupFilename(DB, d, 'manual')).toBe(
      'vmt-2026-05-30T03-00-12Z-manual.dump',
    );
  });
  it('encodes media filename', () => {
    expect(formatBackupFilename(MEDIA, d, 'scheduled')).toBe(
      'vmt-media-2026-05-30T03-00-12Z-scheduled.tar.gz',
    );
  });
});

describe('parseBackupFilename', () => {
  it('parses its own kind, rejects the other kind', () => {
    expect(parseBackupFilename(DB, 'vmt-2026-05-30T03-00-12Z-manual.dump')).toEqual({
      createdAt: '2026-05-30T03:00:12Z',
      source: 'manual',
    });
    expect(
      parseBackupFilename(MEDIA, 'vmt-media-2026-05-30T03-00-12Z-manual.tar.gz'),
    ).toEqual({createdAt: '2026-05-30T03:00:12Z', source: 'manual'});
    expect(parseBackupFilename(DB, 'vmt-media-2026-05-30T03-00-12Z-manual.tar.gz')).toBeNull();
    expect(parseBackupFilename(MEDIA, 'vmt-2026-05-30T03-00-12Z-manual.dump')).toBeNull();
  });
  it('accepts collision suffix', () => {
    expect(parseBackupFilename(MEDIA, 'vmt-media-2026-05-30T03-00-12Z-manual-2.tar.gz')).toEqual({
      createdAt: '2026-05-30T03:00:12Z',
      source: 'manual',
    });
  });
});

describe('listBackups + enforceRetention (per-kind isolation)', () => {
  let dir: string;
  const ORIGINAL = process.env.BACKUP_DIR;
  beforeEach(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'vmt-core-'));
    process.env.BACKUP_DIR = dir;
  });
  afterEach(() => {
    fs.rmSync(dir, {recursive: true, force: true});
    process.env.BACKUP_DIR = ORIGINAL;
  });
  const touch = (n: string) => fs.writeFileSync(path.join(dir, n), 'x');

  it('lists only the requested kind, newest first', async () => {
    touch('vmt-2026-05-01T03-00-00Z-manual.dump');
    touch('vmt-2026-05-30T03-00-00Z-scheduled.dump');
    touch('vmt-media-2026-05-15T03-00-00Z-manual.tar.gz');
    const db = await listBackups(DB);
    expect(db.map((m) => m.filename)).toEqual([
      'vmt-2026-05-30T03-00-00Z-scheduled.dump',
      'vmt-2026-05-01T03-00-00Z-manual.dump',
    ]);
    expect(db.every((m) => m.kind === 'db')).toBe(true);
    const media = await listBackups(MEDIA);
    expect(media.map((m) => m.filename)).toEqual([
      'vmt-media-2026-05-15T03-00-00Z-manual.tar.gz',
    ]);
    expect(media[0].kind).toBe('media');
  });

  it('retention respects kind.max and only deletes that kind', async () => {
    for (let i = 0; i < 5; i++) {
      const day = String(i + 1).padStart(2, '0');
      touch(`vmt-media-2026-05-${day}T03-00-00Z-manual.tar.gz`);
    }
    touch('vmt-2026-05-01T03-00-00Z-manual.dump');
    await enforceRetention(MEDIA);
    const remainingMedia = fs.readdirSync(dir).filter((n) => n.endsWith('.tar.gz'));
    expect(remainingMedia).toHaveLength(3);
    expect(remainingMedia).toContain('vmt-media-2026-05-05T03-00-00Z-manual.tar.gz');
    expect(remainingMedia).not.toContain('vmt-media-2026-05-01T03-00-00Z-manual.tar.gz');
    expect(fs.existsSync(path.join(dir, 'vmt-2026-05-01T03-00-00Z-manual.dump'))).toBe(true);
  });
});

describe('createBackup', () => {
  let dir: string;
  const ORIGINAL = process.env.BACKUP_DIR;
  beforeEach(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'vmt-core-create-'));
    process.env.BACKUP_DIR = dir;
  });
  afterEach(() => {
    fs.rmSync(dir, {recursive: true, force: true});
    process.env.BACKUP_DIR = ORIGINAL;
  });

  it('runs the kind producer and returns metadata', async () => {
    const meta = await createBackup(MEDIA, 'manual');
    expect(meta.kind).toBe('media');
    expect(meta.source).toBe('manual');
    expect(meta.byteSize).toBe(5);
    expect(fs.existsSync(path.join(dir, meta.filename))).toBe(true);
    expect(meta.filename.endsWith('.tar.gz')).toBe(true);
  });

  it('cleans up the partial file when the producer fails', async () => {
    const failing: BackupKind = {
      ...MEDIA,
      produce: () => Promise.reject(new Error('boom')),
    };
    await expect(createBackup(failing, 'manual')).rejects.toThrow('boom');
    expect(fs.readdirSync(dir).filter((n) => n.endsWith('.tar.gz'))).toHaveLength(0);
  });
});

describe('nextAvailableFilename', () => {
  let dir: string;
  const ORIGINAL = process.env.BACKUP_DIR;
  beforeEach(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'vmt-core-next-'));
    process.env.BACKUP_DIR = dir;
  });
  afterEach(() => {
    fs.rmSync(dir, {recursive: true, force: true});
    process.env.BACKUP_DIR = ORIGINAL;
  });

  it('appends a numeric suffix on collision', () => {
    const d = new Date('2026-05-30T03:00:12.000Z');
    const base = formatBackupFilename(MEDIA, d, 'manual');
    fs.writeFileSync(path.join(dir, base), 'x');
    expect(nextAvailableFilename(MEDIA, d, 'manual')).toBe(
      'vmt-media-2026-05-30T03-00-12Z-manual-2.tar.gz',
    );
  });
});
