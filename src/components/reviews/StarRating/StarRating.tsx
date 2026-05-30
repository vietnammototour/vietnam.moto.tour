type StarRatingProps = {
  rating: number;
};

export function StarRating({rating}: StarRatingProps) {
  const clamped = Math.max(0, Math.min(5, Math.round(rating)));
  return (
    <span
      className="inline-flex items-center gap-0.5 text-primary"
      role="img"
      aria-label={`${clamped} out of 5 stars`}
    >
      {[1, 2, 3, 4, 5].map((n) => {
        const filled = n <= clamped;
        return (
          <i
            key={n}
            data-testid="star"
            data-filled={filled ? 'true' : 'false'}
            className={`fa ${filled ? 'fa-star' : 'fa-star-o'} text-sm`}
            aria-hidden="true"
          />
        );
      })}
    </span>
  );
}
