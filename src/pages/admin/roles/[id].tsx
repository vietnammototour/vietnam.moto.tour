import {useEffect, useState} from 'react';
import {useRouter} from 'next/router';
import {RoleForm, type RoleFormValues} from '@/components/Admin/RoleForm';
import {api, routes} from '@/routes';
import type * as VMT from '@/domain';

export default function EditRolePage() {
  const router = useRouter();
  const id = typeof router.query.id === 'string' ? router.query.id : '';
  const [role, setRole] = useState<VMT.OrgRole | null>(null);

  useEffect(() => {
    if (!id) return;
    api.admin.roles.get(id).then(({data}) => {
      if (data) setRole(data);
    });
  }, [id]);

  async function onSubmit(values: RoleFormValues) {
    const {error} = await api.admin.roles.update(
      id,
      values as unknown as Record<string, unknown>,
    );
    if (error) {
      alert(error);
      return;
    }
    router.push(routes.admin.roles.list.path());
  }

  if (!role) return null;
  return <RoleForm mode="edit" defaults={role} onSubmit={onSubmit} />;
}
