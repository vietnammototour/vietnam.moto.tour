import type {NextApiRequest, NextApiResponse} from 'next';
import fs from 'fs';
import path from 'path';
import {resolveUploadPath} from '@/lib/upload-dir';

const MIME: Record<string, string> = {
  '.webp': 'image/webp',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
};

const PLACEHOLDER = path.join(process.cwd(), 'public/upload-placeholder.svg');

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).end();
  }

  const segments = req.query.path;
  const rel = Array.isArray(segments) ? segments.join('/') : (segments ?? '');

  let abs: string;
  try {
    abs = resolveUploadPath(rel);
  } catch {
    return res.status(400).end();
  }

  const ext = path.extname(abs).toLowerCase();
  const mime = MIME[ext];
  if (!mime) {
    return servePlaceholder(res, 404);
  }

  let stat: fs.Stats;
  try {
    stat = await fs.promises.stat(abs);
  } catch {
    return servePlaceholder(res, 404);
  }

  const base = path.basename(abs, ext);
  const hashMatch = base.match(/\.([0-9a-f]{8})$/);
  const etag = hashMatch
    ? hashMatch[1]
    : `${stat.mtimeMs.toFixed(0)}-${stat.size}`;

  res.setHeader('Content-Type', mime);
  res.setHeader('Content-Length', stat.size);
  res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  res.setHeader('ETag', etag);

  if (req.headers['if-none-match'] === etag) {
    return res.status(304).end();
  }

  const stream = fs.createReadStream(abs);
  stream.pipe(res);
  await new Promise((resolve, reject) => {
    stream.on('end', resolve);
    stream.on('error', reject);
  });
}

async function servePlaceholder(res: NextApiResponse, status: number) {
  try {
    const bytes = await fs.promises.readFile(PLACEHOLDER);
    res.setHeader('Content-Type', 'image/svg+xml');
    res.setHeader('Cache-Control', 'public, max-age=300');
    return res.status(status).send(bytes);
  } catch {
    return res.status(status).end();
  }
}
