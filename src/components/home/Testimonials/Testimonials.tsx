import {motion} from 'framer-motion';
import {useTranslations} from 'next-intl';
import {fadeInUp, waveStagger} from '@/utils/motion-variants';

export type Testimonial = {
  id: string;
  quote: string;
  name: string;
  origin: string;
  tour: string;
  date: string;
};

const MOCK_TESTIMONIALS: Testimonial[] = [
  {
    id: 't-01',
    quote:
      'Six days through Ha Giang. Roads I would never have found alone, food I would never have ordered alone, riders I now call brothers. The guide read the weather, the traffic, my pace. Nothing felt scripted.',
    name: 'Marcus Lindqvist',
    origin: 'Stockholm, SE',
    tour: 'HA-GIANG-LOOP-06',
    date: '2025.11',
  },
  {
    id: 't-02',
    quote:
      'I rented a 250cc for a self-guided coastal week. Handover took twelve minutes. Bike pulled like new. When the rain hit Quy Nhon they swapped out my visor at the next checkpoint. That is service I have not seen anywhere else.',
    name: 'Aisha Rahman',
    origin: 'Singapore, SG',
    tour: 'COASTAL-SELF-GUIDED',
    date: '2025.09',
  },
  {
    id: 't-03',
    quote:
      'Booked the Northwest for my fortieth. Three of us on bikes, my wife and son in the support car. Every stop was already arranged, every meal already ordered. The crew let us ride hard when we wanted and pulled us back when the cloud rolled in.',
    name: 'Daniel Okafor',
    origin: 'Lagos, NG',
    tour: 'NORTHWEST-LOOP-10',
    date: '2025.07',
  },
];

export function Testimonials() {
  const t = useTranslations('home');

  return (
    <section className="bg-surface-deep py-20 lg:py-28 border-y border-on-surface-tertiary">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-12 border-l-2 border-primary pl-4">
          <motion.span
            className="font-mono text-xs uppercase tracking-[0.05em] text-on-surface-secondary block"
            variants={fadeInUp}
            initial="hidden"
            whileInView="visible"
            viewport={{once: true}}
          >
            {t('testimonialsEyebrow')}
          </motion.span>
          <motion.h2
            className="font-display text-2xl lg:text-4xl font-bold uppercase tracking-[0.05em] text-on-surface mt-2"
            variants={fadeInUp}
            initial="hidden"
            whileInView="visible"
            viewport={{once: true}}
          >
            {t('testimonialsTitle')}
          </motion.h2>
        </div>

        <ul className="grid grid-cols-1 md:grid-cols-3 gap-px bg-border-subtle border border-border-subtle">
          {MOCK_TESTIMONIALS.map((item, i) => (
            <motion.li
              key={item.id}
              custom={i}
              variants={waveStagger(0.1)}
              initial="hidden"
              whileInView="visible"
              viewport={{once: true}}
              className="bg-surface-alt p-8 lg:p-10 flex flex-col gap-6"
            >
              <div className="flex items-baseline justify-between">
                <span className="font-mono text-xs text-on-surface-accent tabular-nums">
                  {String(i + 1).padStart(2, '0')}/
                  {String(MOCK_TESTIMONIALS.length).padStart(2, '0')}
                </span>
                <span className="font-mono text-xs text-on-surface-secondary tabular-nums">
                  {item.date}
                </span>
              </div>

              <span
                className="font-display text-4xl text-primary leading-none"
                aria-hidden="true"
              >
                &ldquo;
              </span>

              <blockquote className="text-base lg:text-lg text-on-surface leading-relaxed flex-1">
                {item.quote}
              </blockquote>

              <figcaption className="border-t border-border-subtle pt-4 flex flex-col gap-1">
                <span className="font-display text-base font-bold uppercase tracking-[0.05em] text-on-surface">
                  {item.name}
                </span>
                <span className="font-mono text-[10px] uppercase tracking-[0.05em] text-on-surface-secondary">
                  {item.origin}
                </span>
                <span className="font-mono text-[10px] uppercase tracking-[0.05em] text-on-surface-tertiary">
                  {item.tour}
                </span>
              </figcaption>
            </motion.li>
          ))}
        </ul>
      </div>
    </section>
  );
}
