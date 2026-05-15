import {getServerSession} from 'next-auth/next';
import {authOptions} from './auth';
import {prisma} from './prisma';
import type {NextApiRequest, NextApiResponse} from 'next';

export async function requireAdmin(
  req: NextApiRequest,
  res: NextApiResponse,
): Promise<boolean> {
  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.id) {
    res.status(401).json({error: 'Unauthenticated'});
    return false;
  }
  if (session.user.orgRoleKey !== 'admin') {
    res.status(403).json({error: 'Forbidden'});
    return false;
  }
  const user = await prisma.user.findUnique({
    where: {id: session.user.id},
    select: {allowAuth: true},
  });
  if (!user?.allowAuth) {
    res.status(403).json({error: 'Forbidden'});
    return false;
  }
  return true;
}
