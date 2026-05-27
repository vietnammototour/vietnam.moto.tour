import {useTranslations} from 'next-intl';
import type {GetStaticPropsContext} from 'next';
import Head from 'next/head';
import {PageHeader} from '@/components/PageHeader';
import {contactInfo} from '@/utils';
import {useForm} from 'react-hook-form';
import {yupResolver} from '@hookform/resolvers/yup';
import {
  contactSchema,
  contactDefaults,
  submitContact,
  type ContactFormData,
} from '@/lib/contact-form-utils';
import {Button, TextInput, Textarea} from '@/components/ui';

export default function Contact() {
  const t = useTranslations('contact');
  const tc = useTranslations('common');
  const tMeta = useTranslations('meta');

  const {
    register,
    handleSubmit,
    formState: {errors, isSubmitting},
    reset,
  } = useForm<ContactFormData>({
    resolver: yupResolver(contactSchema),
    defaultValues: contactDefaults,
    shouldFocusError: true,
  });

  async function onSubmit(data: ContactFormData) {
    await submitContact(data);
    reset();
  }

  return (
    <>
      <Head>
        <title>{tMeta('contactTitle')}</title>
        <meta name="description" content={tMeta('contactDescription')} />
      </Head>

      <PageHeader
        title={t('title')}
        breadcrumbs={[
          {label: tc('breadcrumbHome'), href: '/'},
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
                  href={contactInfo.youtubeLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="YouTube"
                  className="w-11 h-11 bg-surface-alt hover:bg-primary hover:text-on-primary flex items-center justify-center text-on-surface-secondary transition-all cursor-pointer"
                >
                  <i className="fab fa-youtube" aria-hidden="true" />
                </a>
                <a
                  href={contactInfo.tripadvisorLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="TripAdvisor"
                  className="w-11 h-11 bg-surface-alt hover:bg-primary hover:text-on-primary flex items-center justify-center text-on-surface-secondary transition-all cursor-pointer"
                >
                  <i className="fab fa-tripadvisor" aria-hidden="true" />
                </a>
                <a
                  href={`https://wa.me/${contactInfo.whatsApp.replace(/[^0-9]/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="WhatsApp"
                  className="w-11 h-11 bg-surface-alt hover:bg-primary hover:text-on-primary flex items-center justify-center text-on-surface-secondary transition-all cursor-pointer"
                >
                  <i className="fab fa-whatsapp" aria-hidden="true" />
                </a>
              </div>
            </div>
            <div className="lg:col-span-8">
              <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <TextInput
                    type="text"
                    label={t('namePlaceholder')}
                    placeholder={t('namePlaceholder')}
                    error={errors.name?.message}
                    {...register('name')}
                  />
                  <TextInput
                    type="email"
                    label={t('emailPlaceholder')}
                    placeholder={t('emailPlaceholder')}
                    error={errors.email?.message}
                    {...register('email')}
                  />
                </div>
                <Textarea
                  label={t('messagePlaceholder')}
                  placeholder={t('messagePlaceholder')}
                  rows={6}
                  error={errors.message?.message}
                  {...register('message')}
                />
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  loading={isSubmitting}
                  disabled={isSubmitting}
                >
                  {t('sendMessage')}
                </Button>
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
              <div key={i} className="bg-surface-elevated p-8 text-center">
                <span
                  className={`${info.icon} text-xl text-primary block mb-8`}
                />
                {info.lines.map((line, j) => (
                  <p key={j} className="type-body-sm text-on-surface">
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
  const {getMessagesFromDb} = await import('@/data/queries');
  const dbMessages = await getMessagesFromDb(locale ?? 'vi');

  return {
    props: {
      messages: dbMessages,
    },
    revalidate: 60,
  };
}
