import {useState, useCallback} from 'react';
import {useTranslations} from 'next-intl';
import type {GetServerSidePropsContext} from 'next';
import {getServerSession} from 'next-auth/next';
import {authOptions} from '@/lib/auth';
import Head from 'next/head';
import {useRouter} from 'next/router';
import type {Tour} from '@/types';
import {contactInfo} from '@/utils';
import {AdminStatusBadge} from '@/components/admin-status-badge';
import {TourHero} from '@/components/tour-hero';
import {TourDescription} from '@/components/tour-description';
import {TourHighlights} from '@/components/tour-highlights';
import {TourItinerary} from '@/components/tour-itinerary';
import {TourIncluded} from '@/components/tour-included';
import {TourPricing} from '@/components/tour-pricing';
import {TourCTA} from '@/components/tour-cta';
import {TourDetails} from '@/components/tour-details';
import {TourPayment} from '@/components/tour-payment';
import {TourNotes} from '@/components/tour-notes';

type TourDetailProps = {
  tour: Tour;
  isAdmin: boolean;
};

export default function TourDetail({tour, isAdmin}: TourDetailProps) {
  const router = useRouter();
  const locale = (router.locale ?? 'vi') as 'en' | 'vi';
  const t = useTranslations('tourDetail');
  const tMeta = useTranslations('meta');

  const metaDescription = tour.description[locale].slice(0, 160);

  const whatsappMessage = encodeURIComponent(
    `Hi! I'm interested in the "${tour.title}" tour.`,
  );
  const whatsappUrl = `https://wa.me/${contactInfo.whatsApp.replace(/[^0-9]/g, '')}?text=${whatsappMessage}`;

  const [selectedPrice, setSelectedPrice] = useState<{
    price: number;
    label: string;
  }>({price: tour.price, label: ''});

  const handlePriceChange = useCallback((price: number, label: string) => {
    setSelectedPrice({price, label});
  }, []);

  return (
    <>
      {isAdmin && tour.status && tour.status !== 'PUBLISHED' && (
        <AdminStatusBadge status={tour.status} />
      )}
      <Head>
        <title>{tMeta('tourDetailTitle', {tourTitle: tour.title})}</title>
        <meta name="description" content={metaDescription} />
      </Head>

      <TourHero tour={tour} />

      <article className="py-10 lg:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="lg:flex lg:gap-10">
            {/* Main content */}
            <div className="lg:w-2/3">
              <TourDescription description={tour.description} locale={locale} />
              <TourHighlights highlights={tour.highlights} locale={locale} />

              {/* On mobile: pricing + details between highlights and itinerary */}
              <div className="lg:hidden mb-10">
                <TourPricing
                  pricingGroups={tour.pricingGroups}
                  locale={locale}
                  onPriceChange={handlePriceChange}
                />
                <TourDetails tour={tour} />
              </div>

              <TourItinerary itinerary={tour.itinerary} locale={locale} />
              <TourIncluded
                included={tour.included}
                excluded={tour.excluded}
                locale={locale}
              />

              {/* On mobile: payment + notes after included */}
              <div className="lg:hidden">
                <TourPayment
                  paymentDetails={tour.paymentDetails}
                  locale={locale}
                />
                <TourNotes
                  notes={tour.notes}
                  mealsInfo={tour.mealsInfo}
                  locale={locale}
                />
              </div>
            </div>

            {/* Desktop sidebar */}
            <aside className="hidden lg:block lg:w-1/3">
              <div className="sticky top-24">
                <div className="rounded-xl elevation-3 p-6 texture-grain-warm">
                  <div className="relative z-10">
                    <TourPricing
                      pricingGroups={tour.pricingGroups}
                      locale={locale}
                      onPriceChange={handlePriceChange}
                    />
                    <TourCTA tourTitle={tour.title} />
                    <TourDetails tour={tour} />
                    <TourPayment
                      paymentDetails={tour.paymentDetails}
                      locale={locale}
                    />
                    <TourNotes
                      notes={tour.notes}
                      mealsInfo={tour.mealsInfo}
                      locale={locale}
                    />
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </article>

      {/* Mobile sticky bottom CTA */}
      <div className="fixed bottom-0 left-0 right-0 z-40 lg:hidden bg-surface-elevated border-t border-border elevation-3">
        <div className="flex items-center justify-between px-4 py-3">
          <div>
            <span className="type-title-sm text-on-surface">
              ${selectedPrice.price}
            </span>
            <span className="type-label-sm text-on-surface-secondary ml-1">
              {t('pricingPerPerson')}
            </span>
            {selectedPrice.label && (
              <p className="type-label-sm text-on-surface-secondary">
                {selectedPrice.label}
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-[#25D366] text-white px-4 py-2 rounded-lg type-label-sm font-semibold"
            >
              WhatsApp
            </a>
            <a
              href={`mailto:${contactInfo.email}?subject=${encodeURIComponent(`Inquiry: ${tour.title}`)}`}
              className="bg-primary text-on-primary px-4 py-2 rounded-lg type-label-sm font-semibold"
            >
              Email
            </a>
          </div>
        </div>
      </div>
    </>
  );
}

export async function getServerSideProps({
  params,
  req,
  res,
  locale,
}: GetServerSidePropsContext) {
  const {getTourBySlug, getMessagesFromDb} = await import('@/data/queries');
  const session = await getServerSession(req, res, authOptions);
  const isAdmin = session?.user?.role === 'ADMIN';

  const slug = params?.slug as string;
  const [tour, dbMessages] = await Promise.all([
    getTourBySlug(slug, isAdmin),
    getMessagesFromDb(locale ?? 'vi'),
  ]);

  if (!tour) {
    return {notFound: true};
  }

  return {
    props: {
      tour,
      isAdmin,
      messages: dbMessages,
    },
  };
}
