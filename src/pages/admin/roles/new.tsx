import {useRouter} from 'next/router';
import type {GetServerSidePropsContext} from 'next';
import {RoleForm, type RoleFormValues} from '@/components/Admin/RoleForm';
import {api, routes} from '@/routes';

export default function NewRolePage() {
  const router = useRouter();

  async function onSubmit(values: RoleFormValues) {
    const {error} = await api.admin.roles.create(
      values as unknown as Record<string, unknown>,
    );
    if (error) {
      alert(error);
      return;
    }
    router.push(routes.admin.roles.list.path());
  }

  return <RoleForm mode="create" onSubmit={onSubmit} />;
}

export async function getServerSideProps({locale}: GetServerSidePropsContext) {
  const {getMessagesFromDb} = await import('@/data/queries');
  const messages = await getMessagesFromDb(locale ?? 'vi');
  return {props: {messages: messages ?? {}}};
}
