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
import {Button, TextInput, Textarea, SocialIcons} from '@/components/ui';

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
              <SocialIcons variant="default" />
            </div>
            <div className="lg:col-span-8">
              <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <TextInput
                    type="text"
                    label={t('namePlaceholder')}
                    placeholder="John Smith"
                    error={errors.name?.message}
                    {...register('name')}
                  />
                  <TextInput
                    type="email"
                    label={t('emailPlaceholder')}
                    placeholder="john@example.com"
                    error={errors.email?.message}
                    {...register('email')}
                  />
                </div>
                <Textarea
                  label={t('messagePlaceholder')}
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
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <dl className="divide-y divide-border border-y border-border">
            {(() => {
              const rows = [
                {
                  key: 'loc',
                  icon: 'icon-place',
                  value: (
                    <>
                      <span className="block">{contactInfo.address}</span>
                      <span className="block text-on-surface-secondary">
                        {contactInfo.city}, Vietnam
                      </span>
                    </>
                  ),
                },
                {
                  key: 'tel',
                  icon: 'icon-phone-call',
                  value: (
                    <a
                      href={`tel:${contactInfo.phone}`}
                      className="hover:text-primary underline-offset-4 hover:underline transition-colors cursor-pointer"
                    >
                      {contactInfo.phone}
                    </a>
                  ),
                },
                {
                  key: 'mail',
                  icon: 'icon-at',
                  value: (
                    <a
                      href={`mailto:${contactInfo.email}`}
                      className="hover:text-primary underline-offset-4 hover:underline transition-colors cursor-pointer break-all"
                    >
                      {contactInfo.email}
                    </a>
                  ),
                },
              ];
              return rows.map((row, i) => (
                <div
                  key={row.key}
                  className="grid grid-cols-[auto_auto_1fr] items-center gap-x-5 py-5"
                >
                  <dt className="font-mono type-label-sm text-on-surface-tertiary tabular-nums">
                    {String(i + 1).padStart(2, '0')}/
                    {String(rows.length).padStart(2, '0')}
                  </dt>
                  <span
                    className={`${row.icon} text-xl text-primary w-6 text-center`}
                    aria-hidden="true"
                  />
                  <dd className="type-body-lg text-on-surface">{row.value}</dd>
                </div>
              ));
            })()}
          </dl>
        </div>
      </section>

      <section>
        <iframe
          title="Nha Trang location map"
          src="https://www.openstreetmap.org/export/embed.html?bbox=109.180%2C12.235%2C109.215%2C12.260&layer=mapnik&marker=12.247%2C109.196"
          className="w-full h-96 border-0"
          loading="lazy"
          referrerPolicy="no-referrer"
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
