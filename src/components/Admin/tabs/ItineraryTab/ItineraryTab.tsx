'use client';

import {useState, useCallback} from 'react';
import {useForm, useFieldArray, useWatch} from 'react-hook-form';
import {yupResolver} from '@hookform/resolvers/yup';
import type * as VMT from '@/domain';
import {EditableProvider} from '../../EditableContext';
import {AdminIntlProvider} from '../../AdminIntlProvider';
import {TourItinerary} from '@/components/TourItinerary';
import {Button} from '@/components/ui';
import {
  itinerarySchema,
  type ItineraryFormData,
} from './ItineraryTab.form-utils';

type ItineraryTabProps = {
  initialData: VMT.ItineraryDay[];
  locale: 'en' | 'vi';
  onSave: (itinerary: VMT.ItineraryDay[]) => Promise<void>;
};

export function ItineraryTab({initialData, locale, onSave}: ItineraryTabProps) {
  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const {
    control,
    setValue,
    formState: {isDirty},
    reset,
    getValues,
  } = useForm<ItineraryFormData>({
    resolver: yupResolver(itinerarySchema),
    defaultValues: {days: initialData},
  });

  const {
    fields: dayFields,
    append: appendDay,
    remove: removeDay,
  } = useFieldArray({control, name: 'days'});

  const watchedDays = useWatch({control, name: 'days'}) as VMT.ItineraryDay[];

  function handleAddDay() {
    appendDay({
      dayLabel: {
        en: `Day ${dayFields.length + 1}`,
        vi: `Ngày ${dayFields.length + 1}`,
      },
      items: [],
    });
  }

  function handleAddItem(dayIndex: number) {
    const currentItems = getValues(`days.${dayIndex}.items`);
    setValue(
      `days.${dayIndex}.items` as any,
      [
        ...currentItems,
        {time: '00:00', description: {en: 'New activity', vi: 'Hoạt động mới'}},
      ],
      {shouldDirty: true},
    );
  }

  const handleRemoveItem = useCallback(
    (dayIndex: number, itemIndex: number) => {
      const currentItems = getValues(`days.${dayIndex}.items`);
      setValue(
        `days.${dayIndex}.items` as any,
        currentItems.filter((_: unknown, i: number) => i !== itemIndex),
        {shouldDirty: true},
      );
    },
    [getValues, setValue],
  );

  const handleFieldChange = useCallback(
    (path: string, value: string | number) => {
      // path from EditableProvider: "itinerary.0.items.1.description.en"
      // Convert to RHF path: "days.0.items.1.description.en"
      const rhfPath = path.replace(/^itinerary\./, 'days.');

      setValue(rhfPath as any, value as any, {shouldDirty: true});
    },
    [setValue],
  );

  const handleRemoveItemFromPreview = useCallback(
    (path: string) => {
      // path: "itinerary.0.items.1"
      const parts = path.split('.');
      const dayIndex = Number(parts[1]);
      const itemIndex = Number(parts[3]);
      handleRemoveItem(dayIndex, itemIndex);
    },
    [handleRemoveItem],
  );

  async function handleSave() {
    setSaving(true);
    setSubmitError('');
    try {
      const data = getValues();
      await onSave(data.days as VMT.ItineraryDay[]);
      reset(data);
    } catch (err: unknown) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col min-h-[600px]">
      {/* Top toolbar */}
      <div className="border-b border-border p-4 flex flex-wrap items-center gap-3">
        {/* Day chips */}
        <div className="flex flex-wrap items-center gap-2 flex-1">
          {dayFields.map((field, dayIndex) => (
            <div
              key={field.id}
              className="inline-flex items-center gap-2 bg-surface-elevated rounded-lg px-3 py-1.5 border border-border type-label-sm"
            >
              <span className="text-on-surface font-medium">
                {watchedDays?.[dayIndex]?.dayLabel[locale] ||
                  `Day ${dayIndex + 1}`}
              </span>
              <span className="text-on-surface-secondary">
                ({watchedDays?.[dayIndex]?.items.length ?? 0})
              </span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => handleAddItem(dayIndex)}
                title="Add item"
              >
                +
              </Button>
              <Button
                type="button"
                variant="danger"
                size="sm"
                onClick={() => removeDay(dayIndex)}
                title="Delete day"
              >
                ×
              </Button>
            </div>
          ))}
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={handleAddDay}
          >
            + Add Day
          </Button>
        </div>

        {/* Right side: status, save */}
        <div className="flex items-center gap-3">
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

      {/* Live preview */}
      <div className="flex-1 p-5 overflow-y-auto">
        <p className="type-label-sm text-on-surface-secondary mb-4">
          Click any text to edit inline. Use + to add items, × to remove days.
        </p>
        <AdminIntlProvider locale={locale}>
          <EditableProvider
            locale={locale}
            onFieldChange={handleFieldChange}
            onRemoveItem={handleRemoveItemFromPreview}
          >
            <TourItinerary itinerary={watchedDays ?? []} locale={locale} />
          </EditableProvider>
        </AdminIntlProvider>
      </div>
    </div>
  );
}
