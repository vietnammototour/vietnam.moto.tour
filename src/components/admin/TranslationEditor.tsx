'use client';

import {useState, useMemo} from 'react';

interface TranslationRow {
  id: string;
  namespace: string;
  key: string;
  valueVi: string;
  valueEn: string;
}

interface TranslationEditorProps {
  translations: TranslationRow[];
  namespaces: string[];
}

export function TranslationEditor({
  translations: initial,
  namespaces,
}: TranslationEditorProps) {
  const [translations, setTranslations] = useState(initial);
  const [filter, setFilter] = useState('');
  const [namespaceFilter, setNamespaceFilter] = useState('');
  const [modified, setModified] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);

  const filtered = useMemo(() => {
    return translations.filter((t) => {
      const matchesNamespace =
        !namespaceFilter || t.namespace === namespaceFilter;
      const matchesSearch =
        !filter ||
        t.key.toLowerCase().includes(filter.toLowerCase()) ||
        t.valueEn.toLowerCase().includes(filter.toLowerCase()) ||
        t.valueVi.toLowerCase().includes(filter.toLowerCase());
      return matchesNamespace && matchesSearch;
    });
  }, [translations, filter, namespaceFilter]);

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

    const res = await fetch('/api/admin/translations', {
      method: 'PUT',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(toUpdate),
    });

    setSaving(false);

    if (res.ok) {
      setModified(new Set());
    }
  }

  return (
    <div>
      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6">
        <input
          type="text"
          placeholder="Search..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="px-3 py-2 rounded-lg border border-border bg-surface text-on-surface focus:outline-none focus:ring-2 focus:ring-primary w-64"
        />
        <select
          value={namespaceFilter}
          onChange={(e) => setNamespaceFilter(e.target.value)}
          className="px-3 py-2 rounded-lg border border-border bg-surface text-on-surface focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
        >
          <option value="">All namespaces</option>
          {namespaces.map((ns) => (
            <option key={ns} value={ns}>
              {ns}
            </option>
          ))}
        </select>
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
                  <span className="text-on-surface-secondary/50">
                    {t.namespace}.
                  </span>
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
  );
}
