import Link from 'next/link';
import type {GetStaticPropsContext} from 'next';
import Head from 'next/head';
import {useTranslations} from 'next-intl';
import {routes} from '@/routes';

export default function NotFound() {
  const t = useTranslations('notFound');

  return (
    <>
      <Head>
        <title>{t('title')}</title>
      </Head>
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
        <h1 className="type-display-lg text-primary mb-4">404</h1>
        <p className="type-headline-sm text-on-surface mb-8">{t('message')}</p>
        <Link
          href={routes.home.path()}
          className="bg-primary hover:bg-primary-light text-on-primary type-label-sm uppercase px-8 py-3 cursor-pointer transition-colors"
        >
          {t('backHome')}
        </Link>
      </div>
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
  };
}
