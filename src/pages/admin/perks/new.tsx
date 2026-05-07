import type {GetServerSidePropsContext} from 'next';
import {useTranslations} from 'next-intl';
import {api, routes, useNavigate} from '@/routes';
import {PerkForm, type PerkFormValues} from '@/components/Admin/PerkForm';

export default function NewPerkPage() {
  const t = useTranslations('admin.perks');
  const navigate = useNavigate();

  async function handleSubmit(values: PerkFormValues) {
    const {data, error} = await api.admin.perks.create({
      labelEn: values.labelEn,
      labelVi: values.labelVi,
      icon: values.icon,
      category: values.category,
    });
    if (error || !data) throw new Error(error ?? 'Failed to create perk');
    navigate.to(routes.admin.perks.edit, {id: data.id});
  }

  return (
    <div>
      <h1 className="type-headline-sm mb-6">{t('new')}</h1>
      <PerkForm mode="create" onSubmit={handleSubmit} />
    </div>
  );
}

export async function getServerSideProps({locale}: GetServerSidePropsContext) {
  const {getMessagesFromDb} = await import('@/data/queries');
  const messages = await getMessagesFromDb(locale ?? 'vi');
  return {props: {messages: messages ?? {}}};
}
