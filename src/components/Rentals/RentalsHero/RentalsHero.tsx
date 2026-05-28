import Image from 'next/image';
import {useTranslations} from 'next-intl';

type Props = {
  backgroundImage: string;
};

export function RentalsHero({backgroundImage}: Props) {
  const t = useTranslations('rentals');

  return (
    <section className="relative w-full">
      <div className="relative h-[55vh] min-h-[420px] md:h-[70vh] overflow-hidden bg-surface-deep">
        <Image
          src={backgroundImage}
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div
          className="absolute inset-0 bg-gradient-to-t from-surface-deep via-surface-deep/55 to-transparent"
          aria-hidden
        />

        <div className="relative z-10 h-full flex flex-col justify-end mx-auto max-w-[1920px] px-6 sm:px-10 lg:px-12 pb-10 lg:pb-14">
          <h1 className="type-display-lg text-on-surface leading-none mb-5 max-w-[16ch]">
            {t('title')}
          </h1>

          <span className="inline-block self-start bg-primary text-on-primary px-4 py-1.5 type-mono-label">
            {t('heroBadge')}
          </span>
        </div>
      </div>

      <div className="py-8 overflow-hidden" aria-hidden>
        <div className="h-px bg-primary w-[110%] -ml-[5%] -rotate-[1.5deg]" />
      </div>
    </section>
  );
}
