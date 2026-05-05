'use client';

import {useState, useCallback} from 'react';
import type {ItineraryDay} from '@/types';
import {EditableProvider} from '@/components/admin/EditableContext';
import {LocalePicker} from '@/components/admin/LocalePicker';
import {TourItinerary} from '@/components/tour-itinerary';

interface ItineraryTabProps {
  initialData: ItineraryDay[];
  onSave: (itinerary: ItineraryDay[]) => Promise<void>;
}

function setNestedValue(
  obj: ItineraryDay[],
  path: string,
  value: string | number,
): ItineraryDay[] {
  const clone = JSON.parse(JSON.stringify(obj)) as ItineraryDay[];
  const parts = path.split('.');
  // path: itinerary.0.items.1.description.en
  // skip first part ("itinerary")
  let current: unknown = clone;
  for (let i = 1; i < parts.length - 1; i++) {
    const key = /^\d+$/.test(parts[i]) ? Number(parts[i]) : parts[i];
    current = (current as Record<string, unknown>)[key as string];
  }
  const lastKey = parts[parts.length - 1];
  (current as Record<string, unknown>)[lastKey] = value;
  return clone;
}

export function ItineraryTab({initialData, onSave}: ItineraryTabProps) {
  const [itinerary, setItinerary] = useState<ItineraryDay[]>(initialData);
  const [locale, setLocale] = useState<'en' | 'vi'>('en');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [savedData, setSavedData] = useState<ItineraryDay[]>(initialData);

  const isDirty = JSON.stringify(itinerary) !== JSON.stringify(savedData);

  const handleFieldChange = useCallback(
    (path: string, value: string | number) => {
      setItinerary((prev) => setNestedValue(prev, path, value));
    },
    [],
  );

  function addDay() {
    setItinerary((prev) => [
      ...prev,
      {
        dayLabel: {en: `Day ${prev.length + 1}`, vi: `Ngày ${prev.length + 1}`},
        items: [],
      },
    ]);
  }

  function removeDay(index: number) {
    setItinerary((prev) => prev.filter((_, i) => i !== index));
  }

  function addItem(dayIndex: number) {
    setItinerary((prev) => {
      const clone = JSON.parse(JSON.stringify(prev)) as ItineraryDay[];
      clone[dayIndex].items.push({
        time: '00:00',
        description: {en: 'New activity', vi: 'Hoạt động mới'},
      });
      return clone;
    });
  }

  function removeItem(dayIndex: number, itemIndex: number) {
    setItinerary((prev) => {
      const clone = JSON.parse(JSON.stringify(prev)) as ItineraryDay[];
      clone[dayIndex].items.splice(itemIndex, 1);
      return clone;
    });
  }

  async function handleSave() {
    setSaving(true);
    setError('');
    try {
      await onSave(itinerary);
      setSavedData(itinerary);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex gap-0 min-h-[600px]">
      {/* Left panel: structural controls */}
      <div className="w-72 shrink-0 border-r border-border p-5 flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <span className="type-title-sm text-on-surface font-semibold">
            Days
          </span>
          <button
            type="button"
            onClick={addDay}
            className="type-label-sm text-primary hover:text-primary-light cursor-pointer"
          >
            + Add Day
          </button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-2">
          {itinerary.map((day, dayIndex) => (
            <div
              key={dayIndex}
              className="bg-surface-elevated rounded-lg p-3 border border-border"
            >
              <div className="type-body-sm text-on-surface font-medium">
                {day.dayLabel[locale]}
              </div>
              <div className="type-label-sm text-on-surface-secondary mt-1">
                {day.items.length} item{day.items.length !== 1 ? 's' : ''}
              </div>
              <div className="flex gap-3 mt-2">
                <button
                  type="button"
                  onClick={() => addItem(dayIndex)}
                  className="type-label-sm text-primary hover:text-primary-light cursor-pointer"
                >
                  + Add Item
                </button>
                {day.items.map((_, itemIndex) => (
                  <button
                    key={itemIndex}
                    type="button"
                    onClick={() => removeItem(dayIndex, itemIndex)}
                    className="type-label-sm text-red-400 hover:text-red-300 cursor-pointer"
                    title={`Remove item ${itemIndex + 1}`}
                  >
                    ×{itemIndex + 1}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() => removeDay(dayIndex)}
                className="type-label-sm text-red-400 hover:text-red-300 mt-2 cursor-pointer"
              >
                Delete Day
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
          {saving ? 'Saving...' : 'Save Itinerary'}
        </button>
      </div>

      {/* Right panel: live preview */}
      <div className="flex-1 p-5 bg-surface-alt/30 overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <span className="type-label-sm text-on-surface-secondary">
            Click any text to edit inline
          </span>
          <LocalePicker value={locale} onChange={setLocale} />
        </div>

        <EditableProvider locale={locale} onFieldChange={handleFieldChange}>
          <TourItinerary itinerary={itinerary} locale={locale} />
        </EditableProvider>
      </div>
    </div>
  );
}
