import fs from 'fs';
import {existsSync} from 'fs';
import path from 'path';
import {getBackupDir, resolveBackupPath} from './backup-dir';

export type BackupSource = 'manual' | 'scheduled';
export type BackupKindId = 'db' | 'media';

export type BackupKind = {
  id: BackupKindId;
  prefix: string;
  ext: string;
  max: number;
  nameRe: RegExp;
  produce: (outPath: string) => Promise<void>;
};

export type BackupMeta = {
  filename: string;
  createdAt: string;
  source: BackupSource;
  byteSize: number;
  kind: BackupKindId;
};

export function formatBackupFilename(
  kind: BackupKind,
  date: Date,
  source: BackupSource,
): string {
  const ts = date.toISOString().replace(/\.\d{3}Z$/, 'Z').replace(/:/g, '-');
  return `${kind.prefix}${ts}-${source}${kind.ext}`;
}

export function parseBackupFilename(
  kind: BackupKind,
  name: string,
): {createdAt: string; source: BackupSource} | null {
  const m = name.match(kind.nameRe);
  if (!m) return null;
  const [, date, hh, mm, ss, source] = m;
  return {createdAt: `${date}T${hh}:${mm}:${ss}Z`, source: source as BackupSource};
}

export async function listBackups(kind: BackupKind): Promise<BackupMeta[]> {
  const dir = getBackupDir();
  let names: string[];
  try {
    names = await fs.promises.readdir(dir);
  } catch {
    return [];
  }
  const metas: BackupMeta[] = [];
  for (const name of names) {
    const parsed = parseBackupFilename(kind, name);
    if (!parsed) continue;
    const stat = await fs.promises.stat(path.join(dir, name));
    metas.push({
      filename: name,
      createdAt: parsed.createdAt,
      source: parsed.source,
      byteSize: stat.size,
      kind: kind.id,
    });
  }
  metas.sort(
    (a, b) =>
      b.createdAt.localeCompare(a.createdAt) ||
      b.filename.localeCompare(a.filename),
  );
  return metas;
}

export async function enforceRetention(kind: BackupKind): Promise<void> {
  const metas = await listBackups(kind);
  for (const m of metas.slice(kind.max)) {
    await fs.promises.rm(resolveBackupPath(m.filename), {force: true});
  }
}

export function nextAvailableFilename(
  kind: BackupKind,
  date: Date,
  source: BackupSource,
): string {
  const base = formatBackupFilename(kind, date, source);
  const dir = getBackupDir();
  if (!existsSync(path.join(dir, base))) return base;
  const stem = base.slice(0, -kind.ext.length);
  let n = 2;
  while (existsSync(path.join(dir, `${stem}-${n}${kind.ext}`))) n++;
  return `${stem}-${n}${kind.ext}`;
}

async function statToMeta(
  kind: BackupKind,
  filename: string,
): Promise<BackupMeta> {
  const parsed = parseBackupFilename(kind, filename);
  if (!parsed) throw new Error(`not a ${kind.id} backup filename: ${filename}`);
  const stat = await fs.promises.stat(resolveBackupPath(filename));
  return {
    filename,
    createdAt: parsed.createdAt,
    source: parsed.source,
    byteSize: stat.size,
    kind: kind.id,
  };
}

export async function createBackup(
  kind: BackupKind,
  source: BackupSource,
): Promise<BackupMeta> {
  const dir = getBackupDir();
  await fs.promises.mkdir(dir, {recursive: true});

  const filename = nextAvailableFilename(kind, new Date(), source);
  const abs = resolveBackupPath(filename);

  try {
    await kind.produce(abs);
  } catch (err) {
    await fs.promises.rm(abs, {force: true});
    throw err;
  }

  await enforceRetention(kind);
  return statToMeta(kind, filename);
}
