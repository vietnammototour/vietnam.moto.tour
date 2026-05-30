import {useState} from 'react';

type StarRatingProps = {
  rating: number;
  /** When provided, the stars become clickable and call this on selection. */
  onRate?: (value: number) => void;
  size?: 'sm' | 'md' | 'lg';
};

const sizeClass = {sm: 'text-sm', md: 'text-base', lg: 'text-2xl'} as const;
const STARS = [1, 2, 3, 4, 5];

export function StarRating({rating, onRate, size = 'sm'}: StarRatingProps) {
  const [hover, setHover] = useState(0);
  const clamped = Math.max(0, Math.min(5, Math.round(rating)));

  if (!onRate) {
    return (
      <span
        className="inline-flex items-center gap-0.5"
        role="img"
        aria-label={`${clamped} out of 5 stars`}
      >
        {STARS.map((n) => {
          const filled = n <= clamped;
          return (
            <i
              key={n}
              data-testid="star"
              data-filled={filled ? 'true' : 'false'}
              className={`fa fa-star ${sizeClass[size]} ${filled ? 'text-primary' : 'text-on-surface-tertiary'}`}
              aria-hidden="true"
            />
          );
        })}
      </span>
    );
  }

  const shown = hover > 0 ? hover : clamped;
  return (
    <span
      className="inline-flex items-center gap-1"
      role="radiogroup"
      aria-label="Rating"
      onMouseLeave={() => setHover(0)}
    >
      {STARS.map((n) => {
        const filled = n <= shown;
        return (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={n === clamped}
            aria-label={`${n} ${n === 1 ? 'star' : 'stars'}`}
            data-testid="star"
            data-filled={filled ? 'true' : 'false'}
            className="cursor-pointer leading-none"
            onMouseEnter={() => setHover(n)}
            onClick={() => onRate(n)}
          >
            <i
              className={`fa fa-star ${sizeClass[size]} transition-colors ${filled ? 'text-primary' : 'text-on-surface-tertiary'}`}
              aria-hidden="true"
            />
          </button>
        );
      })}
    </span>
  );
}
