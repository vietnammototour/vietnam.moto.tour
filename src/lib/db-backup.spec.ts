import {formatBackupFilename, parseBackupFilename} from './db-backup';

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
