import type {NextApiRequest, NextApiResponse} from 'next';
import bcrypt from 'bcrypt';
import {prisma} from '@/lib/prisma';
import {requireAdmin} from '@/lib/admin-auth';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const isAuthed = await requireAdmin(req, res);
  if (!isAuthed) return;

  if (req.method === 'GET') {
    const users = await prisma.user.findMany({
      select: {id: true, email: true, name: true, role: true, createdAt: true},
      orderBy: {createdAt: 'desc'},
    });
    return res.json(users);
  }

  if (req.method === 'POST') {
    const {email, name, password} = req.body;

    if (!email || !password || !name) {
      return res
        .status(400)
        .json({error: 'Email, name, and password are required'});
    }

    const existing = await prisma.user.findUnique({where: {email}});
    if (existing) {
      return res
        .status(409)
        .json({error: 'User with this email already exists'});
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: {email, name, passwordHash, role: 'ADMIN'},
      select: {id: true, email: true, name: true, role: true, createdAt: true},
    });
    return res.status(201).json(user);
  }

  res.setHeader('Allow', 'GET, POST');
  return res.status(405).json({error: 'Method not allowed'});
}
