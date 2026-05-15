import type {NextApiRequest, NextApiResponse} from 'next';
import bcrypt from 'bcrypt';
import {prisma} from '@/lib/prisma';
import {requireAdmin} from '@/lib/admin-auth';
import {toUserAdmin} from '@/domain/user/mapper';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const isAuthed = await requireAdmin(req, res);
  if (!isAuthed) return;

  if (req.method === 'GET') {
    const rows = await prisma.user.findMany({
      orderBy: [{isCoreTeam: 'desc'}, {teamOrder: 'asc'}, {name: 'asc'}],
      include: {orgRole: true, image: true},
    });
    return res.json(rows.map(toUserAdmin));
  }

  if (req.method === 'POST') {
    const {
      name,
      email,
      password,
      orgRoleId,
      bioVi,
      bioEn,
      birthDate,
      imageId,
      isCoreTeam,
      allowAuth,
      teamOrder,
    } = req.body ?? {};

    if (typeof name !== 'string' || name.length === 0) {
      return res.status(400).json({error: 'name is required'});
    }
    if (typeof orgRoleId !== 'string' || orgRoleId.length === 0) {
      return res.status(400).json({error: 'orgRoleId is required'});
    }
    const role = await prisma.orgRole.findUnique({where: {id: orgRoleId}});
    if (!role) return res.status(400).json({error: 'orgRoleId not found'});

    const authOn = allowAuth === true || allowAuth === undefined;
    if (authOn && (typeof email !== 'string' || email.length === 0)) {
      return res
        .status(400)
        .json({error: 'email is required when allowAuth=true'});
    }
    if (authOn && (typeof password !== 'string' || password.length < 8)) {
      return res
        .status(400)
        .json({error: 'password (>=8 chars) is required when allowAuth=true'});
    }
    if (imageId != null && typeof imageId !== 'string') {
      return res.status(400).json({error: 'imageId must be a string or null'});
    }
    if (imageId) {
      const img = await prisma.collectionImage.findUnique({
        where: {id: imageId},
      });
      if (!img) return res.status(400).json({error: 'imageId not found'});
    }

    const data = {
      name,
      email: typeof email === 'string' && email.length > 0 ? email : null,
      passwordHash: authOn ? await bcrypt.hash(password, 10) : null,
      orgRoleId,
      bioVi: typeof bioVi === 'string' ? bioVi : '',
      bioEn: typeof bioEn === 'string' ? bioEn : '',
      birthDate:
        typeof birthDate === 'string' && birthDate.length > 0
          ? new Date(birthDate)
          : null,
      imageId: imageId ?? null,
      isCoreTeam: isCoreTeam === true,
      allowAuth: authOn,
      teamOrder: typeof teamOrder === 'number' ? teamOrder : 0,
    };

    const row = await prisma.user.create({
      data,
      include: {orgRole: true, image: true},
    });
    return res.status(201).json(toUserAdmin(row));
  }

  res.setHeader('Allow', 'GET, POST');
  return res.status(405).json({error: 'Method not allowed'});
}
