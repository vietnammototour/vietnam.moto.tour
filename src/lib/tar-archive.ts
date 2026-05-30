import {spawn} from 'child_process';
import {existsSync} from 'fs';
import {getUploadDir} from './upload-dir';

export function buildTarArgs(uploadDir: string, outPath: string): string[] {
  return ['-czf', outPath, '-C', uploadDir, '.'];
}

/**
 * Archives the entire UPLOAD_DIR tree to a gzip tarball at outPath.
 * Rejects (with stderr) on nonzero exit or spawn failure; rejects if
 * UPLOAD_DIR does not exist.
 */
export function archiveUploads(outPath: string): Promise<void> {
  const uploadDir = getUploadDir();
  if (!existsSync(uploadDir)) {
    return Promise.reject(new Error(`UPLOAD_DIR does not exist: ${uploadDir}`));
  }
  const bin = process.env.TAR_BIN ?? 'tar';
  const args = buildTarArgs(uploadDir, outPath);

  return new Promise((resolve, reject) => {
    const child = spawn(bin, args, {stdio: ['ignore', 'ignore', 'pipe']});
    let stderr = '';
    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });
    child.on('error', (err) => reject(err));
    child.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`tar exited with code ${code}: ${stderr.trim()}`));
    });
  });
}
