import type {Review as PrismaReview} from '@prisma/client';
import type {Review} from './index';

export function toReview(row: PrismaReview): Review {
  return {
    id: row.id,
    tourId: row.tourId,
    reviewerName: row.reviewerName,
    reviewerLocation: row.reviewerLocation,
    avatarUrl: row.avatarUrl,
    rating: row.rating,
    title: row.title,
    body: row.body,
    reviewDate: row.reviewDate.toISOString(),
    sourceUrl: row.sourceUrl,
    images: (row.images as unknown as string[] | null) ?? [],
    isFeatured: row.isFeatured,
    displayOrder: row.displayOrder,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}
