import {useEffect, useRef, useState} from 'react';
import {motion} from 'framer-motion';
import {useTranslations} from 'next-intl';
import type {GetStaticPropsContext} from 'next';
import Head from 'next/head';

import {DestinationCard} from '@/components/destination-card';
import {TourCarousel} from '@/components/tour-carousel';
import {GalleryItem} from '@/components/gallery-item';
import {VideoModal} from '@/components/video-modal';

import {destinationsData, toursData} from '@/data';
import {getUrl} from '@/utils';

const galleryImages = [
  getUrl('assets/images/gallery/gallery-one-img-1.jpeg'),
  getUrl('assets/images/gallery/gallery-one-img-2.jpeg'),
  getUrl('assets/images/gallery/gallery-one-img-3.jpeg'),
  getUrl('assets/images/gallery/gallery-one-img-4.jpeg'),
  getUrl('assets/images/gallery/gallery-one-img-5.jpeg'),
];

const fadeInUp = {
  hidden: {opacity: 0, y: 30},
  visible: {opacity: 1, y: 0, transition: {duration: 0.6}},
};

export default function Home() {
  const bannerVideoRef = useRef<HTMLVideoElement>(null);
  const [videoModalOpen, setVideoModalOpen] = useState(false);
  const t = useTranslations('home');
  const tMeta = useTranslations('meta');

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
      <section className="relative h-[calc(100vh-4rem)] lg:h-[calc(100vh-5rem-36px)] min-h-[600px] flex items-center justify-center overflow-hidden">
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
        <div className="absolute inset-0 bg-overlay" />
        <div className="relative z-10 text-center text-white px-4 drop-shadow-lg">
          <h2 className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl mb-4 text-white">
            {t('heroTitle')}
          </h2>
          <p className="text-lg sm:text-xl md:text-2xl font-light text-white">
            {t('heroSubtitle')}
          </p>
        </div>
      </section>

      {/* Destinations */}
      <section className="py-16 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center mb-12"
            initial="hidden"
            whileInView="visible"
            viewport={{once: true}}
            variants={fadeInUp}
          >
            <span className="text-xs font-bold uppercase tracking-widest text-primary">
              {t('destinationLists')}
            </span>
            <h2 className="font-display text-3xl lg:text-4xl font-bold mt-2">
              {t('goExoticPlaces')}
            </h2>
          </motion.div>
          {/* Magazine grid: hero left spanning 2 rows, 2x2 small cards right */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <motion.div
              className="sm:col-span-2 sm:row-span-2"
              initial="hidden"
              whileInView="visible"
              viewport={{once: true}}
              variants={fadeInUp}
            >
              <DestinationCard
                destination={destinationsData[0]}
                className="h-full"
              />
            </motion.div>
            {destinationsData.slice(1, 5).map((destination, i) => (
              <motion.div
                key={destination.id}
                initial="hidden"
                whileInView="visible"
                viewport={{once: true}}
                variants={{
                  ...fadeInUp,
                  visible: {
                    ...fadeInUp.visible,
                    transition: {duration: 0.6, delay: (i + 1) * 0.1},
                  },
                }}
              >
                <DestinationCard destination={destination} />
              </motion.div>
            ))}
          </div>
          {/* Bottom row: additional destinations aligned under the hero */}
          {destinationsData.length > 5 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mt-4">
              {destinationsData.slice(5).map((destination, i) => (
                <motion.div
                  key={destination.id}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{once: true}}
                  variants={{
                    ...fadeInUp,
                    visible: {
                      ...fadeInUp.visible,
                      transition: {duration: 0.6, delay: (i + 5) * 0.1},
                    },
                  }}
                >
                  <DestinationCard destination={destination} />
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* About */}
      <section className="py-16 lg:py-24 bg-surface-alt">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
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
              <div className="absolute bottom-6 left-6 bg-surface-elevated rounded-lg p-4 shadow-lg flex items-center gap-3">
                <span className="icon-phone-call text-2xl text-primary" />
                <div>
                  <p className="text-xs text-on-surface-secondary">
                    {t('bookTourNow')}
                  </p>
                  <a
                    href="tel:+84-935-797-550"
                    className="font-bold text-on-surface hover:text-primary transition-colors"
                  >
                    +84 935 797 550
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
              <span className="text-xs font-bold uppercase tracking-widest text-primary">
                {t('getToKnowUs')}
              </span>
              <h2 className="font-display text-3xl lg:text-4xl font-bold mt-2 mb-6">
                {t('planYourTrip')}
              </h2>
              <p className="font-display text-on-surface-secondary mb-6">
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
                className="inline-block bg-primary hover:bg-primary-light text-on-primary font-bold text-xs uppercase tracking-wider px-8 py-3 rounded-lg transition-colors"
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
            <span className="text-xs font-bold uppercase tracking-widest text-primary">
              {t('featuredTours')}
            </span>
            <h2 className="font-display text-3xl lg:text-4xl font-bold mt-2">
              {t('mostPopularTours')}
            </h2>
          </motion.div>
          <TourCarousel tours={toursData} />
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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="text-white">
              <button
                onClick={() => setVideoModalOpen(true)}
                className="mb-6 w-16 h-16 bg-primary rounded-full flex items-center justify-center text-white hover:bg-primary-light transition-colors animate-pulse"
                aria-label="Play video"
              >
                <i className="fa fa-play ml-1" />
              </button>
              <p className="text-sm font-semibold uppercase tracking-widest text-primary-light mb-2">
                {t('readyToTravel')}
              </p>
              <h2 className="font-display text-3xl lg:text-4xl font-bold leading-tight text-white drop-shadow-lg">
                {t('videoSectionHeading')}
              </h2>
            </div>
            <div className="grid grid-cols-2 gap-6">
              {[
                {icon: 'icon-travel-map', label: t('wildlifeTours')},
                {icon: 'icon-place', label: t('bikeTours')},
                {icon: 'icon-flag', label: t('adventureTours')},
                {icon: 'icon-clock', label: t('fullDayTours')},
              ].map((item) => (
                <div
                  key={item.icon}
                  className="bg-surface-elevated/15 backdrop-blur-sm rounded-lg p-6 text-center text-white hover:bg-surface-elevated/25 transition-colors"
                >
                  <span
                    className={`${item.icon} text-3xl text-primary-light block mb-3`}
                  />
                  <h4 className="text-sm font-semibold whitespace-pre-line text-white drop-shadow-md">
                    {item.label}
                  </h4>
                </div>
              ))}
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
            {galleryImages.map((imageSrc, index) => (
              <GalleryItem
                key={index}
                imageSrc={imageSrc}
                delay={(index + 1) * 100}
              />
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

export async function getStaticProps({locale}: GetStaticPropsContext) {
  return {
    props: {
      messages: (await import(`@/messages/${locale}.json`)).default,
    },
  };
}
