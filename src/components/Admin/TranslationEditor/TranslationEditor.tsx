'use client';

import {useState, useMemo} from 'react';
import {api} from '@/routes';
import type * as VMT from '@/domain';

type TranslationEditorProps = {
  translations: VMT.Translation[];
  namespaces: string[];
};

export function TranslationEditor({
  translations: initial,
  namespaces,
}: TranslationEditorProps) {
  const [translations, setTranslations] = useState(initial);
  const [filter, setFilter] = useState('');
  const [activeNamespace, setActiveNamespace] = useState(namespaces[0] ?? '');
  const [modified, setModified] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);

  const modifiedByNamespace = useMemo(() => {
    const counts = new Map<string, number>();
    for (const id of modified) {
      const t = translations.find((tr) => tr.id === id);
      if (t) counts.set(t.namespace, (counts.get(t.namespace) ?? 0) + 1);
    }
    return counts;
  }, [modified, translations]);

  const filtered = useMemo(() => {
    return translations.filter((t) => {
      const matchesNamespace = t.namespace === activeNamespace;
      const matchesSearch =
        !filter ||
        t.key.toLowerCase().includes(filter.toLowerCase()) ||
        t.valueEn.toLowerCase().includes(filter.toLowerCase()) ||
        t.valueVi.toLowerCase().includes(filter.toLowerCase());
      return matchesNamespace && matchesSearch;
    });
  }, [translations, filter, activeNamespace]);

  function handleChange(
    id: string,
    field: 'valueVi' | 'valueEn',
    value: string,
  ) {
    setTranslations((prev) =>
      prev.map((t) => (t.id === id ? {...t, [field]: value} : t)),
    );
    setModified((prev) => new Set(prev).add(id));
  }

  async function handleSave() {
    setSaving(true);

    const toUpdate = translations
      .filter((t) => modified.has(t.id))
      .map((t) => ({
        id: t.id,
        namespace: t.namespace,
        key: t.key,
        valueVi: t.valueVi,
        valueEn: t.valueEn,
      }));

    const {error} = await api.admin.translations.update(toUpdate);
    setSaving(false);

    if (!error) {
      setModified(new Set());
    }
  }

  return (
    <div className="flex gap-6">
      {/* Section links sidebar */}
      <nav className="w-48 shrink-0">
        <ul className="space-y-1">
          {namespaces.map((ns) => {
            const count = modifiedByNamespace.get(ns);
            return (
              <li key={ns}>
                <button
                  onClick={() => setActiveNamespace(ns)}
                  className={`w-full text-left px-3 py-2 rounded-lg type-label-sm transition-colors cursor-pointer flex items-center justify-between ${
                    activeNamespace === ns
                      ? 'bg-primary/10 text-primary'
                      : 'text-on-surface-secondary hover:bg-surface-alt hover:text-on-surface'
                  }`}
                >
                  {ns}
                  {count && (
                    <span className="bg-primary text-on-primary text-xs px-1.5 py-0.5 rounded-full">
                      {count}
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Content area */}
      <div className="flex-1 min-w-0">
        {/* Search + save bar */}
        <div className="flex flex-wrap gap-4 mb-4">
          <input
            type="text"
            placeholder="Search keys or values..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-3 py-2 rounded-lg border border-border bg-surface text-on-surface focus:outline-none focus:ring-2 focus:ring-primary w-64"
          />
          <span className="type-label-sm text-on-surface-secondary self-center">
            {filtered.length} keys
          </span>
          {modified.size > 0 && (
            <button
              onClick={handleSave}
              disabled={saving}
              className="bg-primary hover:bg-primary-light text-on-primary px-4 py-2 rounded-lg type-label-sm uppercase transition-colors disabled:opacity-50 ml-auto cursor-pointer"
            >
              {saving ? 'Saving...' : `Save ${modified.size} changes`}
            </button>
          )}
        </div>

        {/* Table */}
        <div className="bg-surface-elevated rounded-xl border border-border overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-surface-alt">
                <th className="text-left px-4 py-3 type-label-sm text-on-surface-secondary w-48">
                  Key
                </th>
                <th className="text-left px-4 py-3 type-label-sm text-on-surface-secondary">
                  English
                </th>
                <th className="text-left px-4 py-3 type-label-sm text-on-surface-secondary">
                  Vietnamese
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((t) => (
                <tr
                  key={t.id}
                  className={`border-b border-border last:border-0 ${
                    modified.has(t.id) ? 'bg-primary/5' : ''
                  }`}
                >
                  <td className="px-4 py-2 type-label-sm text-on-surface-secondary align-top">
                    {t.key}
                  </td>
                  <td className="px-4 py-2">
                    <input
                      type="text"
                      value={t.valueEn}
                      onChange={(e) =>
                        handleChange(t.id, 'valueEn', e.target.value)
                      }
                      className="w-full px-2 py-1 rounded border border-transparent hover:border-border focus:border-primary bg-transparent text-on-surface focus:outline-none type-body-sm"
                    />
                  </td>
                  <td className="px-4 py-2">
                    <input
                      type="text"
                      value={t.valueVi}
                      onChange={(e) =>
                        handleChange(t.id, 'valueVi', e.target.value)
                      }
                      className="w-full px-2 py-1 rounded border border-transparent hover:border-border focus:border-primary bg-transparent text-on-surface focus:outline-none type-body-sm"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
