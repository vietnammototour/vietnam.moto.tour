import Link from 'next/link';
import {useTranslations} from 'next-intl';
import type * as VMT from '@/domain';
import {contactInfo} from '@/utils';
import {routes} from '@/routes';

type Props = {
  destination: VMT.DestinationDetail;
};

export function DestinationFacts({destination}: Props) {
  const t = useTranslations('destinationDetail');
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

  const facts = [
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
              className="flex items-center justify-center gap-2 bg-primary text-on-primary py-3 px-4 rounded-lg type-title-sm font-semibold hover:brightness-105 cursor-pointer elevation-2 hover:elevation-3 transition-[box-shadow,filter] duration-200"
            >
              <i className="fa fa-route" />
              {t('exploreToursCta')}
            </Link>
          )}
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 bg-[#25D366] text-white py-3 px-4 rounded-lg type-title-sm font-semibold hover:brightness-105 cursor-pointer elevation-2 hover:elevation-3 transition-[box-shadow,filter] duration-200"
          >
            <i className="fab fa-whatsapp text-lg" />
            {t('whatsappUs')}
          </a>
          <a
            href={emailUrl}
            className="flex items-center justify-center gap-2 bg-surface text-on-surface border border-border py-3 px-4 rounded-lg type-title-sm font-semibold hover:bg-surface-alt transition-colors duration-200 cursor-pointer"
          >
            <i className="fa fa-envelope" />
            {t('emailInquiry')}
          </a>
        </div>
      </div>
    </div>
  );
}
