import type {NextApiRequest, NextApiResponse} from 'next';
import {getServerSession} from 'next-auth';
import {prisma} from '@/lib/prisma';
import {requireAdmin} from '@/lib/admin-auth';
import {authOptions} from '@/lib/auth';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const isAuthed = await requireAdmin(req, res);
  if (!isAuthed) return;

  const id = req.query.id as string;

  if (req.method === 'DELETE') {
    const session = await getServerSession(req, res, authOptions);

    if (session?.user.id === id) {
      return res.status(400).json({error: 'Cannot delete your own account'});
    }

    await prisma.user.delete({where: {id}});
    return res.status(204).end();
  }

  res.setHeader('Allow', 'DELETE');
  return res.status(405).json({error: 'Method not allowed'});
}
