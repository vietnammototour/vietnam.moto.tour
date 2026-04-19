import type { DestinationCardProps } from '@/types';

export const DestinationCard = ({ destination }: DestinationCardProps) => {
  const { name, imageUrl, tours, width, height, colClass } = destination;

  return (
    <div className={colClass}>
      <div className="destinations-one__single">
        <div className="destinations-one__img">
          <picture style={{ display: 'block', width, height, overflow: 'hidden' }}>
            <source srcSet={imageUrl} type="image/webp" />
            <img
              src={imageUrl}
              alt={name}
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', position: 'absolute' }}
            />
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(0, 0, 0, 0.4)' }} />
          </picture>
          <div className="destinations-one__content">
            <h2 className="destinations-one__title">
              <a href="destinations-details.html">{name}</a>
            </h2>
          </div>
          <div className="destinations-one__button">
            <a href="#">{tours} tours</a>
          </div>
        </div>
      </div>
    </div>
  );
};
