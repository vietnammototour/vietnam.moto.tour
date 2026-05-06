import type {NextApiRequest, NextApiResponse} from 'next';
import fs from 'fs';
import {getUploadDir} from '@/lib/upload-dir';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).end();
  }

  const dir = getUploadDir();

  try {
    await fs.promises.access(dir, fs.constants.W_OK);
  } catch {
    return res.status(503).json({writable: false, freeBytes: 0, dir});
  }

  let freeBytes = 0;
  try {
    const stat = await fs.promises.statfs(dir);
    freeBytes = stat.bavail * stat.bsize;
  } catch {
    // fall through
  }

  return res.status(200).json({writable: true, freeBytes, dir});
}
