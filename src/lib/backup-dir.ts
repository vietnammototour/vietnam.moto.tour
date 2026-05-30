import path from 'path';

export function getBackupDir(): string {
  return process.env.BACKUP_DIR ?? path.join(process.cwd(), '.backups');
}

export function resolveBackupPath(relative: string): string {
  if (path.isAbsolute(relative)) {
    throw new Error(`absolute path not allowed: ${relative}`);
  }
  const root = getBackupDir();
  const resolved = path.resolve(root, relative);
  if (resolved !== root && !resolved.startsWith(root + path.sep)) {
    throw new Error(`path traversal blocked: ${relative}`);
  }
  return resolved;
}
