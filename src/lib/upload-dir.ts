import path from 'path';

export function getUploadDir(): string {
  return process.env.UPLOAD_DIR ?? path.join(process.cwd(), '.uploads');
}

export function resolveUploadPath(relative: string): string {
  if (path.isAbsolute(relative)) {
    throw new Error(`absolute path not allowed: ${relative}`);
  }
  const root = getUploadDir();
  const resolved = path.resolve(root, relative);
  if (resolved !== root && !resolved.startsWith(root + path.sep)) {
    throw new Error(`path traversal blocked: ${relative}`);
  }
  return resolved;
}
