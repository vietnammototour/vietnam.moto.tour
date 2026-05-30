import {dumpDatabase} from './pg-dump';
import {archiveUploads} from './tar-archive';
import {parseBackupFilename, type BackupKind, type BackupKindId, type BackupSource} from './backup-core';

export const DB_BACKUP_KIND: BackupKind = {
  id: 'db',
  prefix: 'vmt-',
  ext: '.dump',
  max: 10,
  nameRe:
    /^vmt-(\d{4}-\d{2}-\d{2})T(\d{2})-(\d{2})-(\d{2})Z-(manual|scheduled)(?:-\d+)?\.dump$/,
  produce: async (outPath) => {
    const url = (process.env.DATABASE_URL ?? '').split('?')[0];
    if (!url) throw new Error('DATABASE_URL is not set');
    await dumpDatabase(url, outPath);
  },
};

export const MEDIA_BACKUP_KIND: BackupKind = {
  id: 'media',
  prefix: 'vmt-media-',
  ext: '.tar.gz',
  max: 3,
  nameRe:
    /^vmt-media-(\d{4}-\d{2}-\d{2})T(\d{2})-(\d{2})-(\d{2})Z-(manual|scheduled)(?:-\d+)?\.tar\.gz$/,
  produce: (outPath) => archiveUploads(outPath),
};

export const BACKUP_KINDS: BackupKind[] = [DB_BACKUP_KIND, MEDIA_BACKUP_KIND];

export function getBackupKind(id: string): BackupKind | null {
  return BACKUP_KINDS.find((k) => k.id === id) ?? null;
}

export function parseAnyBackupFilename(
  name: string,
): {kind: BackupKindId; createdAt: string; source: BackupSource} | null {
  for (const kind of BACKUP_KINDS) {
    const parsed = parseBackupFilename(kind, name);
    if (parsed) return {kind: kind.id, ...parsed};
  }
  return null;
}
