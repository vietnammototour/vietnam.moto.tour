import type {NextApiRequest, NextApiResponse} from 'next';
import {prisma} from '@/lib/prisma';
import {withApiHandler} from '@/lib/api-handler';

function sanitizeImages(input: unknown): string[] {
  if (!Array.isArray(input)) return [];
  return input
    .filter((u): u is string => typeof u === 'string' && u.trim().length > 0)
    .slice(0, 5);
}

async function handler(req: NextApiRequest, res: NextApiResponse) {

  if (req.method === 'GET') {
    const reviews = await prisma.review.findMany({
      orderBy: [{isFeatured: 'desc'}, {displayOrder: 'asc'}, {reviewDate: 'desc'}],
      include: {tour: {select: {id: true, slug: true, titleEn: true}}},
    });
    return res.json(reviews);
  }

  if (req.method === 'POST') {
    const b = req.body ?? {};
    if (!b.tourId || typeof b.tourId !== 'string') {
      return res.status(400).json({error: 'tourId is required'});
    }
    if (!b.reviewerName || typeof b.reviewerName !== 'string') {
      return res.status(400).json({error: 'reviewerName is required'});
    }
    if (!b.sourceUrl || typeof b.sourceUrl !== 'string') {
      return res.status(400).json({error: 'sourceUrl is required'});
    }
    const rating = Number(b.rating);
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return res.status(400).json({error: 'rating must be 1-5'});
    }
    const reviewDate = new Date(b.reviewDate);
    if (Number.isNaN(reviewDate.getTime())) {
      return res.status(400).json({error: 'reviewDate is invalid'});
    }
    const tour = await prisma.tour.findUnique({where: {id: b.tourId}});
    if (!tour) return res.status(400).json({error: 'tour not found'});

    const review = await prisma.review.create({
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
    return res.status(201).json(review);
  }

  res.setHeader('Allow', 'GET, POST');
  return res.status(405).json({error: 'Method not allowed'});
}

export default withApiHandler(handler, {requireAdmin: true});
