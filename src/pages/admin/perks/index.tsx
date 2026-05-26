import {useEffect, useMemo, useState} from 'react';
import type {GetServerSidePropsContext} from 'next';
import {useTranslations} from 'next-intl';
import {api} from '@/routes';
import {Button, IconPicker, Select} from '@/components/ui';
import {LocalePicker, type Locale} from '@/components/Admin/LocalePicker';
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

type Draft = {
  labelEn: string;
  labelVi: string;
  icon: string;
  category: VMT.PerkCategory;
};

function toDraft(p: VMT.Perk): Draft {
  return {
    labelEn: p.labelEn,
    labelVi: p.labelVi,
    icon: p.icon,
    category: p.category,
  };
}

function isDirty(a: Draft, b: Draft) {
  return (
    a.labelEn !== b.labelEn ||
    a.labelVi !== b.labelVi ||
    a.icon !== b.icon ||
    a.category !== b.category
  );
}

export default function PerksListPage() {
  const t = useTranslations('admin.perks');
  const tc = useTranslations('common');
  const [perks, setPerks] = useState<VMT.Perk[]>([]);
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [locale, setLocale] = useState<Locale>('vi');
  const {setLoading: setAdminLoading} = useAdminLoading();

  useEffect(() => {
    setLoading(true);
    api.admin.perks.list().then(({data}) => {
      if (data) {
        setPerks(data);
        setDrafts(Object.fromEntries(data.map((p) => [p.id, toDraft(p)])));
      }
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    setAdminLoading(loading);
  }, [loading, setAdminLoading]);

  const baselines = useMemo(() => {
    const m: Record<string, Draft> = {};
    for (const p of perks) m[p.id] = toDraft(p);
    return m;
  }, [perks]);

  function updateDraft(id: string, patch: Partial<Draft>) {
    setDrafts((prev) => ({...prev, [id]: {...prev[id], ...patch}}));
  }

  async function handleSave(id: string) {
    const draft = drafts[id];
    if (!draft) return;
    setSavingId(id);
    const {data, error} = await api.admin.perks.update(id, draft);
    setSavingId(null);
    if (error || !data) {
      alert(error ?? 'Failed to save');
      return;
    }
    setPerks((prev) => prev.map((p) => (p.id === id ? data : p)));
    setDrafts((prev) => ({...prev, [id]: toDraft(data)}));
  }

  async function handleDelete(perk: VMT.Perk) {
    if (!confirm(t('deleteConfirm', {label: perk.labelEn}))) return;
    const {error} = await api.admin.perks.delete(perk.id);
    if (error) {
      alert(error);
      return;
    }
    setPerks((prev) => prev.filter((p) => p.id !== perk.id));
    setDrafts((prev) => {
      const next = {...prev};
      delete next[perk.id];
      return next;
    });
  }

  async function handleCreate() {
    const {data, error} = await api.admin.perks.create({
      labelEn: 'Untitled',
      labelVi: '',
      icon: '',
      category: 'OTHER',
    });
    if (error || !data) {
      alert(error ?? 'Failed to create perk');
      return;
    }
    setPerks((prev) => [...prev, data]);
    setDrafts((prev) => ({...prev, [data.id]: toDraft(data)}));
  }

  const grouped = perks.reduce<Record<string, VMT.Perk[]>>((acc, p) => {
    (acc[p.category] ??= []).push(p);
    return acc;
  }, {});

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="type-headline-sm">{t('title')}</h1>
        <Button onClick={handleCreate}>{t('new')}</Button>
      </div>

      <div className="mb-4">
        <LocalePicker value={locale} onChange={setLocale} />
      </div>

      {!loading && perks.length === 0 && (
        <p className="text-on-surface-secondary">{t('empty')}</p>
      )}

      {Object.entries(grouped).map(([category, items]) => (
        <section key={category} className="mb-6">
          <h2 className="type-title-sm mb-2">{t(`category.${category}`)}</h2>
          <ul className="space-y-1">
            {items.map((p) => {
              const draft = drafts[p.id] ?? toDraft(p);
              const baseline = baselines[p.id] ?? toDraft(p);
              const dirty = isDirty(draft, baseline);
              const labelKey = locale === 'en' ? 'labelEn' : 'labelVi';
              return (
                <li
                  key={p.id}
                  className="flex items-center gap-3 p-3 border border-border rounded bg-surface-elevated"
                >
                  <IconPicker
                    compact
                    value={draft.icon}
                    onChange={(v) => updateDraft(p.id, {icon: v})}
                  />
                  <input
                    type="text"
                    value={draft[labelKey]}
                    onChange={(e) =>
                      updateDraft(p.id, {
                        [labelKey]: e.target.value,
                      } as Partial<Draft>)
                    }
                    className="flex-1 px-3 py-2 rounded-lg border border-border bg-surface text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <Select
                    fullWidth={false}
                    selectSize="sm"
                    value={draft.category}
                    onChange={(v) =>
                      updateDraft(p.id, {
                        category: v as VMT.PerkCategory,
                      })
                    }
                    options={CATEGORIES.map((c) => ({
                      value: c,
                      label: t(`category.${c}`),
                    }))}
                  />
                  {dirty && (
                    <Button
                      onClick={() => handleSave(p.id)}
                      disabled={savingId === p.id}
                    >
                      {savingId === p.id ? tc('form.saving') : tc('form.save')}
                    </Button>
                  )}
                  <Button variant="secondary" onClick={() => handleDelete(p)}>
                    {tc('delete')}
                  </Button>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}

export async function getServerSideProps({locale}: GetServerSidePropsContext) {
  const {getMessagesFromDb} = await import('@/data/queries');
  const messages = await getMessagesFromDb(locale ?? 'vi');
  return {props: {messages: messages ?? {}}};
}
