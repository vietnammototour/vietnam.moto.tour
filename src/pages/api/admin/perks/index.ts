import type {NextApiRequest, NextApiResponse} from 'next';
import type {PerkCategory} from '@prisma/client';
import {prisma} from '@/lib/prisma';
import {requireAdmin} from '@/lib/admin-auth';

const VALID_CATEGORIES: PerkCategory[] = [
  'TRANSPORT',
  'FOOD',
  'ACCOMMODATION',
  'GUIDE',
  'SUPPORT',
  'OTHER',
];

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const isAuthed = await requireAdmin(req, res);
  if (!isAuthed) return;

  if (req.method === 'GET') {
    const where: Record<string, unknown> = {};
    if (
      typeof req.query.category === 'string' &&
      VALID_CATEGORIES.includes(req.query.category as PerkCategory)
    ) {
      where.category = req.query.category;
    }
    if (typeof req.query.search === 'string' && req.query.search.length > 0) {
      const s = req.query.search;
      where.OR = [
        {labelEn: {contains: s, mode: 'insensitive'}},
        {labelVi: {contains: s, mode: 'insensitive'}},
      ];
    }
    const perks = await prisma.perk.findMany({
      where,
      orderBy: [{category: 'asc'}, {labelEn: 'asc'}],
    });
    return res.json(perks);
  }

  if (req.method === 'POST') {
    const {labelEn, labelVi, icon, category} = req.body ?? {};
    if (!labelEn || typeof labelEn !== 'string') {
      return res.status(400).json({error: 'labelEn is required'});
    }
    if (!VALID_CATEGORIES.includes(category)) {
      return res.status(400).json({error: 'category is invalid'});
    }
    const perk = await prisma.perk.create({
      data: {
        labelEn,
        labelVi: labelVi ?? '',
        icon: icon ?? '',
        category,
      },
    });
    return res.status(201).json(perk);
  }

  res.setHeader('Allow', 'GET, POST');
  return res.status(405).json({error: 'Method not allowed'});
}
