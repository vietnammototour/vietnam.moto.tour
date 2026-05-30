import type {NextApiRequest, NextApiResponse} from 'next';
import {prisma} from '@/lib/prisma';
import {requireAdmin} from '@/lib/admin-auth';

function sanitizeImages(input: unknown): string[] {
  if (!Array.isArray(input)) return [];
  return input
    .filter((u): u is string => typeof u === 'string' && u.trim().length > 0)
    .slice(0, 5);
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const isAuthed = await requireAdmin(req, res);
  if (!isAuthed) return;

  const id = req.query.id;
  if (typeof id !== 'string') {
    return res.status(400).json({error: 'invalid id'});
  }

  if (req.method === 'GET') {
    const review = await prisma.review.findUnique({where: {id}});
    if (!review) return res.status(404).json({error: 'not found'});
    return res.json(review);
  }

  if (req.method === 'PUT') {
    const existing = await prisma.review.findUnique({where: {id}});
    if (!existing) return res.status(404).json({error: 'not found'});
    const b = req.body ?? {};
    const rating = Number(b.rating);
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return res.status(400).json({error: 'rating must be 1-5'});
    }
    const reviewDate = new Date(b.reviewDate);
    if (Number.isNaN(reviewDate.getTime())) {
      return res.status(400).json({error: 'reviewDate is invalid'});
    }
    if (!b.tourId || !b.reviewerName || !b.sourceUrl) {
      return res.status(400).json({error: 'missing required fields'});
    }
    const review = await prisma.review.update({
      where: {id},
      data: {
        tourId: b.tourId,
        reviewerName: b.reviewerName,
        reviewerLocation: b.reviewerLocation || null,
        avatarUrl: b.avatarUrl || null,
        rating,
        title: b.title ?? '',
        body: b.body ?? '',
        reviewDate,
        sourceUrl: b.sourceUrl,
        images: sanitizeImages(b.images),
        isFeatured: Boolean(b.isFeatured),
        displayOrder: Number.isInteger(Number(b.displayOrder))
          ? Number(b.displayOrder)
          : 0,
      },
    });
    return res.json(review);
  }

  if (req.method === 'DELETE') {
    await prisma.review.delete({where: {id}}).catch(() => null);
    return res.status(204).end();
  }

  res.setHeader('Allow', 'GET, PUT, DELETE');
  return res.status(405).json({error: 'Method not allowed'});
}
