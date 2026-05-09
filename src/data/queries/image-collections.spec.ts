import {getImageCollection} from './image-collections';
import {prisma} from '@/lib/prisma';

jest.mock('@/lib/prisma', () => ({
  prisma: {imageCollection: {findUnique: jest.fn()}},
}));

describe('getImageCollection', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns mapped collection with ordered images', async () => {
    (prisma.imageCollection.findUnique as jest.Mock).mockResolvedValue({
      id: 'c1',
      key: 'home-gallery',
      label: 'Home',
      createdAt: new Date(),
      updatedAt: new Date(),
      images: [
        {
          id: 'i1',
          collectionId: 'c1',
          url: '/a.webp',
          altEn: 'a',
          altVi: 'av',
          order: 0,
          createdAt: new Date(),
        },
        {
          id: 'i2',
          collectionId: 'c1',
          url: '/b.webp',
          altEn: 'b',
          altVi: 'bv',
          order: 1,
          createdAt: new Date(),
        },
      ],
    });
    const result = await getImageCollection('home-gallery');
    expect(result).toEqual({
      id: 'c1',
      key: 'home-gallery',
      label: 'Home',
      images: [
        {
          id: 'i1',
          collectionId: 'c1',
          url: '/a.webp',
          altEn: 'a',
          altVi: 'av',
          order: 0,
        },
        {
          id: 'i2',
          collectionId: 'c1',
          url: '/b.webp',
          altEn: 'b',
          altVi: 'bv',
          order: 1,
        },
      ],
    });
  });

  it('returns null when missing', async () => {
    (prisma.imageCollection.findUnique as jest.Mock).mockResolvedValue(null);
    expect(await getImageCollection('missing')).toBeNull();
  });
});
