import {render, screen} from '@testing-library/react';
import {ReviewCard} from './ReviewCard';
import type {Review} from '@/domain';

const review: Review = {
  id: 'r1',
  tourId: 't1',
  reviewerName: 'Jane Doe',
  reviewerLocation: 'London, UK',
  avatarUrl: null,
  rating: 5,
  title: 'Unforgettable',
  body: 'Best trip ever.',
  reviewDate: '2026-01-10T00:00:00.000Z',
  sourceUrl: 'https://www.tripadvisor.com/review/r1',
  images: ['https://www.tripadvisor.com/media/1'],
  isFeatured: true,
  displayOrder: 0,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

describe('ReviewCard', () => {
  it('renders reviewer name, location, title and body', () => {
    render(<ReviewCard review={review} verifyLabel="Verified on TripAdvisor" />);
    expect(screen.getByText('Jane Doe')).toBeInTheDocument();
    expect(screen.getByText('London, UK')).toBeInTheDocument();
    expect(screen.getByText('Unforgettable')).toBeInTheDocument();
    expect(screen.getByText('Best trip ever.')).toBeInTheDocument();
  });

  it('links the verify CTA to sourceUrl with safe rel', () => {
    render(<ReviewCard review={review} verifyLabel="Verified on TripAdvisor" />);
    const link = screen.getByRole('link', {name: 'Verified on TripAdvisor'});
    expect(link).toHaveAttribute('href', review.sourceUrl);
    expect(link).toHaveAttribute('rel', expect.stringContaining('noopener'));
  });

  it('renders a photo link per image URL', () => {
    render(<ReviewCard review={review} verifyLabel="Verified on TripAdvisor" />);
    expect(screen.getByRole('link', {name: /photo 1/i})).toHaveAttribute(
      'href',
      'https://www.tripadvisor.com/media/1',
    );
  });

  it('shows initials when there is no avatar', () => {
    render(<ReviewCard review={review} verifyLabel="Verified on TripAdvisor" />);
    expect(screen.getByText('JD')).toBeInTheDocument();
  });
});
