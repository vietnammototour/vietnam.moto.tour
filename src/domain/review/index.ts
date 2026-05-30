export type Review = {
  id: string;
  tourId: string;
  reviewerName: string;
  reviewerLocation: string | null;
  avatarUrl: string | null;
  rating: number;
  title: string;
  body: string;
  reviewDate: string;
  sourceUrl: string;
  images: string[];
  isFeatured: boolean;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
};
