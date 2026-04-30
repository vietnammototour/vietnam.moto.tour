import {useState} from 'react';
import {useSession} from 'next-auth/react';
import type {GetServerSidePropsContext} from 'next';
import {getServerSession} from 'next-auth';
import {authOptions} from '@/lib/auth';
import {prisma} from '@/lib/prisma';

interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: string;
  createdAt: string;
}

interface Props {
  users: AdminUser[];
}

export default function AdminUsers({users: initial}: Props) {
  const {data: session} = useSession();
  const [users, setUsers] = useState(initial);
  const [showForm, setShowForm] = useState(false);
  const [newUser, setNewUser] = useState({email: '', name: '', password: ''});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');

    const res = await fetch('/api/admin/users', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(newUser),
    });

    setSaving(false);

    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? 'Failed to create user');
      return;
    }

    const created = await res.json();
    setUsers((prev) => [created, ...prev]);
    setNewUser({email: '', name: '', password: ''});
    setShowForm(false);
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this admin user?')) return;

    const res = await fetch(`/api/admin/users/${id}`, {method: 'DELETE'});
    if (res.ok) {
      setUsers((prev) => prev.filter((u) => u.id !== id));
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
          onSubmit={handleCreate}
          className="bg-surface-elevated rounded-xl border border-border p-6 mb-6 max-w-lg"
        >
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-lg type-body-sm mb-4">
              {error}
            </div>
          )}
          <div className="space-y-4">
            <div>
              <label className="block type-label-sm text-on-surface-secondary mb-1">
                Name
              </label>
              <input
                type="text"
                required
                value={newUser.name}
                onChange={(e) =>
                  setNewUser((p) => ({...p, name: e.target.value}))
                }
                className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block type-label-sm text-on-surface-secondary mb-1">
                Email
              </label>
              <input
                type="email"
                required
                value={newUser.email}
                onChange={(e) =>
                  setNewUser((p) => ({...p, email: e.target.value}))
                }
                className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block type-label-sm text-on-surface-secondary mb-1">
                Password
              </label>
              <input
                type="password"
                required
                minLength={8}
                value={newUser.password}
                onChange={(e) =>
                  setNewUser((p) => ({...p, password: e.target.value}))
                }
                className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <button
              type="submit"
              disabled={saving}
              className="bg-primary hover:bg-primary-light text-on-primary px-6 py-2 rounded-lg type-label-sm uppercase transition-colors disabled:opacity-50 cursor-pointer"
            >
              {saving ? 'Creating...' : 'Create User'}
            </button>
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
                <td className="px-4 py-3 type-body-sm text-on-surface">
                  {user.name}
                </td>
                <td className="px-4 py-3 type-body-sm text-on-surface-secondary">
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

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const session = await getServerSession(context.req, context.res, authOptions);
  if (!session) return {redirect: {destination: '/', permanent: false}};

  const users = await prisma.user.findMany({
    select: {id: true, email: true, name: true, role: true, createdAt: true},
    orderBy: {createdAt: 'desc'},
  });

  return {
    props: {
      users: JSON.parse(JSON.stringify(users)),
      messages: (await import(`@/messages/${context.locale}.json`)).default,
    },
  };
}
