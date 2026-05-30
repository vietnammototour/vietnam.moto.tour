import type {NextApiRequest, NextApiResponse} from 'next';
import {requireAdmin} from '@/lib/admin-auth';
import {listBackups, createBackup} from '@/lib/backup-core';
import {getBackupKind, DB_BACKUP_KIND} from '@/lib/backup-kinds';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const isAdmin = await requireAdmin(req, res);
  if (!isAdmin) return;

  const rawKind = req.query.kind;
  const kindId = Array.isArray(rawKind) ? rawKind[0] : rawKind;
  const kind = kindId ? getBackupKind(kindId) : DB_BACKUP_KIND;
  if (!kind) {
    return res.status(400).json({error: 'Invalid backup kind'});
  }

  if (req.method === 'GET') {
    const backups = await listBackups(kind);
    return res.status(200).json({backups, maxBackups: kind.max});
  }

  if (req.method === 'POST') {
    try {
      await createBackup(kind, 'manual');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Backup failed';
      return res.status(500).json({error: message});
    }
    const backups = await listBackups(kind);
    return res.status(201).json({backups, maxBackups: kind.max});
  }

  res.setHeader('Allow', 'GET, POST');
  return res.status(405).json({error: 'Method not allowed'});
}
