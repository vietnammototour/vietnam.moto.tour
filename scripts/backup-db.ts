import * as fs from 'fs';
import * as path from 'path';

if (!process.env.DATABASE_URL || !process.env.BACKUP_DIR) {
  const candidatePaths = [
    path.join(__dirname, '..', '.env'),
    path.join(__dirname, '..', '..', '..', '.env'),
  ];
  let envPath: string | null = null;
  for (const p of candidatePaths) {
    if (fs.existsSync(p)) {
      envPath = p;
      break;
    }
  }
  if (envPath) {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    for (const line of envContent.split('\n')) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const eqIndex = trimmed.indexOf('=');
        if (eqIndex > 0) {
          const key = trimmed.substring(0, eqIndex);
          let value = trimmed.substring(eqIndex + 1);
          if (
            (value.startsWith('"') && value.endsWith('"')) ||
            (value.startsWith("'") && value.endsWith("'"))
          ) {
            value = value.slice(1, -1);
          }
          if (!process.env[key]) process.env[key] = value;
        }
      }
    }
  }
}

async function main() {
  const {createBackup} = await import('../src/lib/db-backup');
  const meta = await createBackup('scheduled');
  console.log(
    `[backup-db] created ${meta.filename} (${meta.byteSize} bytes) at ${meta.createdAt}`,
  );
}

main().catch((err) => {
  console.error('[backup-db] failed:', err);
  process.exit(1);
});
