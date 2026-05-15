import {useEffect, useState} from 'react';
import {useRouter} from 'next/router';
import {UserForm, type UserFormValues} from '@/components/Admin/UserForm';
import {api, routes} from '@/routes';
import type * as VMT from '@/domain';

type TeamImage = {id: string; url: string | null; altVi: string; altEn: string};

export default function EditUserPage() {
  const router = useRouter();
  const id = typeof router.query.id === 'string' ? router.query.id : '';
  const [user, setUser] = useState<VMT.UserAdmin | null>(null);
  const [roles, setRoles] = useState<VMT.OrgRole[]>([]);
  const [images, setImages] = useState<TeamImage[]>([]);

  useEffect(() => {
    if (!id) return;
    api.admin.users.get(id).then(({data}) => {
      if (data) setUser(data);
    });
    api.admin.roles.list().then(({data}) => {
      if (data) setRoles(data);
    });
    fetch('/api/admin/image-collections?key=team')
      .then((r) => r.json())
      .then(async (collections) => {
        const found = Array.isArray(collections)
          ? collections.find((c: {key: string}) => c.key === 'team')
          : null;
        if (!found) return;
        if (Array.isArray(found.images)) {
          setImages(found.images);
        } else {
          const detail = await fetch(
            `/api/admin/image-collections/${found.id}`,
          ).then((r) => r.json());
          if (Array.isArray(detail.images)) setImages(detail.images);
        }
      });
  }, [id]);

  async function onSubmit(values: UserFormValues) {
    const payload: Record<string, unknown> = {
      ...values,
      birthDate: values.birthDate || null,
    };
    if (!values.password) delete payload.password;
    const {error} = await api.admin.users.update(id, payload);
    if (error) {
      alert(error);
      return;
    }
    router.push(routes.admin.users.list.path());
  }

  if (!user) return null;
  const defaults: UserFormValues = {
    name: user.name,
    email: user.email ?? '',
    password: '',
    orgRoleId: user.orgRole.id,
    bioVi: user.bioVi,
    bioEn: user.bioEn,
    birthDate: user.birthDate ? user.birthDate.slice(0, 10) : '',
    imageId: user.imageId,
    isCoreTeam: user.isCoreTeam,
    allowAuth: user.allowAuth,
    teamOrder: user.teamOrder,
  };

  return (
    <UserForm
      mode="edit"
      defaults={defaults}
      roles={roles}
      images={images}
      onSubmit={onSubmit}
    />
  );
}
