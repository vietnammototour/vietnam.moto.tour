import type {NextApiRequest, NextApiResponse} from 'next';
import fs from 'fs';
import {requireAdmin} from '@/lib/admin-auth';
import {resolveBackupPath} from '@/lib/backup-dir';
import {parseAnyBackupFilename} from '@/lib/backup-kinds';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const isAdmin = await requireAdmin(req, res);
  if (!isAdmin) return;

  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({error: 'Method not allowed'});
  }

  const raw = req.query.filename;
  const filename = Array.isArray(raw) ? raw[0] : raw;
  if (!filename || !parseAnyBackupFilename(filename)) {
    return res.status(400).json({error: 'Invalid backup filename'});
  }

  let abs: string;
  try {
    abs = resolveBackupPath(filename);
  } catch {
    return res.status(400).json({error: 'Invalid backup filename'});
  }

  let stat: fs.Stats;
  try {
    stat = await fs.promises.stat(abs);
  } catch {
    return res.status(404).json({error: 'Backup not found'});
  }

  res.setHeader('Content-Type', 'application/octet-stream');
  res.setHeader('Content-Length', stat.size);
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

  const stream = fs.createReadStream(abs);
  stream.pipe(res);
  await new Promise((resolve, reject) => {
    stream.on('end', resolve);
    stream.on('error', reject);
  });
}
