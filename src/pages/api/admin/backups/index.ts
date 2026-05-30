import type {NextApiRequest, NextApiResponse} from 'next';
import {requireAdmin} from '@/lib/admin-auth';
import {listBackups, createBackup, MAX_BACKUPS} from '@/lib/db-backup';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const isAdmin = await requireAdmin(req, res);
  if (!isAdmin) return;

  if (req.method === 'GET') {
    const backups = await listBackups();
    return res.status(200).json({backups, maxBackups: MAX_BACKUPS});
  }

  if (req.method === 'POST') {
    try {
      await createBackup('manual');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Backup failed';
      return res.status(500).json({error: message});
    }
    const backups = await listBackups();
    return res.status(201).json({backups, maxBackups: MAX_BACKUPS});
  }

  res.setHeader('Allow', 'GET, POST');
  return res.status(405).json({error: 'Method not allowed'});
}
