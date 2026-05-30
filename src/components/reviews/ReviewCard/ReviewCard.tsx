import Image from 'next/image';
import type {Review} from '@/domain';
import {StarRating} from '../StarRating';

type ReviewCardProps = {
  review: Review;
  verifyLabel: string;
  photoLabel?: (n: number) => string;
};

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

function shortDate(iso: string): string {
  return `${iso.slice(0, 4)}.${iso.slice(5, 7)}`;
}

export function ReviewCard({review, verifyLabel, photoLabel}: ReviewCardProps) {
  const label = photoLabel ?? ((n: number) => `Photo ${n}`);
  return (
    <article className="bg-surface-alt p-8 lg:p-10 flex flex-col gap-6">
      <div className="flex items-center gap-4">
        {review.avatarUrl ? (
          <span className="relative h-12 w-12 overflow-hidden rounded-full bg-surface-elevated">
            <Image
              src={review.avatarUrl}
              alt={review.reviewerName}
              fill
              sizes="48px"
              className="object-cover"
            />
          </span>
        ) : (
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-elevated font-mono text-sm text-on-surface-secondary">
            {initials(review.reviewerName)}
          </span>
        )}
        <div>
          <p className="type-title-sm text-on-surface">{review.reviewerName}</p>
          {review.reviewerLocation && (
            <p className="type-label-sm text-on-surface-secondary">
              {review.reviewerLocation}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <StarRating rating={review.rating} />
        <span className="font-mono text-xs text-on-surface-secondary tabular-nums">
          {shortDate(review.reviewDate)}
        </span>
      </div>

      {review.title && (
        <p className="type-title-sm text-on-surface">{review.title}</p>
      )}
      <p className="text-base text-on-surface-secondary leading-relaxed">
        {review.body}
      </p>

      {review.images.length > 0 && (
        <ul className="flex flex-wrap gap-2">
          {review.images.map((url, i) => (
            <li key={url}>
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label(i + 1)}
                className="inline-flex h-12 w-12 items-center justify-center border border-border bg-surface-elevated text-on-surface-secondary cursor-pointer hover:border-primary"
              >
                <i className="fa fa-image" aria-hidden="true" />
              </a>
            </li>
          ))}
        </ul>
      )}

      <a
        href={review.sourceUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-[0.05em] text-on-surface-accent hover:text-primary cursor-pointer"
      >
        <i className="fa fa-external-link" aria-hidden="true" />
        {verifyLabel}
      </a>
    </article>
  );
}
