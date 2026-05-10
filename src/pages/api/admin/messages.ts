import type {NextApiRequest, NextApiResponse} from 'next';
import {getMessagesFromDb} from '@/data/queries';
import {requireAdmin} from '@/lib/admin-auth';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const isAuthed = await requireAdmin(req, res);
  if (!isAuthed) return;

  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({error: 'Method not allowed'});
  }

  const [en, vi] = await Promise.all([
    getMessagesFromDb('en'),
    getMessagesFromDb('vi'),
  ]);
  return res.json({en: en ?? {}, vi: vi ?? {}});
}
