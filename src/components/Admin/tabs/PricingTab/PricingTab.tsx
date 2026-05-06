'use client';

import {useState, useCallback} from 'react';
import {useForm, useFieldArray, useWatch} from 'react-hook-form';
import {yupResolver} from '@hookform/resolvers/yup';
import type * as VMT from '@/domain';
import {EditableProvider} from '../../EditableContext';
import {LocalePicker} from '../../LocalePicker';
import {AdminIntlProvider} from '../../AdminIntlProvider';
import {TourPricing} from '@/components/TourPricing';
import {TextInput, NumberInput, Button} from '@/components/ui';
import {pricingSchema, type PricingFormData} from './PricingTab.form-utils';

type PricingTabProps = {
  initialData: VMT.PricingGroup[];
  onSave: (pricingGroups: VMT.PricingGroup[]) => Promise<void>;
};

export function PricingTab({initialData, onSave}: PricingTabProps) {
  const [locale, setLocale] = useState<'en' | 'vi'>('en');
  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const {
    control,
    setValue,
    getValues,
    formState: {isDirty},
    reset,
    register,
  } = useForm<PricingFormData>({
    resolver: yupResolver(pricingSchema),
    defaultValues: {groups: initialData},
  });

  const {
    fields: groupFields,
    append: appendGroup,
    remove: removeGroup,
  } = useFieldArray({control, name: 'groups'});

  const watchedGroups = useWatch({
    control,
    name: 'groups',
  }) as VMT.PricingGroup[];

  function handleAddGroup() {
    appendGroup({
      type: 'vehicle' as const,
      label: {en: 'New Group', vi: 'Nhóm mới'},
      tiers: [],
    });
  }

  function handleAddTier(groupIndex: number) {
    const group = getValues(`groups.${groupIndex}`);
    const currentTiers = group.tiers;
    setValue(
      `groups.${groupIndex}.tiers` as any,
      [
        ...currentTiers,
        {
          label: {en: 'New Tier', vi: 'Mức mới'},
          price: 0,
          minGroupSize: group.type === 'group-size' ? 2 : undefined,
          maxGroupSize: group.type === 'group-size' ? 4 : undefined,
        },
      ],
      {shouldDirty: true},
    );
  }

  function handleRemoveTier(groupIndex: number, tierIndex: number) {
    const currentTiers = getValues(`groups.${groupIndex}.tiers`);
    setValue(
      `groups.${groupIndex}.tiers` as any,
      currentTiers.filter((_: unknown, i: number) => i !== tierIndex),
      {shouldDirty: true},
    );
  }

  const handleFieldChange = useCallback(
    (path: string, value: string | number) => {
      // EditableProvider paths use raw array indices
      // e.g., "0.tiers.1.price" -> "groups.0.tiers.1.price"
      const rhfPath = `groups.${path}`;
      setValue(rhfPath as any, value as any, {shouldDirty: true});
    },
    [setValue],
  );

  async function handleSave() {
    setSaving(true);
    setSubmitError('');
    try {
      const data = getValues();
      await onSave(data.groups as VMT.PricingGroup[]);
      reset(data);
    } catch (err: unknown) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to save');
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
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={handleAddGroup}
          >
            + Add Group
          </Button>
        </div>
        <div className="flex items-center gap-3">
          <LocalePicker value={locale} onChange={setLocale} />
          {submitError && (
            <span className="type-label-sm text-red-400">{submitError}</span>
          )}
          {isDirty && (
            <span className="type-label-sm text-amber-500">Unsaved</span>
          )}
          <Button
            type="button"
            variant="primary"
            size="lg"
            loading={saving}
            disabled={!isDirty}
            onClick={handleSave}
          >
            Save
          </Button>
        </div>
      </div>

      {/* Two-column: editor + preview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 min-h-[500px]">
        {/* Editor */}
        <div className="p-5 overflow-y-auto space-y-4 border-r border-border">
          {groupFields.length === 0 && (
            <p className="type-body-sm text-on-surface-secondary">
              No pricing groups yet. Click &quot;+ Add Group&quot; to start.
            </p>
          )}

          {groupFields.map((field, gIdx) => {
            const group = watchedGroups?.[gIdx];
            if (!group) return null;

            return (
              <div
                key={field.id}
                className="rounded-lg border border-border overflow-hidden"
              >
                {/* Group header */}
                <div className="bg-surface-elevated px-4 py-3 flex items-center gap-3">
                  <select
                    value={group.type}
                    onChange={(e) =>
                      setValue(
                        `groups.${gIdx}.type` as any,
                        e.target.value as 'vehicle' | 'group-size',
                        {shouldDirty: true},
                      )
                    }
                    className="px-2 py-1.5 rounded-lg border border-border bg-surface text-on-surface type-label-sm cursor-pointer"
                  >
                    <option value="vehicle">Vehicle</option>
                    <option value="group-size">Group Size</option>
                  </select>
                  <TextInput
                    placeholder="Icon (e.g. fa-motorcycle)"
                    className="flex-1 min-w-0"
                    {...register(`groups.${gIdx}.icon`)}
                  />
                  <Button
                    type="button"
                    variant="danger"
                    size="sm"
                    onClick={() => removeGroup(gIdx)}
                    className="shrink-0"
                  >
                    Delete
                  </Button>
                </div>

                {/* Group label */}
                <div className="px-4 py-2 border-b border-border">
                  <TextInput
                    label={`Group Label (${locale.toUpperCase()})`}
                    value={group.label[locale]}
                    onChange={(e) =>
                      setValue(
                        `groups.${gIdx}.label.${locale}` as any,
                        e.target.value,
                        {shouldDirty: true},
                      )
                    }
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
                          <TextInput
                            value={tier.label[locale]}
                            onChange={(e) =>
                              setValue(
                                `groups.${gIdx}.tiers.${tIdx}.label.${locale}` as any,
                                e.target.value,
                                {shouldDirty: true},
                              )
                            }
                          />
                          <NumberInput
                            value={tier.price}
                            onChange={(e) =>
                              setValue(
                                `groups.${gIdx}.tiers.${tIdx}.price` as any,
                                Number(e.target.value),
                                {shouldDirty: true},
                              )
                            }
                          />
                          {group.type === 'group-size' && (
                            <>
                              <NumberInput
                                placeholder="min"
                                value={tier.minGroupSize ?? ''}
                                onChange={(e) =>
                                  setValue(
                                    `groups.${gIdx}.tiers.${tIdx}.minGroupSize` as any,
                                    Number(e.target.value),
                                    {shouldDirty: true},
                                  )
                                }
                              />
                              <NumberInput
                                placeholder="max"
                                value={tier.maxGroupSize ?? ''}
                                onChange={(e) =>
                                  setValue(
                                    `groups.${gIdx}.tiers.${tIdx}.maxGroupSize` as any,
                                    Number(e.target.value),
                                    {shouldDirty: true},
                                  )
                                }
                              />
                            </>
                          )}
                          <Button
                            type="button"
                            variant="danger"
                            size="sm"
                            onClick={() => handleRemoveTier(gIdx, tIdx)}
                          >
                            ×
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}

                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => handleAddTier(gIdx)}
                    className="mt-2"
                  >
                    + Add Tier
                  </Button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Live preview */}
        <div className="p-5 overflow-y-auto bg-surface-alt/30">
          <p className="type-label-sm text-on-surface-secondary mb-4">
            Live preview — click prices or labels to edit inline
          </p>
          <AdminIntlProvider>
            <EditableProvider locale={locale} onFieldChange={handleFieldChange}>
              <TourPricing
                pricingGroups={(watchedGroups ?? []) as VMT.PricingGroup[]}
                locale={locale}
              />
            </EditableProvider>
          </AdminIntlProvider>
        </div>
      </div>
    </div>
  );
}
