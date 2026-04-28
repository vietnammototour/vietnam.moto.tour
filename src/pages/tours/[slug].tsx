import {useTranslations} from 'next-intl';
import type {GetStaticPaths, GetStaticPropsContext} from 'next';
import Head from 'next/head';
import {useRouter} from 'next/router';
import {toursData} from '@/data';
import type {Tour} from '@/types';
import {contactInfo} from '@/utils';
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

interface TourDetailProps {
  tour: Tour;
}

export default function TourDetail({tour}: TourDetailProps) {
  const router = useRouter();
  const locale = (router.locale ?? 'vi') as 'en' | 'vi';
  const t = useTranslations('tourDetail');
  const tMeta = useTranslations('meta');

  const metaDescription = tour.description[locale].slice(0, 160);

  const whatsappMessage = encodeURIComponent(
    `Hi! I'm interested in the "${tour.title}" tour.`,
  );
  const whatsappUrl = `https://wa.me/${contactInfo.whatsApp.replace(/[^0-9]/g, '')}?text=${whatsappMessage}`;

  return (
    <>
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
                <TourPricing
                  pricingGroups={tour.pricingGroups}
                  locale={locale}
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
            </aside>
          </div>
        </div>
      </article>

      {/* Mobile sticky bottom CTA */}
      <div className="fixed bottom-0 left-0 right-0 z-40 lg:hidden bg-surface-elevated border-t border-border shadow-lg">
        <div className="flex items-center justify-between px-4 py-3">
          <div>
            <span className="type-title-sm text-on-surface">
              {t('from')} ${tour.price}
            </span>
            <span className="type-label-sm text-on-surface-secondary ml-1">
              {t('perPerson')}
            </span>
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

export const getStaticPaths: GetStaticPaths = async () => {
  const paths = toursData.flatMap((tour) =>
    ['vi', 'en'].map((locale) => ({
      params: {slug: tour.slug},
      locale,
    })),
  );

  return {
    paths,
    fallback: false,
  };
};

export async function getStaticProps({params, locale}: GetStaticPropsContext) {
  const tour = toursData.find((t) => t.slug === params?.slug);

  if (!tour) {
    return {notFound: true};
  }

  return {
    props: {
      tour,
      messages: (await import(`@/messages/${locale}.json`)).default,
    },
  };
}
