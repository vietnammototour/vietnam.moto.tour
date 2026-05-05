'use client';

import {useState, useCallback} from 'react';
import type {PricingGroup} from '@/types';
import {EditableProvider} from '@/components/admin/EditableContext';
import {LocalePicker} from '@/components/admin/LocalePicker';
import {AdminIntlProvider} from '@/components/admin/AdminIntlProvider';
import {TourPricing} from '@/components/tour-pricing';

type PricingTabProps = {
  initialData: PricingGroup[];
  onSave: (pricingGroups: PricingGroup[]) => Promise<void>;
};

function setNestedValue(
  obj: PricingGroup[],
  path: string,
  value: string | number,
): PricingGroup[] {
  const clone = JSON.parse(JSON.stringify(obj)) as PricingGroup[];
  const parts = path.split('.');
  let current: unknown = clone;
  for (let i = 0; i < parts.length - 1; i++) {
    const key = /^\d+$/.test(parts[i]) ? Number(parts[i]) : parts[i];
    current = (current as Record<string, unknown>)[key as string];
  }
  const lastKey = parts[parts.length - 1];
  (current as Record<string, unknown>)[lastKey] = value;
  return clone;
}

export function PricingTab({initialData, onSave}: PricingTabProps) {
  const [pricingGroups, setPricingGroups] =
    useState<PricingGroup[]>(initialData);
  const [locale, setLocale] = useState<'en' | 'vi'>('en');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [savedData, setSavedData] = useState<PricingGroup[]>(initialData);

  const isDirty = JSON.stringify(pricingGroups) !== JSON.stringify(savedData);

  const handleFieldChange = useCallback(
    (path: string, value: string | number) => {
      setPricingGroups((prev) => setNestedValue(prev, path, value));
    },
    [],
  );

  function addGroup() {
    setPricingGroups((prev) => [
      ...prev,
      {
        type: 'vehicle' as const,
        label: {en: 'New Group', vi: 'Nhóm mới'},
        tiers: [],
      },
    ]);
  }

  function removeGroup(index: number) {
    setPricingGroups((prev) => prev.filter((_, i) => i !== index));
  }

  function updateGroupType(index: number, type: 'vehicle' | 'group-size') {
    setPricingGroups((prev) => {
      const clone = JSON.parse(JSON.stringify(prev)) as PricingGroup[];
      clone[index].type = type;
      return clone;
    });
  }

  function updateGroupIcon(index: number, icon: string) {
    setPricingGroups((prev) => {
      const clone = JSON.parse(JSON.stringify(prev)) as PricingGroup[];
      clone[index].icon = icon;
      return clone;
    });
  }

  function updateGroupLabel(index: number, value: string) {
    setPricingGroups((prev) => {
      const clone = JSON.parse(JSON.stringify(prev)) as PricingGroup[];
      clone[index].label[locale] = value;
      return clone;
    });
  }

  function addTier(groupIndex: number) {
    setPricingGroups((prev) => {
      const clone = JSON.parse(JSON.stringify(prev)) as PricingGroup[];
      clone[groupIndex].tiers.push({
        label: {en: 'New Tier', vi: 'Mức mới'},
        price: 0,
        minGroupSize: clone[groupIndex].type === 'group-size' ? 2 : undefined,
        maxGroupSize: clone[groupIndex].type === 'group-size' ? 4 : undefined,
      });
      return clone;
    });
  }

  function removeTier(groupIndex: number, tierIndex: number) {
    setPricingGroups((prev) => {
      const clone = JSON.parse(JSON.stringify(prev)) as PricingGroup[];
      clone[groupIndex].tiers.splice(tierIndex, 1);
      return clone;
    });
  }

  function updateTierField(
    groupIndex: number,
    tierIndex: number,
    field: string,
    value: string | number,
  ) {
    setPricingGroups((prev) => {
      const clone = JSON.parse(JSON.stringify(prev)) as PricingGroup[];
      (
        clone[groupIndex].tiers[tierIndex] as unknown as Record<string, unknown>
      )[field] = value;
      return clone;
    });
  }

  function updateTierLabel(
    groupIndex: number,
    tierIndex: number,
    value: string,
  ) {
    setPricingGroups((prev) => {
      const clone = JSON.parse(JSON.stringify(prev)) as PricingGroup[];
      clone[groupIndex].tiers[tierIndex].label[locale] = value;
      return clone;
    });
  }

  async function handleSave() {
    setSaving(true);
    setError('');
    try {
      await onSave(pricingGroups);
      setSavedData(pricingGroups);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col">
      {/* Top toolbar */}
      <div className="border-b border-border p-4 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 flex-1">
          <span className="type-title-sm text-on-surface font-semibold">
            Pricing Groups
          </span>
          <button
            type="button"
            onClick={addGroup}
            className="type-label-sm text-primary hover:text-primary-light px-3 py-1.5 border border-dashed border-primary/40 rounded-lg cursor-pointer"
          >
            + Add Group
          </button>
        </div>
        <div className="flex items-center gap-3">
          <LocalePicker value={locale} onChange={setLocale} />
          {error && <span className="type-label-sm text-red-400">{error}</span>}
          {isDirty && (
            <span className="type-label-sm text-amber-500">Unsaved</span>
          )}
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || !isDirty}
            className="bg-primary hover:bg-primary-light text-on-primary px-4 py-1.5 rounded-lg type-label-sm uppercase transition-colors disabled:opacity-50 cursor-pointer"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>

      {/* Two-column: editor + preview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 min-h-[500px]">
        {/* Editor */}
        <div className="p-5 overflow-y-auto space-y-4 border-r border-border">
          {pricingGroups.length === 0 && (
            <p className="type-body-sm text-on-surface-secondary">
              No pricing groups yet. Click &quot;+ Add Group&quot; to start.
            </p>
          )}

          {pricingGroups.map((group, gIdx) => (
            <div
              key={gIdx}
              className="rounded-lg border border-border overflow-hidden"
            >
              {/* Group header */}
              <div className="bg-surface-elevated px-4 py-3 flex items-center gap-3">
                <select
                  value={group.type}
                  onChange={(e) =>
                    updateGroupType(
                      gIdx,
                      e.target.value as 'vehicle' | 'group-size',
                    )
                  }
                  className="px-2 py-1.5 rounded-lg border border-border bg-surface text-on-surface type-label-sm cursor-pointer"
                >
                  <option value="vehicle">Vehicle</option>
                  <option value="group-size">Group Size</option>
                </select>
                <input
                  type="text"
                  placeholder="Icon (e.g. fa-motorcycle)"
                  value={group.icon ?? ''}
                  onChange={(e) => updateGroupIcon(gIdx, e.target.value)}
                  className="flex-1 min-w-0 px-2 py-1.5 rounded-lg border border-border bg-surface text-on-surface type-label-sm cursor-pointer"
                />
                <button
                  type="button"
                  onClick={() => removeGroup(gIdx)}
                  className="type-label-sm text-red-400 hover:text-red-300 cursor-pointer shrink-0"
                >
                  Delete
                </button>
              </div>

              {/* Group label */}
              <div className="px-4 py-2 border-b border-border">
                <label className="type-label-sm text-on-surface-secondary">
                  Group Label ({locale.toUpperCase()})
                </label>
                <input
                  type="text"
                  value={group.label[locale]}
                  onChange={(e) => updateGroupLabel(gIdx, e.target.value)}
                  className="w-full mt-1 px-2 py-1.5 rounded-lg border border-border bg-surface text-on-surface type-body-sm cursor-pointer"
                />
              </div>

              {/* Tiers table */}
              <div className="px-4 py-3">
                {group.tiers.length > 0 && (
                  <div className="space-y-2">
                    {/* Column headers */}
                    <div
                      className={`grid gap-2 type-label-sm text-on-surface-secondary ${
                        group.type === 'group-size'
                          ? 'grid-cols-[1fr_80px_60px_60px_28px]'
                          : 'grid-cols-[1fr_80px_28px]'
                      }`}
                    >
                      <span>Label ({locale.toUpperCase()})</span>
                      <span>Price ($)</span>
                      {group.type === 'group-size' && (
                        <>
                          <span>Min</span>
                          <span>Max</span>
                        </>
                      )}
                      <span />
                    </div>

                    {/* Tier rows */}
                    {group.tiers.map((tier, tIdx) => (
                      <div
                        key={tIdx}
                        className={`grid gap-2 items-center ${
                          group.type === 'group-size'
                            ? 'grid-cols-[1fr_80px_60px_60px_28px]'
                            : 'grid-cols-[1fr_80px_28px]'
                        }`}
                      >
                        <input
                          type="text"
                          value={tier.label[locale]}
                          onChange={(e) =>
                            updateTierLabel(gIdx, tIdx, e.target.value)
                          }
                          className="w-full px-2 py-1.5 rounded-lg border border-border bg-surface text-on-surface type-body-sm cursor-pointer"
                        />
                        <input
                          type="number"
                          value={tier.price}
                          onChange={(e) =>
                            updateTierField(
                              gIdx,
                              tIdx,
                              'price',
                              Number(e.target.value),
                            )
                          }
                          className="w-full px-2 py-1.5 rounded-lg border border-border bg-surface text-on-surface type-body-sm cursor-pointer"
                        />
                        {group.type === 'group-size' && (
                          <>
                            <input
                              type="number"
                              placeholder="min"
                              value={tier.minGroupSize ?? ''}
                              onChange={(e) =>
                                updateTierField(
                                  gIdx,
                                  tIdx,
                                  'minGroupSize',
                                  Number(e.target.value),
                                )
                              }
                              className="w-full px-2 py-1.5 rounded-lg border border-border bg-surface text-on-surface type-body-sm cursor-pointer"
                            />
                            <input
                              type="number"
                              placeholder="max"
                              value={tier.maxGroupSize ?? ''}
                              onChange={(e) =>
                                updateTierField(
                                  gIdx,
                                  tIdx,
                                  'maxGroupSize',
                                  Number(e.target.value),
                                )
                              }
                              className="w-full px-2 py-1.5 rounded-lg border border-border bg-surface text-on-surface type-body-sm cursor-pointer"
                            />
                          </>
                        )}
                        <button
                          type="button"
                          onClick={() => removeTier(gIdx, tIdx)}
                          className="w-7 h-7 flex items-center justify-center rounded-full text-red-400 hover:text-red-300 hover:bg-red-400/10 transition-colors cursor-pointer type-label-sm"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => addTier(gIdx)}
                  className="type-label-sm text-primary hover:text-primary-light mt-2 cursor-pointer"
                >
                  + Add Tier
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Live preview */}
        <div className="p-5 overflow-y-auto bg-surface-alt/30">
          <p className="type-label-sm text-on-surface-secondary mb-4">
            Live preview — click prices or labels to edit inline
          </p>
          <AdminIntlProvider>
            <EditableProvider locale={locale} onFieldChange={handleFieldChange}>
              <TourPricing pricingGroups={pricingGroups} locale={locale} />
            </EditableProvider>
          </AdminIntlProvider>
        </div>
      </div>
    </div>
  );
}
