import {useEffect, useState} from 'react';
import {useRouter} from 'next/router';
import {UserForm, type UserFormValues} from '@/components/Admin/UserForm';
import {api, routes} from '@/routes';
import type * as VMT from '@/domain';

type TeamImage = {id: string; url: string | null; altVi: string; altEn: string};

export default function NewUserPage() {
  const router = useRouter();
  const [roles, setRoles] = useState<VMT.OrgRole[]>([]);
  const [images, setImages] = useState<TeamImage[]>([]);

  useEffect(() => {
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
  }, []);

  async function onSubmit(values: UserFormValues) {
    const payload: Record<string, unknown> = {
      ...values,
      birthDate: values.birthDate || null,
    };
    const {error} = await api.admin.users.create(payload);
    if (error) {
      alert(error);
      return;
    }
    router.push(routes.admin.users.list.path());
  }

  return (
    <UserForm mode="create" roles={roles} images={images} onSubmit={onSubmit} />
  );
}
