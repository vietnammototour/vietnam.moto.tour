import {motion} from 'framer-motion';
import {useTranslations} from 'next-intl';
import {waveStagger} from '@/utils/motion-variants';

const INCLUDED_KEYS = [
  'helmet',
  'passengerHelmet',
  'phoneHolder',
  'rainGear',
] as const;

const RULE_KEYS = [
  'deposit',
  'cancellation',
  'license',
  'age',
  'securityDeposit',
  'mileage',
  'noBorderCrossing',
  'availability',
  'confirmationRequired',
] as const;

function num(i: number) {
  return String(i + 1).padStart(2, '0');
}

export function RentalPolicy() {
  const ti = useTranslations('rentals.policy.included');
  const tr = useTranslations('rentals.policy.rules');
  const tp = useTranslations('rentals.policy');

  return (
    <section className="py-20 lg:py-28">
      <div className="mb-12 border-l-2 border-primary pl-4">
        <span className="font-mono text-xs uppercase tracking-[0.05em] text-on-surface-secondary block">
          {tp('eyebrow')}
        </span>
        <h2 className="font-display text-2xl lg:text-4xl font-bold uppercase tracking-[0.05em] text-on-surface mt-2">
          {tp('title')}
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-border-subtle border border-border-subtle">
        <div className="bg-surface-alt p-8 lg:p-10">
          <h3 className="font-display text-lg font-bold uppercase tracking-[0.05em] text-on-surface-accent mb-6">
            {ti('title')}
          </h3>
          <ul className="flex flex-col border-y border-border-subtle divide-y divide-border-subtle">
            {INCLUDED_KEYS.map((k, i) => (
              <motion.li
                key={k}
                custom={i}
                variants={waveStagger(0.08)}
                initial="hidden"
                whileInView="visible"
                viewport={{once: true}}
                className="flex justify-between items-center py-4 gap-4"
              >
                <div className="flex items-center gap-4">
                  <span className="font-mono text-xs text-on-surface-accent tabular-nums">
                    {num(i)}
                  </span>
                  <span className="font-display text-base font-bold uppercase tracking-[0.05em] text-on-surface">
                    {ti(k)}
                  </span>
                </div>
                <span className="bg-primary text-on-primary px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.05em]">
                  {ti('free')}
                </span>
              </motion.li>
            ))}
          </ul>
        </div>

        <div className="bg-surface-alt p-8 lg:p-10">
          <h3 className="font-display text-lg font-bold uppercase tracking-[0.05em] text-on-surface-accent mb-6">
            {tr('title')}
          </h3>
          <ul className="flex flex-col border-y border-border-subtle divide-y divide-border-subtle">
            {RULE_KEYS.map((k, i) => (
              <motion.li
                key={k}
                custom={i}
                variants={waveStagger(0.06)}
                initial="hidden"
                whileInView="visible"
                viewport={{once: true}}
                className="grid grid-cols-[2.5rem_1fr] gap-4 items-baseline py-3"
              >
                <span className="font-mono text-xs text-on-surface-accent tabular-nums">
                  {num(i)}
                </span>
                <span className="font-mono text-xs uppercase tracking-[0.05em] text-on-surface leading-relaxed">
                  {tr(k)}
                </span>
              </motion.li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
