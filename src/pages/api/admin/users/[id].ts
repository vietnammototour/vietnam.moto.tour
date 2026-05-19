import type {NextApiRequest, NextApiResponse} from 'next';
import bcrypt from 'bcrypt';
import {getServerSession} from 'next-auth/next';
import {authOptions} from '@/lib/auth';
import {prisma} from '@/lib/prisma';
import {requireAdmin} from '@/lib/admin-auth';
import {toUserAdmin} from '@/domain/user/mapper';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const isAuthed = await requireAdmin(req, res);
  if (!isAuthed) return;

  const id = typeof req.query.id === 'string' ? req.query.id : '';
  if (!id) return res.status(400).json({error: 'id required'});

  if (req.method === 'GET') {
    const row = await prisma.user.findUnique({
      where: {id},
      include: {orgRole: true, image: true},
    });
    if (!row) return res.status(404).json({error: 'Not found'});
    return res.json(toUserAdmin(row));
  }

  if (req.method === 'PUT') {
    const body = req.body ?? {};
    const current = await prisma.user.findUnique({where: {id}});
    if (!current) return res.status(404).json({error: 'Not found'});

    const next: Record<string, unknown> = {};

    if (body.name !== undefined) {
      if (typeof body.name !== 'string' || body.name.length === 0) {
        return res.status(400).json({error: 'name must be non-empty'});
      }
      next.name = body.name;
    }
    if (body.email !== undefined) {
      if (body.email !== null && typeof body.email !== 'string') {
        return res.status(400).json({error: 'email must be a string or null'});
      }
      next.email = body.email === '' ? null : body.email;
    }
    if (body.orgRoleId !== undefined) {
      if (typeof body.orgRoleId !== 'string')
        return res.status(400).json({error: 'orgRoleId required'});
      const role = await prisma.orgRole.findUnique({
        where: {id: body.orgRoleId},
      });
      if (!role) return res.status(400).json({error: 'orgRoleId not found'});
      next.orgRoleId = body.orgRoleId;
    }
    if (body.bioVi !== undefined)
      next.bioVi = typeof body.bioVi === 'string' ? body.bioVi : '';
    if (body.bioEn !== undefined)
      next.bioEn = typeof body.bioEn === 'string' ? body.bioEn : '';
    if (body.birthDate !== undefined) {
      next.birthDate =
        typeof body.birthDate === 'string' && body.birthDate.length > 0
          ? new Date(body.birthDate)
          : null;
    }
    if (body.imageId !== undefined) {
      if (body.imageId !== null && typeof body.imageId !== 'string') {
        return res
          .status(400)
          .json({error: 'imageId must be a string or null'});
      }
      if (body.imageId) {
        const img = await prisma.collectionImage.findUnique({
          where: {id: body.imageId},
        });
        if (!img) return res.status(400).json({error: 'imageId not found'});
      }
      next.imageId = body.imageId;
    }
    if (body.isCoreTeam !== undefined)
      next.isCoreTeam = body.isCoreTeam === true;
    if (body.teamOrder !== undefined && typeof body.teamOrder === 'number') {
      next.teamOrder = body.teamOrder;
    }
    if (body.allowAuth !== undefined) next.allowAuth = body.allowAuth === true;

    if (body.password !== undefined && body.password !== '') {
      if (typeof body.password !== 'string' || body.password.length < 8) {
        return res
          .status(400)
          .json({error: 'password must be at least 8 characters'});
      }
      next.passwordHash = await bcrypt.hash(body.password, 10);
    }

    const futureAllowAuth =
      typeof next.allowAuth === 'boolean' ? next.allowAuth : current.allowAuth;
    const futureEmail =
      'email' in next ? (next.email as string | null) : current.email;
    const futureHasPassword =
      'passwordHash' in next ? !!next.passwordHash : !!current.passwordHash;
    if (futureAllowAuth && (!futureEmail || !futureHasPassword)) {
      return res.status(400).json({
        error: 'allowAuth=true requires email and password',
      });
    }

    try {
      const row = await prisma.user.update({
        where: {id},
        data: next,
        include: {orgRole: true, image: true},
      });
      return res.json(toUserAdmin(row));
    } catch {
      return res.status(404).json({error: 'Not found'});
    }
  }

  if (req.method === 'DELETE') {
    const session = await getServerSession(req, res, authOptions);
    if (session?.user?.id === id) {
      return res.status(400).json({error: 'Cannot delete current user'});
    }
    try {
      await prisma.user.delete({where: {id}});
      return res.status(204).end();
    } catch {
      return res.status(404).json({error: 'Not found'});
    }
  }

  res.setHeader('Allow', 'GET, PUT, DELETE');
  return res.status(405).json({error: 'Method not allowed'});
}
