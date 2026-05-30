import {spawn} from 'child_process';

export function buildPgDumpArgs(databaseUrl: string, outPath: string): string[] {
  return [
    '--format=custom',
    '--no-owner',
    '--no-privileges',
    `--file=${outPath}`,
    `--dbname=${databaseUrl}`,
  ];
}

/**
 * Runs pg_dump to write a custom-format dump at outPath.
 * databaseUrl must already be stripped of non-libpq query params.
 * Rejects (with stderr) on nonzero exit or spawn failure.
 */
export function dumpDatabase(databaseUrl: string, outPath: string): Promise<void> {
  const bin = process.env.PG_DUMP_BIN ?? 'pg_dump';
  const args = buildPgDumpArgs(databaseUrl, outPath);

  return new Promise((resolve, reject) => {
    const child = spawn(bin, args, {stdio: ['ignore', 'ignore', 'pipe']});
    let stderr = '';
    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });
    child.on('error', (err) => reject(err));
    child.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`pg_dump exited with code ${code}: ${stderr.trim()}`));
    });
  });
}
