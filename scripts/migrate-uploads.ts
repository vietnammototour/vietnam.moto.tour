// scripts/migrate-uploads.ts
import {prisma} from '@/lib/prisma';
import {getUploadDir} from '@/lib/upload-dir';
import path from 'path';
import fs from 'fs';

const dryRun = process.argv.includes('--dry-run');
const REPO_ROOT = process.cwd();
const LEGACY_ROOT = path.join(REPO_ROOT, 'public/uploads');
const TARGET_ROOT = getUploadDir();

type Op = {entityType: string; id: string; field: string; url: string};

async function main() {
  if (LEGACY_ROOT === TARGET_ROOT) {
    console.error('LEGACY_ROOT == TARGET_ROOT, refusing to run');
    process.exit(1);
  }

  const ops: Op[] = [];

  for (const t of await prisma.tour.findMany({
    select: {id: true, imageUrl: true},
  })) {
    if (t.imageUrl)
      ops.push({
        entityType: 'tour',
        id: t.id,
        field: 'imageUrl',
        url: t.imageUrl,
      });
  }
  for (const d of await prisma.destination.findMany({
    select: {id: true, imageUrl: true, heroImage: true},
  })) {
    if (d.imageUrl)
      ops.push({
        entityType: 'destination',
        id: d.id,
        field: 'imageUrl',
        url: d.imageUrl,
      });
    if (d.heroImage)
      ops.push({
        entityType: 'destination',
        id: d.id,
        field: 'heroImage',
        url: d.heroImage,
      });
  }
  for (const h of await prisma.highlight.findMany({
    select: {id: true, imageUrl: true},
  })) {
    if (h.imageUrl)
      ops.push({
        entityType: 'highlight',
        id: h.id,
        field: 'imageUrl',
        url: h.imageUrl,
      });
  }

  for (const op of ops) {
    const rel = op.url.replace(/^\/uploads\//, '');
    const src = path.join(LEGACY_ROOT, rel);
    const dst = path.join(TARGET_ROOT, rel);
    const exists = fs.existsSync(src);
    const already = fs.existsSync(dst);
    console.log(
      `[${dryRun ? 'DRY' : 'RUN'}] ${op.entityType}/${op.id} ${op.field} ${op.url} (src:${exists} dst:${already})`,
    );
    if (dryRun) continue;
    if (already) continue;
    if (!exists) continue;
    fs.mkdirSync(path.dirname(dst), {recursive: true});
    fs.renameSync(src, dst);
  }
}

main().then(() => process.exit(0));
