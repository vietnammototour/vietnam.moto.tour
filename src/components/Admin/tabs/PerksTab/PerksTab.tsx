'use client';

import {useState, useEffect, useMemo} from 'react';
import {DndContext, type DragEndEvent} from '@dnd-kit/core';
import {useTranslations} from 'next-intl';
import type * as VMT from '@/domain';
import {api} from '@/routes';
import {Button} from '@/components/ui';
import type {Locale} from '@/components/Admin/LocalePicker';
import {PerkChip} from './PerkChip';
import {PerkDropZone} from './PerkDropZone';

type Zone = 'available' | 'included' | 'excluded';

type PerksTabProps = {
  tourId: string | null;
  initialIncludedIds: string[];
  initialExcludedIds: string[];
  locale: Locale;
  onSave: (data: {
    includedPerkIds: string[];
    excludedPerkIds: string[];
  }) => Promise<void>;
};

const CATEGORIES: VMT.PerkCategory[] = [
  'TRANSPORT',
  'FOOD',
  'ACCOMMODATION',
  'GUIDE',
  'SUPPORT',
  'OTHER',
];

export function PerksTab({
  tourId,
  initialIncludedIds,
  initialExcludedIds,
  locale,
  onSave,
}: PerksTabProps) {
  const t = useTranslations('admin.tours.perksTab');
  const tPerks = useTranslations('admin.perks');
  const tc = useTranslations('common');
  const [allPerks, setAllPerks] = useState<VMT.Perk[]>([]);
  const [included, setIncluded] = useState<Set<string>>(
    new Set(initialIncludedIds),
  );
  const [excluded, setExcluded] = useState<Set<string>>(
    new Set(initialExcludedIds),
  );
  const [savedIncluded, setSavedIncluded] = useState<Set<string>>(
    new Set(initialIncludedIds),
  );
  const [savedExcluded, setSavedExcluded] = useState<Set<string>>(
    new Set(initialExcludedIds),
  );
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.admin.perks.list({archived: false}).then(({data}) => {
      if (data) setAllPerks(data);
    });
  }, []);

  const isDirty =
    setsDiffer(included, savedIncluded) || setsDiffer(excluded, savedExcluded);

  const perkMap = useMemo(() => {
    const m = new Map<string, VMT.Perk>();
    for (const p of allPerks) m.set(p.id, p);
    return m;
  }, [allPerks]);

  const availablePerks = useMemo(() => {
    return allPerks.filter(
      (p) =>
        !included.has(p.id) &&
        !excluded.has(p.id) &&
        (!categoryFilter || p.category === categoryFilter) &&
        (!search ||
          p.labelEn.toLowerCase().includes(search.toLowerCase()) ||
          p.labelVi.toLowerCase().includes(search.toLowerCase())),
    );
  }, [allPerks, included, excluded, search, categoryFilter]);

  function moveTo(perkId: string, target: Zone) {
    setIncluded((prev) => {
      const next = new Set(prev);
      next.delete(perkId);
      if (target === 'included') next.add(perkId);
      return next;
    });
    setExcluded((prev) => {
      const next = new Set(prev);
      next.delete(perkId);
      if (target === 'excluded') next.add(perkId);
      return next;
    });
  }

  function unassign(perkId: string) {
    setIncluded((prev) => {
      const next = new Set(prev);
      next.delete(perkId);
      return next;
    });
    setExcluded((prev) => {
      const next = new Set(prev);
      next.delete(perkId);
      return next;
    });
  }

  function handleDragEnd(e: DragEndEvent) {
    if (!e.over) return;
    const overId = e.over.id as Zone;
    const data = e.active.data.current as {perkId: string; sourceZone: Zone};
    if (overId === data.sourceZone) return;
    if (overId === 'available') unassign(data.perkId);
    else moveTo(data.perkId, overId);
  }

  async function handleSave() {
    if (!tourId) {
      setError(t('saveGeneralFirst'));
      return;
    }
    setSaving(true);
    setError('');
    try {
      await onSave({
        includedPerkIds: [...included],
        excludedPerkIds: [...excluded],
      });
      setSavedIncluded(new Set(included));
      setSavedExcluded(new Set(excluded));
    } catch (err) {
      setError(err instanceof Error ? err.message : t('saveFailed'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <DndContext onDragEnd={handleDragEnd}>
      <div className="space-y-4 p-5">
        <PerkDropZone id="available" title={t('available')}>
          <div className="w-full flex gap-2 mb-2">
            <input
              type="search"
              placeholder={tc('search')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="px-3 py-2 border border-border rounded bg-surface"
            />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="cursor-pointer px-3 py-2 border border-border rounded bg-surface"
            >
              <option value="">{tc('allCategories')}</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {tPerks(`category.${c}`)}
                </option>
              ))}
            </select>
          </div>
          {availablePerks.map((p) => (
            <PerkChip key={p.id} perk={p} locale={locale} zone="available" />
          ))}
          {availablePerks.length === 0 && (
            <p className="text-on-surface-secondary text-sm">
              {t('noneAvailable')}
            </p>
          )}
        </PerkDropZone>

        <div className="grid grid-cols-2 gap-4">
          <PerkDropZone id="included" title={t('included')}>
            {[...included].map((id) => {
              const p = perkMap.get(id);
              return p ? (
                <PerkChip
                  key={p.id}
                  perk={p}
                  locale={locale}
                  zone="included"
                  onRemove={() => unassign(p.id)}
                />
              ) : null;
            })}
          </PerkDropZone>
          <PerkDropZone id="excluded" title={t('excluded')}>
            {[...excluded].map((id) => {
              const p = perkMap.get(id);
              return p ? (
                <PerkChip
                  key={p.id}
                  perk={p}
                  locale={locale}
                  zone="excluded"
                  onRemove={() => unassign(p.id)}
                />
              ) : null;
            })}
          </PerkDropZone>
        </div>

        {error && <p className="text-error">{error}</p>}

        <Button onClick={handleSave} disabled={!isDirty || saving || !tourId}>
          {saving ? tc('form.saving') : t('save')}
        </Button>
      </div>
    </DndContext>
  );
}

function setsDiffer(a: Set<string>, b: Set<string>) {
  if (a.size !== b.size) return true;
  for (const v of a) if (!b.has(v)) return true;
  return false;
}
