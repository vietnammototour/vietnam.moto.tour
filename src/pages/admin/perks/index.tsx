import {useEffect, useState} from 'react';
import Link from 'next/link';
import {api, routes, useNavigate} from '@/routes';
import {Button} from '@/components/ui';
import {useAdminLoading} from '@/contexts/AdminLoadingContext';
import type * as VMT from '@/domain';

const CATEGORIES: VMT.PerkCategory[] = [
  'TRANSPORT',
  'FOOD',
  'ACCOMMODATION',
  'GUIDE',
  'SUPPORT',
  'OTHER',
];

export default function PerksListPage() {
  const navigate = useNavigate();
  const [perks, setPerks] = useState<VMT.Perk[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [showArchived, setShowArchived] = useState(false);
  const {setLoading: setAdminLoading} = useAdminLoading();

  useEffect(() => {
    setLoading(true);
    const params: {archived?: boolean; category?: string; search?: string} = {};
    if (!showArchived) params.archived = false;
    if (categoryFilter) params.category = categoryFilter;
    if (search) params.search = search;
    api.admin.perks.list(params).then(({data}) => {
      if (data) setPerks(data);
      setLoading(false);
    });
  }, [search, categoryFilter, showArchived]);

  useEffect(() => {
    setAdminLoading(loading);
  }, [loading, setAdminLoading]);

  async function handleArchiveToggle(perk: VMT.Perk) {
    const {error} = await api.admin.perks.update(perk.id, {
      archived: !perk.archived,
    });
    if (!error) {
      setPerks((prev) =>
        prev.map((p) => (p.id === perk.id ? {...p, archived: !p.archived} : p)),
      );
    }
  }

  async function handleDelete(perk: VMT.Perk) {
    if (!confirm(`Delete perk "${perk.labelEn}"? This cannot be undone.`))
      return;
    const {error} = await api.admin.perks.delete(perk.id);
    if (error) {
      alert(error);
      return;
    }
    setPerks((prev) => prev.filter((p) => p.id !== perk.id));
  }

  const grouped = perks.reduce<Record<string, VMT.Perk[]>>((acc, p) => {
    (acc[p.category] ??= []).push(p);
    return acc;
  }, {});

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="type-headline-sm">Perks</h1>
        <Button onClick={() => navigate.to(routes.admin.perks.new)}>
          + New Perk
        </Button>
      </div>

      <div className="flex gap-3 mb-4">
        <input
          type="search"
          placeholder="Search…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="px-3 py-2 border border-border rounded bg-surface"
        />
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="cursor-pointer px-3 py-2 border border-border rounded bg-surface"
        >
          <option value="">All categories</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={showArchived}
            onChange={(e) => setShowArchived(e.target.checked)}
            className="cursor-pointer"
          />
          Show archived
        </label>
      </div>

      {!loading && perks.length === 0 && (
        <p className="text-on-surface-secondary">No perks found.</p>
      )}

      {Object.entries(grouped).map(([category, items]) => (
        <section key={category} className="mb-6">
          <h2 className="type-title-sm mb-2">{category}</h2>
          <ul className="space-y-1">
            {items.map((p) => (
              <li
                key={p.id}
                className="flex items-center gap-3 p-3 border border-border rounded bg-surface-elevated"
              >
                <i className={`${p.icon} text-xl w-6 text-center`} />
                <div className="flex-1">
                  <div className="font-medium">{p.labelEn}</div>
                  <div className="text-on-surface-secondary text-sm">
                    {p.labelVi}
                  </div>
                </div>
                {p.archived && (
                  <span className="px-2 py-0.5 text-xs bg-surface-alt rounded">
                    archived
                  </span>
                )}
                <Link
                  href={routes.admin.perks.edit.path({id: p.id})}
                  className="text-primary cursor-pointer"
                >
                  Edit
                </Link>
                <Button
                  variant="secondary"
                  onClick={() => handleArchiveToggle(p)}
                >
                  {p.archived ? 'Unarchive' : 'Archive'}
                </Button>
                <Button variant="secondary" onClick={() => handleDelete(p)}>
                  Delete
                </Button>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
