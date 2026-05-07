import {useRouter} from 'next/router';
import {useAdminFetch} from '@/hooks/useAdminFetch';
import {api, routes, useNavigate} from '@/routes';
import {PerkForm, type PerkFormValues} from '@/components/Admin/PerkForm';
import type * as VMT from '@/domain';

export default function EditPerkPage() {
  const router = useRouter();
  const navigate = useNavigate();
  const id = typeof router.query.id === 'string' ? router.query.id : null;
  const {
    data: perk,
    loading,
    error,
  } = useAdminFetch<VMT.Perk>(id ? `/api/admin/perks/${id}` : null);

  if (loading) return null;
  if (error || !perk) return <p>Perk not found.</p>;

  const initialData: PerkFormValues = {
    labelEn: perk.labelEn,
    labelVi: perk.labelVi,
    icon: perk.icon,
    category: perk.category,
    archived: perk.archived,
  };

  async function handleSubmit(values: PerkFormValues) {
    if (!id) return;
    const {error: err} = await api.admin.perks.update(id, values);
    if (err) throw new Error(err);
    navigate.to(routes.admin.perks.list);
  }

  return (
    <div>
      <h1 className="type-headline-sm mb-6">Edit Perk</h1>
      <PerkForm mode="edit" initialData={initialData} onSubmit={handleSubmit} />
    </div>
  );
}
