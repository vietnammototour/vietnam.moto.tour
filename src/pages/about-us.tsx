import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import type { GetStaticPropsContext } from 'next';
import Head from 'next/head';
import { PageHeader } from '@/components/page-header';
import { VideoModal } from '@/components/video-modal';

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};

export default function AboutUs() {
  const [videoOpen, setVideoOpen] = useState(false);
  const t = useTranslations('about');
  const tMeta = useTranslations('meta');

  return (
    <>
      <Head>
        <title>{tMeta('aboutTitle')}</title>
        <meta name="description" content={tMeta('aboutDescription')} />
      </Head>

      <PageHeader
        title={t('title')}
        breadcrumbs={[
          { label: t('breadcrumbHome'), href: '/' },
          { label: t('breadcrumbPages') },
          { label: t('breadcrumbAbout') },
        ]}
        backgroundImage="https://vietnamamazingtours.com/uploads/Northern-Vietnam-Tours.jpeg"
      />

      <section className="py-16 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-12 items-center">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeInUp}
            >
              <div className="rounded-lg overflow-hidden">
                <img
                  src="assets/images/resources/about-page-img.jpg"
                  alt="About us"
                  className="w-full object-cover"
                />
              </div>
            </motion.div>
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeInUp}
            >
              <span className="text-xs font-bold uppercase tracking-widest text-primary">{t('learnAboutUs')}</span>
              <h2 className="text-3xl lg:text-4xl font-bold mt-2 mb-4">{t('dareToExplore')}</h2>
              <p className="text-primary font-semibold mb-4">{t('perfectPlace')}</p>
              <p className="text-neutral-500 mb-8">
                {t('aboutDescription')}
              </p>
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between mb-2">
                    <h4 className="text-sm font-bold text-neutral-900">{t('bestServices')}</h4>
                    <span className="text-sm font-bold text-primary">77%</span>
                  </div>
                  <div className="w-full bg-neutral-200 rounded-full h-2">
                    <div className="bg-primary h-2 rounded-full" style={{ width: '77%' }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <h4 className="text-sm font-bold text-neutral-900">{t('tourAgents')}</h4>
                    <span className="text-sm font-bold text-primary">38%</span>
                  </div>
                  <div className="w-full bg-neutral-200 rounded-full h-2">
                    <div className="bg-primary h-2 rounded-full" style={{ width: '38%' }} />
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="bg-primary py-12 lg:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col lg:flex-row items-center justify-between gap-6">
          <div className="text-white text-center lg:text-left">
            <p className="font-display text-sm opacity-80 mb-1">{t('planYourTrip')}</p>
            <h2 className="text-2xl lg:text-3xl font-bold">{t('readyForTour')}</h2>
          </div>
          <Link
            href="/contact"
            className="bg-white text-primary hover:bg-neutral-100 font-bold text-xs uppercase tracking-wider px-8 py-4 rounded-lg transition-colors flex-shrink-0"
          >
            {t('bookTourNow')}
          </Link>
        </div>
      </section>

      <section className="relative py-24 lg:py-32">
        <div
          className="absolute inset-0 bg-cover bg-center bg-fixed"
          style={{ backgroundImage: 'url(assets/images/backgrounds/video-one-two-bg.jpg)' }}
        />
        <div className="absolute inset-0 bg-overlay" />
        <div className="relative z-10 text-center text-white">
          <button
            onClick={() => setVideoOpen(true)}
            className="mx-auto mb-6 w-20 h-20 bg-primary rounded-full flex items-center justify-center text-white hover:bg-primary-light transition-colors animate-pulse"
            aria-label="Play video"
          >
            <i className="fa fa-play text-xl ml-1" />
          </button>
          <p className="text-sm font-semibold uppercase tracking-widest text-primary-light mb-2">
            {t('readyToTravel')}
          </p>
          <h2 className="text-3xl lg:text-4xl font-bold max-w-2xl mx-auto leading-tight">
            {t('platformDescription')}
          </h2>
        </div>
      </section>
      <VideoModal
        videoUrl="https://www.youtube.com/watch?v=Get7rqXYrbQ"
        isOpen={videoOpen}
        onClose={() => setVideoOpen(false)}
      />

      <section className="bg-secondary py-12 lg:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center text-white">
            {[
              { value: '870+', label: t('totalTours') },
              { value: '480+', label: t('happyRiders') },
              { value: '930+', label: t('happyPeople') },
              { value: '15+', label: t('yearsExperience') },
            ].map((stat) => (
              <div key={stat.label}>
                <h3 className="text-3xl lg:text-4xl font-bold mb-1">{stat.value}</h3>
                <p className="text-sm text-white/70">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

export async function getStaticProps({ locale }: GetStaticPropsContext) {
  return {
    props: {
      messages: (await import(`@/messages/${locale}.json`)).default,
    },
  };
}
