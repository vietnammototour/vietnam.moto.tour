import path from 'path';
import {getBackupDir, resolveBackupPath} from './backup-dir';

describe('getBackupDir', () => {
  const ORIGINAL = process.env.BACKUP_DIR;
  afterEach(() => {
    process.env.BACKUP_DIR = ORIGINAL;
  });

  it('returns BACKUP_DIR env var when set', () => {
    process.env.BACKUP_DIR = '/var/lib/vmt-backups';
    expect(getBackupDir()).toBe('/var/lib/vmt-backups');
  });

  it('falls back to <cwd>/.backups when BACKUP_DIR unset', () => {
    delete process.env.BACKUP_DIR;
    expect(getBackupDir()).toBe(path.join(process.cwd(), '.backups'));
  });
});

describe('resolveBackupPath', () => {
  beforeEach(() => {
    process.env.BACKUP_DIR = '/var/lib/vmt-backups';
  });

  it('joins a filename under BACKUP_DIR', () => {
    expect(resolveBackupPath('vmt-2026-05-30T03-00-12Z-manual.dump')).toBe(
      '/var/lib/vmt-backups/vmt-2026-05-30T03-00-12Z-manual.dump',
    );
  });

  it('throws on path traversal', () => {
    expect(() => resolveBackupPath('../etc/passwd')).toThrow(/traversal/);
  });

  it('throws on absolute paths', () => {
    expect(() => resolveBackupPath('/etc/passwd')).toThrow(/absolute/);
  });
});
