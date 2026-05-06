import fs from 'fs';
import path from 'path';
import {prisma} from '@/lib/prisma';
import {getUploadDir} from '@/lib/upload-dir';

export async function sweepOrphans(opts: {
  rootDir: string;
  referencedHashes: Set<string>;
  olderThanMs: number;
}) {
  const cutoff = Date.now() - opts.olderThanMs;
  walk(opts.rootDir, (file) => {
    const m = path.basename(file).match(/\.([0-9a-f]{8})\.webp$/);
    if (!m) return;
    if (opts.referencedHashes.has(m[1])) return;
    const stat = fs.statSync(file);
    if (stat.mtimeMs > cutoff) return;
    fs.unlinkSync(file);
    console.log(`unlinked ${file}`);
  });
}

function walk(dir: string, cb: (file: string) => void) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, {withFileTypes: true})) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, cb);
    else if (entry.isFile()) cb(full);
  }
}

async function buildReferencedHashes(): Promise<Set<string>> {
  const hashes = new Set<string>();
  const HASH_RE = /\.([0-9a-f]{8})\.webp$/;
  function add(url: string | null | undefined) {
    if (!url) return;
    const m = url.match(HASH_RE);
    if (m) hashes.add(m[1]);
  }
  for (const t of await prisma.tour.findMany({select: {imageUrl: true}}))
    add(t.imageUrl);
  for (const d of await prisma.destination.findMany({
    select: {imageUrl: true, heroImage: true},
  })) {
    add(d.imageUrl);
    add(d.heroImage);
  }
  for (const h of await prisma.highlight.findMany({select: {imageUrl: true}}))
    add(h.imageUrl);
  return hashes;
}

async function main() {
  const referencedHashes = await buildReferencedHashes();
  await sweepOrphans({
    rootDir: getUploadDir(),
    referencedHashes,
    olderThanMs: 7 * 24 * 3600 * 1000,
  });
}

if (require.main === module) {
  main().then(() => process.exit(0));
}
