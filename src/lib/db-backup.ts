import fs from 'fs';
import {existsSync} from 'fs';
import path from 'path';
import {getBackupDir, resolveBackupPath} from './backup-dir';
import {dumpDatabase} from './pg-dump';

export const MAX_BACKUPS = 10;

export type BackupSource = 'manual' | 'scheduled';

export type BackupMeta = {
  filename: string;
  createdAt: string; // ISO-8601, e.g. 2026-05-30T03:00:12Z
  source: BackupSource;
  byteSize: number;
};

const NAME_RE =
  /^vmt-(\d{4}-\d{2}-\d{2})T(\d{2})-(\d{2})-(\d{2})Z-(manual|scheduled)(?:-\d+)?\.dump$/;

export function formatBackupFilename(date: Date, source: BackupSource): string {
  const ts = date.toISOString().replace(/\.\d{3}Z$/, 'Z').replace(/:/g, '-');
  return `vmt-${ts}-${source}.dump`;
}

export function parseBackupFilename(
  name: string,
): {createdAt: string; source: BackupSource} | null {
  const m = name.match(NAME_RE);
  if (!m) return null;
  const [, date, hh, mm, ss, source] = m;
  return {createdAt: `${date}T${hh}:${mm}:${ss}Z`, source: source as BackupSource};
}
