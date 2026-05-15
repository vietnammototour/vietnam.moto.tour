import type {NextApiRequest, NextApiResponse} from 'next';
import {prisma} from '@/lib/prisma';
import {requireAdmin} from '@/lib/admin-auth';
import {toOrgRole} from '@/domain/org-role/mapper';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const isAuthed = await requireAdmin(req, res);
  if (!isAuthed) return;

  const id = typeof req.query.id === 'string' ? req.query.id : '';
  if (!id) return res.status(400).json({error: 'id required'});

  if (req.method === 'GET') {
    const row = await prisma.orgRole.findUnique({where: {id}});
    if (!row) return res.status(404).json({error: 'Not found'});
    return res.json(toOrgRole(row));
  }

  if (req.method === 'PUT') {
    const {labelVi, labelEn, order, key} = req.body ?? {};
    if (typeof key === 'string') {
      const current = await prisma.orgRole.findUnique({where: {id}});
      if (current && current.key !== key)
        return res.status(400).json({error: 'key is immutable'});
    }
    if (labelVi !== undefined && typeof labelVi !== 'string') {
      return res.status(400).json({error: 'labelVi must be a string'});
    }
    if (labelEn !== undefined && typeof labelEn !== 'string') {
      return res.status(400).json({error: 'labelEn must be a string'});
    }
    try {
      const row = await prisma.orgRole.update({
        where: {id},
        data: {
          ...(labelVi !== undefined ? {labelVi} : {}),
          ...(labelEn !== undefined ? {labelEn} : {}),
          ...(typeof order === 'number' ? {order} : {}),
        },
      });
      return res.json(toOrgRole(row));
    } catch {
      return res.status(404).json({error: 'Not found'});
    }
  }

  if (req.method === 'DELETE') {
    const inUse = await prisma.user.count({where: {orgRoleId: id}});
    if (inUse > 0) return res.status(409).json({error: 'Role in use'});
    try {
      await prisma.orgRole.delete({where: {id}});
      return res.status(204).end();
    } catch {
      return res.status(404).json({error: 'Not found'});
    }
  }

  res.setHeader('Allow', 'GET, PUT, DELETE');
  return res.status(405).json({error: 'Method not allowed'});
}
