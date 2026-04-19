import {useTranslations} from 'next-intl';
import type {GetStaticPropsContext} from 'next';
import Head from 'next/head';
import {PageHeader} from '@/components/page-header';
import {contactInfo} from '@/utils';

export default function Contact() {
  const t = useTranslations('contact');
  const tMeta = useTranslations('meta');

  return (
    <>
      <Head>
        <title>{tMeta('contactTitle')}</title>
        <meta name="description" content={tMeta('contactDescription')} />
      </Head>

      <PageHeader
        title={t('title')}
        breadcrumbs={[
          {label: t('breadcrumbHome'), href: '/'},
          {label: t('breadcrumbContact')},
        ]}
        backgroundImage="https://media.gadventures.com/media-server/cache/59/d0/59d0b4d7c98928e2b9bf2e208409d5d6.jpg"
      />

      <section className="py-16 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            <div className="lg:col-span-4">
              <span className="type-label-sm uppercase text-on-surface-accent">
                {t('talkWithTeam')}
              </span>
              <h2 className="type-headline-lg mt-2 mb-6">{t('anyQuestion')}</h2>
              <div className="flex gap-3">
                <a
                  href="#"
                  className="w-10 h-10 bg-surface-alt hover:bg-primary hover:text-on-primary rounded-full flex items-center justify-center text-on-surface-secondary transition-all"
                >
                  <i className="fab fa-facebook" />
                </a>
                <a
                  href="#"
                  className="w-10 h-10 bg-surface-alt hover:bg-primary hover:text-on-primary rounded-full flex items-center justify-center text-on-surface-secondary transition-all"
                >
                  <i className="fab fa-twitter" />
                </a>
                <a
                  href="#"
                  className="w-10 h-10 bg-surface-alt hover:bg-primary hover:text-on-primary rounded-full flex items-center justify-center text-on-surface-secondary transition-all"
                >
                  <i className="fab fa-instagram" />
                </a>
              </div>
            </div>
            <div className="lg:col-span-8">
              <form className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <input
                    type="text"
                    placeholder={t('namePlaceholder')}
                    className="w-full bg-surface-alt border-0 rounded-lg px-5 py-4 type-body-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <input
                    type="email"
                    placeholder={t('emailPlaceholder')}
                    className="w-full bg-surface-alt border-0 rounded-lg px-5 py-4 type-body-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <textarea
                  placeholder={t('messagePlaceholder')}
                  rows={6}
                  className="w-full bg-surface-alt border-0 rounded-lg px-5 py-4 type-body-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                />
                <button
                  type="submit"
                  className="bg-primary hover:bg-primary-light text-on-primary type-label-sm uppercase px-8 py-4 rounded-lg transition-colors"
                >
                  {t('sendMessage')}
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-surface-alt">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: 'icon-place',
                lines: [contactInfo.address, `${contactInfo.city}, Vietnam`],
              },
              {icon: 'icon-phone-call', lines: [contactInfo.phone]},
              {icon: 'icon-at', lines: [contactInfo.email]},
            ].map((info, i) => (
              <div
                key={i}
                className="bg-surface-elevated rounded-lg p-8 text-center shadow-sm"
              >
                <span
                  className={`${info.icon} text-4xl text-primary block mb-4`}
                />
                {info.lines.map((line, j) => (
                  <p key={j} className="text-on-surface type-body-sm">
                    {line}
                  </p>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TODO: replace with interactive map when ready */}
      <section>
        <img
          src="/assets/images/map.png"
          alt="Location map"
          className="w-full h-96 object-cover"
        />
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
