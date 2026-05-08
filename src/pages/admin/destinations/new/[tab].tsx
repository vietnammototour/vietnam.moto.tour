import type {GetServerSidePropsContext} from 'next';
import {useRouter} from 'next/router';
import {DestinationEditTabs} from '@/components/Admin/DestinationEditTabs';
import {isDestinationTab, type DestinationTab} from '@/routes';

const emptyData = {
  slug: '',
  name: '',
  nameVi: '',
  nameEn: '',
  imageUrl: '',
  heroImage: '',
  descriptionVi: '',
  descriptionEn: '',
  size: 'small',
};

export default function NewDestination() {
  const router = useRouter();
  const tabParam = router.query.tab;
  const tab: DestinationTab =
    typeof tabParam === 'string' && isDestinationTab(tabParam)
      ? tabParam
      : 'general';

  return (
    <DestinationEditTabs
      activeTab={tab}
      mode="create"
      destinationId={null}
      initialData={emptyData}
    />
  );
}

export async function getServerSideProps({
  locale,
  params,
}: GetServerSidePropsContext) {
  const tab = params?.tab;
  if (typeof tab !== 'string' || !isDestinationTab(tab)) {
    return {notFound: true};
  }
  if (tab !== 'general') {
    return {
      redirect: {
        destination: '/admin/destinations/new/general',
        permanent: false,
      },
    };
  }
  const {getMessagesFromDb} = await import('@/data/queries');
  const messages = await getMessagesFromDb(locale ?? 'vi');
  return {props: {messages: messages ?? {}}};
}
