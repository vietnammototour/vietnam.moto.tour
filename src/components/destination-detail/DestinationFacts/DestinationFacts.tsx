import Link from 'next/link';
import {useTranslations} from 'next-intl';
import {motion} from 'framer-motion';
import type * as VMT from '@/domain';
import {contactInfo} from '@/utils';
import {useMagnetic} from '@/hooks/use-magnetic';
import {routes} from '@/routes';

type Props = {
  destination: VMT.DestinationDetail;
};

export function DestinationFacts({destination}: Props) {
  const t = useTranslations('destinationDetail');
  const sizeKey = destination.size === 'large' ? 'sizeLarge' : 'sizeSmall';
  const tourCount = destination.tours.length;

  const whatsappMessage = encodeURIComponent(
    `Hi! I'm interested in tours to ${destination.name}.`,
  );
  const whatsappUrl = `https://wa.me/${contactInfo.whatsApp.replace(
    /[^0-9]/g,
    '',
  )}?text=${whatsappMessage}`;
  const emailUrl = `mailto:${contactInfo.email}?subject=${encodeURIComponent(
    `Inquiry: ${destination.name}`,
  )}`;

  const {
    ref: waRef,
    x: waX,
    y: waY,
    onMouseMove: waMouseMove,
    onMouseLeave: waMouseLeave,
  } = useMagnetic(0.3, 80);
  const {
    ref: emRef,
    x: emX,
    y: emY,
    onMouseMove: emMouseMove,
    onMouseLeave: emMouseLeave,
  } = useMagnetic(0.3, 80);

  const facts = [
    {label: t('regionLabel'), value: t(sizeKey)},
    {
      label: t('toursAvailableLabel'),
      value: t('toursAvailable', {count: tourCount}),
    },
  ];

  return (
    <div className="rounded-2xl elevation-3 p-6 texture-grain-warm relative overflow-hidden">
      <div className="relative z-10">
        <span className="type-label-sm tracking-[0.25em] uppercase text-primary mb-2 block">
          {t('factsEyebrow')}
        </span>
        <h3 className="type-title-lg text-on-surface mb-5">
          {t('factsTitle')}
        </h3>

        <dl className="flex flex-col mb-6">
          {facts.map((f) => (
            <div
              key={f.label}
              className="flex justify-between items-center py-3 border-b border-border-subtle last:border-b-0"
            >
              <dt className="type-body-sm text-on-surface-secondary">
                {f.label}
              </dt>
              <dd className="type-label-lg text-on-surface font-semibold text-right">
                {f.value}
              </dd>
            </div>
          ))}
        </dl>

        <div className="flex flex-col gap-3">
          {tourCount > 0 && (
            <Link
              href={routes.tours.byDestination.path({
                destinationId: destination.id,
              })}
              className="flex items-center justify-center gap-2 bg-primary text-on-primary py-3 px-4 rounded-lg type-title-sm font-semibold hover:opacity-90 transition-opacity cursor-pointer elevation-2 hover:elevation-3"
            >
              <i className="fa fa-route" />
              {t('exploreToursCta')}
            </Link>
          )}
          <motion.a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            ref={waRef as React.RefObject<HTMLAnchorElement>}
            onMouseMove={waMouseMove}
            onMouseLeave={waMouseLeave}
            style={{x: waX, y: waY}}
            whileHover={{scale: 1.02}}
            whileTap={{scale: 0.97}}
            className="flex items-center justify-center gap-2 bg-[#25D366] text-white py-3 px-4 rounded-lg type-title-sm font-semibold hover:opacity-90 transition-opacity cursor-pointer elevation-2 hover:elevation-3"
          >
            <i className="fab fa-whatsapp text-lg" />
            {t('whatsappUs')}
          </motion.a>
          <motion.a
            href={emailUrl}
            ref={emRef as React.RefObject<HTMLAnchorElement>}
            onMouseMove={emMouseMove}
            onMouseLeave={emMouseLeave}
            style={{x: emX, y: emY}}
            whileHover={{scale: 1.02}}
            whileTap={{scale: 0.97}}
            className="flex items-center justify-center gap-2 bg-surface text-on-surface border border-border py-3 px-4 rounded-lg type-title-sm font-semibold hover:bg-surface-alt transition-colors cursor-pointer"
          >
            <i className="fa fa-envelope" />
            {t('emailInquiry')}
          </motion.a>
        </div>
      </div>
    </div>
  );
}
