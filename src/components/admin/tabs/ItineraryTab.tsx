'use client';

import {useState, useCallback} from 'react';
import type {ItineraryDay} from '@/types';
import {EditableProvider} from '@/components/admin/EditableContext';
import {LocalePicker} from '@/components/admin/LocalePicker';
import {AdminIntlProvider} from '@/components/admin/AdminIntlProvider';
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

  const handleRemoveItem = useCallback((path: string) => {
    // path: "itinerary.0.items.1"
    const parts = path.split('.');
    const dayIndex = Number(parts[1]);
    const itemIndex = Number(parts[3]);
    removeItem(dayIndex, itemIndex);
  }, []);

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
    <div className="flex flex-col min-h-[600px]">
      {/* Top toolbar */}
      <div className="border-b border-border p-4 flex flex-wrap items-center gap-3">
        {/* Day chips */}
        <div className="flex flex-wrap items-center gap-2 flex-1">
          {itinerary.map((day, dayIndex) => (
            <div
              key={dayIndex}
              className="inline-flex items-center gap-2 bg-surface-elevated rounded-lg px-3 py-1.5 border border-border type-label-sm"
            >
              <span className="text-on-surface font-medium">
                {day.dayLabel[locale] || `Day ${dayIndex + 1}`}
              </span>
              <span className="text-on-surface-secondary">
                ({day.items.length})
              </span>
              <button
                type="button"
                onClick={() => addItem(dayIndex)}
                className="text-primary hover:text-primary-light cursor-pointer"
                title="Add item"
              >
                +
              </button>
              <button
                type="button"
                onClick={() => removeDay(dayIndex)}
                className="text-red-400 hover:text-red-300 cursor-pointer"
                title="Delete day"
              >
                ×
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={addDay}
            className="type-label-sm text-primary hover:text-primary-light px-3 py-1.5 border border-dashed border-primary/40 rounded-lg cursor-pointer"
          >
            + Add Day
          </button>
        </div>

        {/* Right side: locale, status, save */}
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

      {/* Live preview */}
      <div className="flex-1 p-5 overflow-y-auto">
        <p className="type-label-sm text-on-surface-secondary mb-4">
          Click any text to edit inline. Use + to add items, × to remove days.
        </p>
        <AdminIntlProvider>
          <EditableProvider
            locale={locale}
            onFieldChange={handleFieldChange}
            onRemoveItem={handleRemoveItem}
          >
            <TourItinerary itinerary={itinerary} locale={locale} />
          </EditableProvider>
        </AdminIntlProvider>
      </div>
    </div>
  );
}
