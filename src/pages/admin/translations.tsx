import type {GetServerSidePropsContext} from 'next';
import {getServerSession} from 'next-auth';
import {authOptions} from '@/lib/auth';
import {prisma} from '@/lib/prisma';
import {TranslationEditor} from '@/components/admin/TranslationEditor';

interface Props {
  translations: Array<{
    id: string;
    namespace: string;
    key: string;
    valueVi: string;
    valueEn: string;
  }>;
  namespaces: string[];
}

export default function AdminTranslations({translations, namespaces}: Props) {
  return (
    <div>
      <h1 className="type-headline-sm mb-6">Translations</h1>
      <TranslationEditor translations={translations} namespaces={namespaces} />
    </div>
  );
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const session = await getServerSession(context.req, context.res, authOptions);
  if (!session) return {redirect: {destination: '/', permanent: false}};

  const translations = await prisma.translation.findMany({
    orderBy: [{namespace: 'asc'}, {key: 'asc'}],
  });

  const namespaces = [...new Set(translations.map((t) => t.namespace))].sort();

  return {
    props: {
      translations: JSON.parse(JSON.stringify(translations)),
      namespaces,
      messages: (await import(`@/messages/${context.locale}.json`)).default,
    },
  };
}
