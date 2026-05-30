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

export async function listBackups(): Promise<BackupMeta[]> {
  const dir = getBackupDir();
  let names: string[];
  try {
    names = await fs.promises.readdir(dir);
  } catch {
    return [];
  }
  const metas: BackupMeta[] = [];
  for (const name of names) {
    const parsed = parseBackupFilename(name);
    if (!parsed) continue;
    const stat = await fs.promises.stat(path.join(dir, name));
    metas.push({
      filename: name,
      createdAt: parsed.createdAt,
      source: parsed.source,
      byteSize: stat.size,
    });
  }
  metas.sort(
    (a, b) =>
      b.createdAt.localeCompare(a.createdAt) ||
      b.filename.localeCompare(a.filename),
  );
  return metas;
}

export async function enforceRetention(max = MAX_BACKUPS): Promise<void> {
  const metas = await listBackups();
  for (const m of metas.slice(max)) {
    await fs.promises.rm(resolveBackupPath(m.filename), {force: true});
  }
}

export function nextAvailableFilename(date: Date, source: BackupSource): string {
  const base = formatBackupFilename(date, source);
  const dir = getBackupDir();
  if (!existsSync(path.join(dir, base))) return base;
  const stem = base.replace(/\.dump$/, '');
  let n = 2;
  while (existsSync(path.join(dir, `${stem}-${n}.dump`))) n++;
  return `${stem}-${n}.dump`;
}

async function statToMeta(filename: string): Promise<BackupMeta> {
  const parsed = parseBackupFilename(filename);
  if (!parsed) throw new Error(`not a backup filename: ${filename}`);
  const stat = await fs.promises.stat(resolveBackupPath(filename));
  return {
    filename,
    createdAt: parsed.createdAt,
    source: parsed.source,
    byteSize: stat.size,
  };
}

export async function createBackup(source: BackupSource): Promise<BackupMeta> {
  const databaseUrl = (process.env.DATABASE_URL ?? '').split('?')[0];
  if (!databaseUrl) throw new Error('DATABASE_URL is not set');

  const dir = getBackupDir();
  await fs.promises.mkdir(dir, {recursive: true});

  const filename = nextAvailableFilename(new Date(), source);
  const abs = resolveBackupPath(filename);

  try {
    await dumpDatabase(databaseUrl, abs);
  } catch (err) {
    await fs.promises.rm(abs, {force: true});
    throw err;
  }

  await enforceRetention();
  return statToMeta(filename);
}
