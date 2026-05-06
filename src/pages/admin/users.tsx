import {useState, useEffect} from 'react';
import {useSession} from 'next-auth/react';
import {useForm} from 'react-hook-form';
import {yupResolver} from '@hookform/resolvers/yup';
import {useAdminFetch} from '@/hooks/useAdminFetch';
import {useAdminLoading} from '@/contexts/AdminLoadingContext';
import {api} from '@/routes';
import type {AdminUser} from '@/types';
import {
  createUserSchema,
  createUserDefaults,
  submitCreateUser,
  type CreateUserFormData,
} from '@/lib/users-form-utils';
import {TextInput, Button} from '@/components/ui';

export default function AdminUsers() {
  const {data: session} = useSession();
  const {data, loading, refetch} =
    useAdminFetch<AdminUser[]>('/api/admin/users');
  const {setLoading} = useAdminLoading();
  const users = data ?? [];

  const [showForm, setShowForm] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const {
    register,
    handleSubmit,
    formState: {errors, isSubmitting},
    reset,
  } = useForm<CreateUserFormData>({
    resolver: yupResolver(createUserSchema),
    defaultValues: createUserDefaults,
    shouldFocusError: true,
  });

  useEffect(() => {
    setLoading(loading);
  }, [loading, setLoading]);

  async function onSubmit(data: CreateUserFormData) {
    setSubmitError('');
    const {error} = await submitCreateUser(data);
    if (error) {
      setSubmitError(error);
      return;
    }
    reset();
    setShowForm(false);
    refetch();
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this admin user?')) return;

    const {error} = await api.admin.users.delete(id);
    if (!error) {
      refetch();
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="type-headline-sm">Users</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-primary hover:bg-primary-light text-on-primary px-4 py-2 rounded-lg type-label-sm uppercase transition-colors cursor-pointer"
        >
          {showForm ? 'Cancel' : '+ New User'}
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="bg-surface-elevated rounded-xl border border-border p-6 mb-6 max-w-lg"
        >
          {submitError && (
            <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-lg type-body-lg mb-4">
              {submitError}
            </div>
          )}
          <div className="space-y-4">
            <TextInput
              label="Name"
              {...register('name')}
              error={errors.name?.message}
            />
            <TextInput
              label="Email"
              type="email"
              {...register('email')}
              error={errors.email?.message}
            />
            <TextInput
              label="Password"
              type="password"
              {...register('password')}
              error={errors.password?.message}
            />
            <Button type="submit" loading={isSubmitting}>
              Create User
            </Button>
          </div>
        </form>
      )}

      <div className="bg-surface-elevated rounded-xl border border-border overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-surface-alt">
              <th className="text-left px-4 py-3 type-label-sm text-on-surface-secondary">
                Name
              </th>
              <th className="text-left px-4 py-3 type-label-sm text-on-surface-secondary">
                Email
              </th>
              <th className="text-left px-4 py-3 type-label-sm text-on-surface-secondary">
                Role
              </th>
              <th className="text-right px-4 py-3 type-label-sm text-on-surface-secondary">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr
                key={user.id}
                className="border-b border-border last:border-0 hover:bg-surface-alt/50"
              >
                <td className="px-4 py-3 type-body-lg text-on-surface">
                  {user.name}
                </td>
                <td className="px-4 py-3 type-body-lg text-on-surface-secondary">
                  {user.email}
                </td>
                <td className="px-4 py-3 type-label-sm text-on-surface-secondary">
                  {user.role}
                </td>
                <td className="px-4 py-3 text-right">
                  {session?.user.id !== user.id && (
                    <button
                      onClick={() => handleDelete(user.id)}
                      className="type-label-sm text-red-500 hover:text-red-700 transition-colors cursor-pointer"
                    >
                      Delete
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
