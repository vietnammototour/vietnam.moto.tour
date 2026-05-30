import {useEffect, useRef, useState} from 'react';
import Image from 'next/image';
import type {Review} from '@/domain';
import {useEditable, EditableText} from '@/components/Admin/EditableContext';
import {TripAdvisorIcon} from '@/components/ui';
import {StarRating} from '../StarRating';
import {ReviewerAvatar} from '../ReviewerAvatar';

type ReviewCardProps = {
  review: Review;
  verifyLabel: string;
  photoLabel?: (n: number) => string;
  readMoreLabel?: string;
  showLessLabel?: string;
};

function shortDate(iso: string): string {
  if (iso.length < 7) return iso;
  return `${iso.slice(0, 4)}.${iso.slice(5, 7)}`;
}

const inlineInput =
  'w-full bg-surface-elevated border border-border px-2 py-1 font-mono text-xs text-on-surface outline-none focus:border-primary';

export function ReviewCard({
  review,
  verifyLabel,
  photoLabel,
  readMoreLabel = 'Read more',
  showLessLabel = 'Show less',
}: ReviewCardProps) {
  const ctx = useEditable();
  const editable = !!ctx?.editable;
  const set = (path: string, value: string | number) =>
    ctx?.onFieldChange(path, value);
  const label = photoLabel ?? ((n: number) => `Photo ${n}`);
  const images = editable ? review.images : review.images.filter(Boolean);

  const [expanded, setExpanded] = useState(false);
  const [overflowing, setOverflowing] = useState(false);
  const bodyRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const el = bodyRef.current;
    if (!el || expanded) return;
    setOverflowing(el.scrollHeight > el.clientHeight + 1);
  }, [review.body, expanded]);

  return (
    <article className="bg-surface-alt border border-border p-8 lg:p-10 flex flex-col gap-6">
      {/* Provenance */}
      <div className="flex items-center gap-2 text-tripadvisor">
        <TripAdvisorIcon className="h-4 w-4" />
        <span className="font-mono text-xs font-medium uppercase tracking-[0.1em]">
          TripAdvisor
        </span>
      </div>

      {/* Identity */}
      <div className="flex items-start gap-4">
        <div className="flex flex-col gap-1">
          <ReviewerAvatar
            name={review.reviewerName}
            avatarUrl={review.avatarUrl}
            size="md"
          />
          {editable && (
            <input
              type="url"
              defaultValue={review.avatarUrl ?? ''}
              placeholder="Avatar URL"
              aria-label="Avatar URL"
              className={`${inlineInput} w-28`}
              onBlur={(e) => set('avatarUrl', e.target.value)}
            />
          )}
        </div>
        <div className="flex flex-col gap-1">
          <EditableText
            tag="p"
            path="reviewerName"
            value={review.reviewerName}
            placeholder="Reviewer name"
            className="type-title-sm text-on-surface"
          />
          <EditableText
            tag="p"
            path="reviewerLocation"
            value={review.reviewerLocation ?? ''}
            placeholder="Location"
            className="type-label-sm text-on-surface-secondary"
          />
          <span className="font-mono text-xs text-on-surface-secondary tabular-nums">
            {shortDate(review.reviewDate)}
          </span>
          {editable && (
            <input
              type="date"
              defaultValue={review.reviewDate.slice(0, 10)}
              aria-label="Review date"
              className={`${inlineInput} w-36`}
              onChange={(e) => set('reviewDate', e.target.value)}
            />
          )}
        </div>
      </div>

      {/* Rating */}
      <StarRating
        rating={review.rating}
        size="md"
        onRate={editable ? (n) => set('rating', n) : undefined}
      />

      {/* Content */}
      <EditableText
        tag="p"
        path="title"
        value={review.title}
        placeholder="Review title"
        className="type-title-sm text-on-surface"
      />
      {editable ? (
        <EditableText
          tag="p"
          path="body"
          value={review.body}
          placeholder="Review text"
          multiline
          className="text-base text-on-surface-secondary leading-relaxed"
        />
      ) : (
        <div className="flex flex-col gap-2">
          <p
            ref={bodyRef}
            className={`text-base text-on-surface-secondary leading-relaxed whitespace-pre-line ${
              expanded ? '' : 'line-clamp-[7]'
            }`}
          >
            {review.body}
          </p>
          {overflowing && (
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              aria-expanded={expanded}
              className="self-start cursor-pointer font-mono text-xs uppercase tracking-[0.05em] text-on-surface-accent hover:text-primary transition-colors"
            >
              {expanded ? showLessLabel : readMoreLabel}
              <i
                className={`fa ml-1 text-xs ${
                  expanded ? 'fa-chevron-up' : 'fa-chevron-down'
                }`}
                aria-hidden="true"
              />
            </button>
          )}
        </div>
      )}

      {/* Photos */}
      {(images.length > 0 || editable) && (
        <div className="flex flex-col gap-2">
          <ul className="flex flex-wrap gap-2">
            {images.map((url, i) => (
              <li key={i} className="flex flex-col gap-1">
                <a
                  href={url || undefined}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label(i + 1)}
                  className="relative inline-flex h-20 w-20 items-center justify-center overflow-hidden border border-border bg-surface-elevated text-on-surface-secondary cursor-pointer transition-colors hover:border-primary hover:text-primary"
                >
                  {url ? (
                    <Image
                      src={url}
                      alt={label(i + 1)}
                      fill
                      sizes="80px"
                      className="object-cover"
                    />
                  ) : (
                    <i className="fa fa-image" aria-hidden="true" />
                  )}
                </a>
                {editable && (
                  <div className="flex items-center gap-1">
                    <input
                      type="url"
                      defaultValue={url}
                      placeholder={`Photo URL ${i + 1}`}
                      aria-label={`Photo URL ${i + 1}`}
                      className={`${inlineInput} w-28`}
                      onBlur={(e) => set(`images.${i}`, e.target.value)}
                    />
                    <button
                      type="button"
                      aria-label="Remove photo"
                      className="cursor-pointer text-danger hover:text-danger-hover"
                      onClick={() => ctx?.onRemoveItem?.(`images.${i}`)}
                    >
                      <i className="fa fa-times text-xs" aria-hidden="true" />
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
          {editable && images.length < 5 && (
            <button
              type="button"
              className="self-start cursor-pointer font-mono text-xs uppercase tracking-[0.05em] text-on-surface-accent hover:text-primary"
              onClick={() => set(`images.${review.images.length}`, '')}
            >
              <i className="fa fa-plus mr-1 text-xs" aria-hidden="true" />
              Add photo URL
            </button>
          )}
        </div>
      )}

      {/* Verified */}
      <div className="flex flex-col gap-2">
        <a
          href={review.sourceUrl || undefined}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 self-start border border-tripadvisor/50 px-3 py-2 font-mono text-xs uppercase tracking-[0.05em] text-tripadvisor transition-colors hover:bg-tripadvisor hover:text-on-tripadvisor cursor-pointer"
        >
          <TripAdvisorIcon className="h-3.5 w-3.5" />
          {verifyLabel}
          <i className="fa fa-arrow-right" aria-hidden="true" />
        </a>
        {editable && (
          <input
            type="url"
            defaultValue={review.sourceUrl}
            placeholder="TripAdvisor link"
            aria-label="TripAdvisor link"
            className={`${inlineInput} max-w-md`}
            onBlur={(e) => set('sourceUrl', e.target.value)}
          />
        )}
      </div>
    </article>
  );
}
