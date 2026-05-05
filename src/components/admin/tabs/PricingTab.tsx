'use client';

import {useState, useCallback} from 'react';
import type {PricingGroup} from '@/types';
import {EditableProvider} from '@/components/admin/EditableContext';
import {LocalePicker} from '@/components/admin/LocalePicker';
import {TourPricing} from '@/components/tour-pricing';

interface PricingTabProps {
  initialData: PricingGroup[];
  onSave: (pricingGroups: PricingGroup[]) => Promise<void>;
}

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
    <div className="flex gap-0 min-h-[600px]">
      {/* Left panel */}
      <div className="w-80 shrink-0 border-r border-border p-5 flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <span className="type-title-sm text-on-surface font-semibold">
            Pricing Groups
          </span>
          <button
            type="button"
            onClick={addGroup}
            className="type-label-sm text-primary hover:text-primary-light cursor-pointer"
          >
            + Add Group
          </button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-3">
          {pricingGroups.map((group, gIdx) => (
            <div
              key={gIdx}
              className="bg-surface-elevated rounded-lg p-3 border border-border"
            >
              <div className="flex items-center gap-2 mb-2">
                <select
                  value={group.type}
                  onChange={(e) =>
                    updateGroupType(
                      gIdx,
                      e.target.value as 'vehicle' | 'group-size',
                    )
                  }
                  className="px-2 py-1 rounded border border-border bg-surface text-on-surface type-label-sm cursor-pointer"
                >
                  <option value="vehicle">Vehicle</option>
                  <option value="group-size">Group Size</option>
                </select>
                <input
                  type="text"
                  placeholder="Icon"
                  value={group.icon ?? ''}
                  onChange={(e) => updateGroupIcon(gIdx, e.target.value)}
                  className="w-20 px-2 py-1 rounded border border-border bg-surface text-on-surface type-label-sm cursor-pointer"
                />
                <button
                  type="button"
                  onClick={() => removeGroup(gIdx)}
                  className="type-label-sm text-red-400 hover:text-red-300 ml-auto cursor-pointer"
                >
                  Delete
                </button>
              </div>

              <div className="type-label-sm text-on-surface-secondary mb-2">
                {group.label[locale]} — {group.tiers.length} tier
                {group.tiers.length !== 1 ? 's' : ''}
              </div>

              {group.tiers.map((tier, tIdx) => (
                <div key={tIdx} className="flex items-center gap-2 mb-1">
                  <span className="type-label-sm text-on-surface-secondary truncate flex-1">
                    {tier.label[locale]}
                  </span>
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
                    className="w-16 px-1 py-0.5 rounded border border-border bg-surface text-on-surface type-label-sm cursor-pointer"
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
                        className="w-12 px-1 py-0.5 rounded border border-border bg-surface text-on-surface type-label-sm cursor-pointer"
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
                        className="w-12 px-1 py-0.5 rounded border border-border bg-surface text-on-surface type-label-sm cursor-pointer"
                      />
                    </>
                  )}
                  <button
                    type="button"
                    onClick={() => removeTier(gIdx, tIdx)}
                    className="type-label-sm text-red-400 hover:text-red-300 cursor-pointer"
                  >
                    ×
                  </button>
                </div>
              ))}

              <button
                type="button"
                onClick={() => addTier(gIdx)}
                className="type-label-sm text-primary hover:text-primary-light mt-1 cursor-pointer"
              >
                + Add Tier
              </button>
            </div>
          ))}
        </div>

        {error && <p className="type-label-sm text-red-400 mt-2">{error}</p>}

        {isDirty && (
          <p className="type-label-sm text-amber-500 mt-2">Unsaved changes</p>
        )}

        <button
          type="button"
          onClick={handleSave}
          disabled={saving || !isDirty}
          className="mt-4 bg-primary hover:bg-primary-light text-on-primary px-4 py-2.5 rounded-lg type-label-sm uppercase transition-colors disabled:opacity-50 cursor-pointer"
        >
          {saving ? 'Saving...' : 'Save Pricing'}
        </button>
      </div>

      {/* Right panel: live preview */}
      <div className="flex-1 p-5 bg-surface-alt/30 overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <span className="type-label-sm text-on-surface-secondary">
            Click prices or labels to edit inline
          </span>
          <LocalePicker value={locale} onChange={setLocale} />
        </div>

        <EditableProvider locale={locale} onFieldChange={handleFieldChange}>
          <TourPricing pricingGroups={pricingGroups} locale={locale} />
        </EditableProvider>
      </div>
    </div>
  );
}
