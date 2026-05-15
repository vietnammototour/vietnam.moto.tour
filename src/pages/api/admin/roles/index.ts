import type {NextApiRequest, NextApiResponse} from 'next';
import {prisma} from '@/lib/prisma';
import {requireAdmin} from '@/lib/admin-auth';
import {toOrgRole} from '@/domain/org-role/mapper';

const KEY_REGEX = /^[a-z][a-z0-9_]*$/;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const isAuthed = await requireAdmin(req, res);
  if (!isAuthed) return;

  if (req.method === 'GET') {
    const rows = await prisma.orgRole.findMany({orderBy: {order: 'asc'}});
    return res.json(rows.map(toOrgRole));
  }

  if (req.method === 'POST') {
    const {key, labelVi, labelEn, order} = req.body ?? {};
    if (typeof key !== 'string' || !KEY_REGEX.test(key)) {
      return res.status(400).json({error: 'key must be lowercase snake_case'});
    }
    if (typeof labelVi !== 'string')
      return res.status(400).json({error: 'labelVi must be a string'});
    if (typeof labelEn !== 'string')
      return res.status(400).json({error: 'labelEn must be a string'});
    const existing = await prisma.orgRole.findUnique({where: {key}});
    if (existing) return res.status(409).json({error: 'key already in use'});
    const row = await prisma.orgRole.create({
      data: {
        key,
        labelVi,
        labelEn,
        order: typeof order === 'number' ? order : 0,
      },
    });
    return res.status(201).json(toOrgRole(row));
  }

  res.setHeader('Allow', 'GET, POST');
  return res.status(405).json({error: 'Method not allowed'});
}
