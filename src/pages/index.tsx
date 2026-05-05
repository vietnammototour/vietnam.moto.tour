import {useEffect, useRef, useState} from 'react';
import {motion, useMotionTemplate} from 'framer-motion';
import {useCursorSpotlight} from '@/hooks/use-cursor-spotlight';
import {
  clipReveal,
  fadeInUp,
  riseWithOvershoot,
  slideFromLeft,
  waveStagger,
} from '@/utils/motion-variants';
import {useTranslations} from 'next-intl';
import type {GetServerSidePropsContext} from 'next';
import {getServerSession} from 'next-auth/next';
import {authOptions} from '@/lib/auth';
import Head from 'next/head';
import Link from 'next/link';
import {routes} from '@/routes';

import {DestinationCard} from '@/components/destination-card';
import {TourCarousel} from '@/components/tour-carousel';
import {GalleryItem} from '@/components/gallery-item';
import {VideoModal} from '@/components/video-modal';
import {contactInfo} from '@/utils';

import type {Destination, Tour} from '@/types';
import {getUrl} from '@/utils';

const galleryImageUrls = [
  getUrl('assets/images/gallery/gallery-one-img-1.jpeg'),
  getUrl('assets/images/gallery/gallery-one-img-2.jpeg'),
  getUrl('assets/images/gallery/gallery-one-img-3.jpeg'),
  getUrl('assets/images/gallery/gallery-one-img-4.jpeg'),
  getUrl('assets/images/gallery/gallery-one-img-5.jpeg'),
];

interface HomeProps {
  tours: Tour[];
  destinations: (Destination & {
    tourCount: number;
    hasCar: boolean;
    hasBike: boolean;
  })[];
  isAdmin: boolean;
}

export default function Home({tours, destinations, isAdmin}: HomeProps) {
  const bannerVideoRef = useRef<HTMLVideoElement>(null);
  const [videoModalOpen, setVideoModalOpen] = useState(false);
  const t = useTranslations('home');
  const tMeta = useTranslations('meta');

  const spotlight = useCursorSpotlight(200, 0.15);
  const spotlightBg = useMotionTemplate`radial-gradient(200px circle at ${spotlight.x}px ${spotlight.y}px, rgba(180, 83, 9, 0.15), transparent)`;

  const galleryAltKeys = [
    'galleryAlt1',
    'galleryAlt2',
    'galleryAlt3',
    'galleryAlt4',
    'galleryAlt5',
  ] as const;
  const galleryImages = galleryImageUrls.map((src, i) => ({
    src,
    alt: t(galleryAltKeys[i]),
  }));

  useEffect(() => {
    if (bannerVideoRef.current) {
      bannerVideoRef.current.playbackRate = 0.8;
    }
  }, []);

  return (
    <>
      <Head>
        <title>{tMeta('homeTitle')}</title>
        <meta name="description" content={tMeta('homeDescription')} />
      </Head>

      {/* Hero */}
      <section
        ref={spotlight.ref as React.RefObject<HTMLElement>}
        onMouseMove={spotlight.onMouseMove}
        onMouseLeave={spotlight.onMouseLeave}
        className="relative h-[calc(100vh-4rem)] lg:h-[calc(100vh-5rem-36px)] min-h-[600px] flex items-center overflow-hidden texture-grain-warm"
      >
        <video
          autoPlay
          muted
          loop
          playsInline
          ref={bannerVideoRef}
          className="absolute inset-0 w-full h-full object-cover"
        >
          <source src={getUrl('assets/videos/banner-0.MOV')} type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent" />

        {/* Cursor spotlight overlay */}
        <motion.div
          className="absolute inset-0 pointer-events-none z-10"
          style={{background: spotlightBg}}
        />

        {/* Asymmetric content — left-aligned */}
        <div className="relative z-20 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 w-full">
          <div className="max-w-2xl">
            <motion.p
              variants={slideFromLeft}
              initial="hidden"
              animate="visible"
              className="type-label-sm uppercase tracking-wider text-primary-light mb-4"
            >
              {t('heroSubtitle')}
            </motion.p>
            <motion.h1
              variants={clipReveal}
              initial="hidden"
              animate="visible"
              className="type-display-sm md:type-display-lg text-white mb-6"
            >
              {t('heroTitle')}
            </motion.h1>
            <motion.div
              variants={riseWithOvershoot}
              initial="hidden"
              animate="visible"
            >
              <Link
                href={routes.tours.list.path()}
                className="inline-block bg-primary hover:bg-primary-light text-on-primary type-label-sm uppercase px-8 py-3 rounded-lg cursor-pointer transition-colors elevation-2 hover:elevation-3"
              >
                {t('bookWithUsNow')}
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Destinations */}
      <section className="relative py-16 lg:py-24 texture-grain-warm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <motion.span
              className="type-label-sm uppercase text-on-surface-accent block"
              variants={slideFromLeft}
              initial="hidden"
              whileInView="visible"
              viewport={{once: true}}
            >
              {t('destinationLists')}
            </motion.span>
            <motion.h2
              className="type-headline-sm lg:type-headline-lg mt-2"
              variants={clipReveal}
              initial="hidden"
              whileInView="visible"
              viewport={{once: true}}
            >
              {t('goExoticPlaces')}
            </motion.h2>
          </div>
          {/* Magazine grid: hero left spanning 2 rows, 2x2 small cards right */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {destinations[0] && (
              <motion.div
                className="sm:col-span-2 sm:row-span-2"
                custom={0}
                variants={waveStagger(0.08)}
                initial="hidden"
                whileInView="visible"
                viewport={{once: true}}
              >
                <DestinationCard
                  destination={destinations[0]}
                  className="h-full"
                />
              </motion.div>
            )}
            {destinations.slice(1, 5).map((destination, i) => (
              <motion.div
                key={destination.id}
                custom={i + 1}
                variants={waveStagger(0.08)}
                initial="hidden"
                whileInView="visible"
                viewport={{once: true}}
              >
                <DestinationCard destination={destination} />
              </motion.div>
            ))}
            {Array.from({
              length: Math.max(0, 4 - Math.max(0, destinations.length - 1)),
            }).map((_, i) => (
              <motion.div
                key={`placeholder-${i}`}
                initial="hidden"
                whileInView="visible"
                viewport={{once: true}}
                variants={{
                  ...fadeInUp,
                  visible: {
                    ...fadeInUp.visible,
                    transition: {
                      duration: 0.6,
                      delay: (destinations.length + i) * 0.1,
                    },
                  },
                }}
              >
                <div className="relative rounded-lg overflow-hidden bg-surface-alt aspect-[3/2] flex flex-col items-center justify-center text-on-surface-muted">
                  <i className="fa fa-motorcycle text-3xl opacity-20 mb-2" />
                  <span className="type-label-sm uppercase opacity-40">
                    {t('comingSoon')}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
          {/* Bottom row: additional destinations aligned under the hero */}
          {destinations.length > 5 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mt-4">
              {destinations.slice(5).map((destination, i) => (
                <motion.div
                  key={destination.id}
                  custom={i + 5}
                  variants={waveStagger(0.08)}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{once: true}}
                >
                  <DestinationCard destination={destination} />
                </motion.div>
              ))}
            </div>
          )}
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-5 bg-[url('/textures/border-pattern.svg')] bg-repeat-x bg-[length:auto_100%] opacity-60" />
      </section>

      {/* About */}
      <section className="py-16 lg:py-24 texture-grain-cool bg-surface-alt">
        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-12 items-center">
            <motion.div
              className="relative"
              initial="hidden"
              whileInView="visible"
              viewport={{once: true}}
              variants={fadeInUp}
            >
              <div className="rounded-lg overflow-hidden aspect-[4/3]">
                <img
                  src="https://i0.wp.com/jolandblog.com/wp-content/uploads/2015/11/ninh-binh-vietname.jpg?fit=1000%2C667&ssl=1"
                  alt="Vietnam landscape"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute bottom-6 left-6 bg-surface-elevated rounded-lg p-5 shadow-lg flex items-center gap-4">
                <span className="icon-phone-call text-2xl text-primary" />
                <div>
                  <p className="type-label-sm font-normal text-on-surface-secondary">
                    {t('bookTourNow')}
                  </p>
                  <a
                    href={`tel:${contactInfo.phone}`}
                    className="text-lg font-semibold text-on-surface hover:text-on-surface-accent transition-colors cursor-pointer"
                  >
                    {contactInfo.phone}
                  </a>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{once: true}}
              variants={fadeInUp}
            >
              <span className="type-label-sm uppercase text-on-surface-accent">
                {t('getToKnowUs')}
              </span>
              <h2 className="type-headline-sm lg:type-headline-lg mt-2 mb-6">
                {t('planYourTrip')}
              </h2>
              <p className="type-body-lg text-on-surface-secondary mb-6">
                {t('aboutDescription')}
              </p>
              <ul className="space-y-4 mb-8">
                {[
                  t('bulletMotorbike'),
                  t('bulletFriendly'),
                  t('bulletExperience'),
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center">
                      <i className="fa fa-check text-primary text-xs" />
                    </span>
                    <span className="text-on-surface">{item}</span>
                  </li>
                ))}
              </ul>
              <a
                href="#"
                className="inline-block bg-primary hover:bg-primary-light text-on-primary type-label-sm uppercase px-8 py-3 rounded-lg transition-colors cursor-pointer"
              >
                {t('bookWithUsNow')}
              </a>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Popular Tours */}
      <section className="py-16 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center mb-12"
            initial="hidden"
            whileInView="visible"
            viewport={{once: true}}
            variants={fadeInUp}
          >
            <span className="type-label-sm uppercase text-on-surface-accent">
              {t('featuredTours')}
            </span>
            <h2 className="type-headline-sm lg:type-headline-lg mt-2">
              {t('mostPopularTours')}
            </h2>
          </motion.div>
          <TourCarousel tours={tours} />
        </div>
      </section>

      {/* Video / CTA */}
      <section className="relative py-24 lg:py-32">
        <div
          className="absolute inset-0 bg-cover bg-center bg-fixed"
          style={{
            backgroundImage: `url(${getUrl('assets/images/backgrounds/video-one-bg-0.jpeg')})`,
          }}
        />
        <div className="absolute inset-0 bg-overlay" />
        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="lg:flex lg:gap-12 lg:items-center">
            <div className="lg:w-3/5 mb-8 lg:mb-0">
              <div className="text-white">
                <button
                  onClick={() => setVideoModalOpen(true)}
                  className="mb-6 w-16 h-16 bg-primary rounded-full flex items-center justify-center text-white hover:bg-primary-light transition-colors animate-pulse cursor-pointer"
                  aria-label="Play video"
                >
                  <i className="fa fa-play ml-1" />
                </button>
                <p className="type-label-lg uppercase text-primary-light mb-2">
                  {t('readyToTravel')}
                </p>
                <h2 className="type-headline-sm lg:type-headline-lg text-white drop-shadow-lg">
                  {t('videoSectionHeading')}
                </h2>
              </div>
            </div>
            <div className="lg:w-2/5">
              <div className="grid grid-cols-2 lg:grid-cols-1 gap-4">
                {[
                  {
                    icon: 'icon-travel-map',
                    label: t('localExperts'),
                    accent: 'primary',
                  },
                  {
                    icon: 'icon-place',
                    label: t('hiddenRoutes'),
                    accent: 'secondary',
                  },
                  {
                    icon: 'icon-flag',
                    label: t('yearsOnRoad'),
                    accent: 'primary',
                  },
                  {
                    icon: 'icon-clock',
                    label: t('dayAndMultiDay'),
                    accent: 'secondary',
                  },
                  {
                    icon: 'icon-user',
                    label: t('smallGroups'),
                    accent: 'primary',
                  },
                  {
                    icon: 'icon-cashback',
                    label: t('allInclusive'),
                    accent: 'secondary',
                  },
                ].map((item, index) => (
                  <motion.div
                    key={item.icon}
                    custom={index}
                    variants={waveStagger(0.1)}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{once: true}}
                    data-testid="feature-card"
                    className="elevation-1 bg-surface-elevated/15 dark:bg-black/40 backdrop-blur dark:backdrop-blur-lg border border-white/15 dark:border-white/15 shadow-sm rounded-lg px-6 py-10 text-center text-white hover:bg-surface-elevated/25 dark:hover:bg-black/50 transition-colors"
                  >
                    <span
                      className={`${item.icon} text-4xl block mb-3 ${item.accent === 'primary' ? 'text-primary-light' : 'text-secondary-light'}`}
                    />
                    <h4 className="type-label-lg whitespace-pre-line text-white drop-shadow-md">
                      {item.label}
                    </h4>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
      <VideoModal
        videoUrl="https://www.youtube.com/watch?v=fXvp76BQ2Fk"
        isOpen={videoModalOpen}
        onClose={() => setVideoModalOpen(false)}
      />

      {/* Gallery */}
      <section className="py-16 lg:py-24 bg-surface-alt">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {galleryImages.map(({src, alt}, index) => (
              <GalleryItem
                key={index}
                imageSrc={src}
                alt={alt}
                delay={(index + 1) * 100}
              />
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

export async function getServerSideProps({
  req,
  res,
  locale,
}: GetServerSidePropsContext) {
  const {getAllTours, getActiveDestinationsFromDb, getMessagesFromDb} =
    await import('@/data/queries');
  const session = await getServerSession(req, res, authOptions);
  const isAdmin = session?.user?.role === 'ADMIN';

  const [tours, destinations, dbMessages] = await Promise.all([
    getAllTours(isAdmin),
    getActiveDestinationsFromDb(isAdmin),
    getMessagesFromDb(locale ?? 'vi'),
  ]);

  return {
    props: {
      tours,
      destinations,
      isAdmin,
      messages: dbMessages,
    },
  };
}
