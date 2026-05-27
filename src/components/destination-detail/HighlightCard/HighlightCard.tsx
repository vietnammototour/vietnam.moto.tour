import {motion} from 'framer-motion';
import Image from 'next/image';
import type * as VMT from '@/domain';

type Props = {
  highlight: VMT.Highlight;
  locale: 'en' | 'vi';
  index: number;
};

export function HighlightCard({highlight, locale, index}: Props) {
  const title = locale === 'en' ? highlight.titleEn : highlight.titleVi;
  const description =
    locale === 'en' ? highlight.descriptionEn : highlight.descriptionVi;

  const indexLabel = String(index + 1).padStart(2, '0');

  return (
    <motion.article
      initial={{opacity: 0, y: 24}}
      whileInView={{opacity: 1, y: 0}}
      viewport={{once: true, margin: '-80px'}}
      transition={{duration: 0.5, delay: index * 0.06}}
      whileHover={{y: -4}}
      className="group relative flex flex-col overflow-hidden bg-surface transition-shadow"
    >
      {highlight.imageUrl ? (
        <div className="relative aspect-[4/3] overflow-hidden">
          <Image
            src={highlight.imageUrl}
            alt={title}
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            unoptimized
            className="object-cover transition-transform duration-700 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />
          <span className="absolute top-4 left-4 type-label-sm tracking-[0.2em] text-on-surface/90 font-semibold">
            {indexLabel}
          </span>
        </div>
      ) : (
        <div className="relative aspect-[4/3] bg-gradient-to-br from-primary/15 via-surface-alt to-surface flex items-center justify-center texture-grain-warm">
          <span className="type-display-sm text-primary/30 font-semibold">
            {indexLabel}
          </span>
        </div>
      )}

      <div className="p-6 flex flex-col gap-3 flex-1">
        <h3 className="type-title-lg text-on-surface group-hover:text-primary transition-colors">
          {title}
        </h3>
        {description && (
          <p className="type-body-sm text-on-surface-secondary leading-relaxed">
            {description}
          </p>
        )}
      </div>
    </motion.article>
  );
}
