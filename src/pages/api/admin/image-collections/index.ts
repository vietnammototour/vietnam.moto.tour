import type {NextApiRequest, NextApiResponse} from 'next';
import {prisma} from '@/lib/prisma';
import {requireAdmin} from '@/lib/admin-auth';

const KEY_RE = /^[a-z0-9-]+$/;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (!(await requireAdmin(req, res))) return;

  if (req.method === 'GET') {
    const rows = await prisma.imageCollection.findMany({
      orderBy: {label: 'asc'},
      include: {_count: {select: {images: true}}},
    });
    return res.json(
      rows.map((r: (typeof rows)[number]) => ({
        id: r.id,
        key: r.key,
        label: r.label,
        imageCount: r._count.images,
      })),
    );
  }

  if (req.method === 'POST') {
    const {key, label} = req.body ?? {};
    if (typeof key !== 'string' || !KEY_RE.test(key)) {
      return res.status(400).json({error: 'key must match [a-z0-9-]+'});
    }
    if (typeof label !== 'string' || label.trim().length === 0) {
      return res.status(400).json({error: 'label is required'});
    }
    const existing = await prisma.imageCollection.findUnique({where: {key}});
    if (existing) return res.status(409).json({error: 'key already exists'});
    const created = await prisma.imageCollection.create({data: {key, label}});
    return res.status(201).json(created);
  }

  res.setHeader('Allow', 'GET, POST');
  return res.status(405).json({error: 'Method not allowed'});
}
