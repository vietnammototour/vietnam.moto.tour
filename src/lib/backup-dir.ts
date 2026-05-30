import path from 'path';

export function getBackupDir(): string {
  return process.env.BACKUP_DIR ?? path.join(process.cwd(), '.backups');
}

export function resolveBackupPath(filename: string): string {
  if (path.isAbsolute(filename)) {
    throw new Error(`absolute path not allowed: ${filename}`);
  }
  const root = getBackupDir();
  const resolved = path.resolve(root, filename);
  if (resolved !== root && !resolved.startsWith(root + path.sep)) {
    throw new Error(`path traversal blocked: ${filename}`);
  }
  return resolved;
}
