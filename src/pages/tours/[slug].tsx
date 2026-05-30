import {useState, useCallback} from 'react';
import {useTranslations} from 'next-intl';
import type {GetServerSidePropsContext} from 'next';
import {getServerSession} from 'next-auth/next';
import {authOptions} from '@/lib/auth';
import Head from 'next/head';
import {useRouter} from 'next/router';
import type * as VMT from '@/domain';
import {getMinPrice} from '@/domain';
import {contactInfo} from '@/utils';
import {AdminStatusBadge} from '@/components/tour-detail/AdminStatusBadge';
import {TourHero} from '@/components/TourHero';
import {TourDescription} from '@/components/tour-detail/TourDescription';
import {TourHighlights} from '@/components/tour-detail/TourHighlights';
import {TourItinerary} from '@/components/TourItinerary';
import {TourIncluded} from '@/components/tour-detail/TourIncluded';
import {TourPricing} from '@/components/TourPricing';
import {TourCTA} from '@/components/tour-detail/TourCTA';
import {TourDetails} from '@/components/tour-detail/TourDetails';
import {TourPayment} from '@/components/tour-detail/TourPayment';
import {TourNotes} from '@/components/tour-detail/TourNotes';
import {TourReviews} from '@/components/reviews/TourReviews';

type TourDetailProps = {
  tour: VMT.Tour;
  isAdmin: boolean;
  reviews: VMT.Review[];
};

export default function TourDetail({tour, isAdmin, reviews}: TourDetailProps) {
  const router = useRouter();
  const locale = (router.locale ?? 'vi') as 'en' | 'vi';
  const t = useTranslations('tourDetail');
  const tMeta = useTranslations('meta');

  const metaDescription = tour.description[locale].slice(0, 160);

  const tourTitle = tour.title[locale];
  const whatsappMessage = encodeURIComponent(
    `Hi! I'm interested in the "${tourTitle}" tour.`,
  );
  const whatsappUrl = `https://wa.me/${contactInfo.whatsApp.replace(/[^0-9]/g, '')}?text=${whatsappMessage}`;

  const [selectedPrice, setSelectedPrice] = useState<{
    price: number;
    label: string;
  }>({price: getMinPrice(tour.pricingGroups), label: ''});

  const handlePriceChange = useCallback((price: number, label: string) => {
    setSelectedPrice({price, label});
  }, []);

  return (
    <>
      {isAdmin && tour.status && tour.status !== 'PUBLISHED' && (
        <AdminStatusBadge status={tour.status} />
      )}
      <Head>
        <title>{tMeta('tourDetailTitle', {tourTitle: tourTitle})}</title>
        <meta name="description" content={metaDescription} />
      </Head>

      <TourHero tour={tour} />

      <article className="relative overflow-hidden py-10 lg:py-16 pb-24 lg:pb-16">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 mesh-bloom-section"
        />
        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/*
            Single-render layout: each sidebar component instantiates once.
            Mobile: natural document flow — aside slots between Highlights and Itinerary.
            Desktop: grid places aside in col-2 spanning all rows; aside sticks at top.
            TourCTA hidden on mobile (mobile uses sticky bottom CTA bar instead).
          */}
          <div className="lg:grid lg:grid-cols-[2fr_1fr] lg:gap-10 lg:items-start">
            {/* Main column part A — above the sidebar's vertical mid-point */}
            <div className="lg:col-start-1 lg:row-start-1">
              <TourDescription
                description={tour.description}
                locale={locale}
                imageUrl={tour.imageUrl}
                imageAlt={
                  tour.title[locale as 'en' | 'vi'] ?? tour.title.vi ?? ''
                }
              />
              <TourHighlights highlights={tour.highlights} locale={locale} />
            </div>

            {/* Sidebar — explicit row-span so sticky can scroll across both main rows */}
            <aside className="mb-10 lg:mb-0 lg:col-start-2 lg:row-start-1 lg:row-span-2 lg:sticky lg:top-24 lg:self-start">
              <div className="lg:p-6 lg:texture-grain-warm">
                <div className="relative z-10 space-y-8">
                  <TourPricing
                    pricingGroups={tour.pricingGroups}
                    locale={locale}
                    onPriceChange={handlePriceChange}
                  />
                  <div className="hidden lg:block">
                    <TourCTA tourTitle={tourTitle} />
                  </div>
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
            </aside>

            {/* Main column part B — below the aside's mobile-inline position */}
            <div className="lg:col-start-1 lg:row-start-2">
              <TourItinerary itinerary={tour.itinerary} locale={locale} />
              <TourIncluded
                included={tour.included}
                excluded={tour.excluded}
                locale={locale}
              />
            </div>
          </div>
        </div>
      </article>

      <TourReviews reviews={reviews} tripAdvisorUrl={tour.tripAdvisorUrl} />

      {/* Mobile sticky bottom CTA */}
      <div className="fixed bottom-0 left-0 right-0 z-40 lg:hidden bg-surface-elevated border-t border-border">
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
              aria-label="Contact via WhatsApp"
              className="inline-flex items-center justify-center bg-whatsapp text-on-whatsapp px-4 min-h-11 type-label-sm font-semibold cursor-pointer"
            >
              WhatsApp
            </a>
            <a
              href={`mailto:${contactInfo.email}?subject=${encodeURIComponent(`Inquiry: ${tourTitle}`)}`}
              aria-label="Contact via email"
              className="inline-flex items-center justify-center bg-primary text-on-primary px-4 min-h-11 type-label-sm font-semibold cursor-pointer"
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
  const {getTourBySlug, getMessagesFromDb, getTourReviews} = await import(
    '@/data/queries'
  );
  const session = await getServerSession(req, res, authOptions);
  const isAdmin = session?.user?.orgRoleKey === 'admin';

  const slug = params?.slug as string;
  const tour = await getTourBySlug(slug, isAdmin);
  if (!tour) {
    return {notFound: true};
  }
  const [dbMessages, reviews] = await Promise.all([
    getMessagesFromDb(locale ?? 'vi'),
    getTourReviews(tour.id),
  ]);

  return {
    props: {
      tour,
      isAdmin,
      reviews,
      messages: dbMessages,
    },
  };
}
