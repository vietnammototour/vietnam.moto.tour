import type * as VMT from '@/domain';

type Props = {
  highlight: VMT.Highlight;
  locale: 'en' | 'vi';
};

export function HighlightCard({highlight, locale}: Props) {
  const title = locale === 'en' ? highlight.titleEn : highlight.titleVi;
  const description =
    locale === 'en' ? highlight.descriptionEn : highlight.descriptionVi;

  return (
    <article className="rounded-lg overflow-hidden elevation-1 bg-surface">
      {highlight.imageUrl && (
        <img
          src={highlight.imageUrl}
          alt={title}
          className="w-full aspect-[3/2] object-cover"
        />
      )}
      <div className="p-4">
        <h3 className="type-title-md text-on-surface mb-2">{title}</h3>
        {description && (
          <p className="type-body-sm text-on-surface-secondary">
            {description}
          </p>
        )}
      </div>
    </article>
  );
}
