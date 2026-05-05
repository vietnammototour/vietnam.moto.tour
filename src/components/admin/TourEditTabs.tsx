'use client';

import {useState, useCallback} from 'react';
import {useRouter} from 'next/router';
import type {ItineraryDay, PricingGroup} from '@/types';
import {GeneralTab} from './tabs/GeneralTab';
import type {GeneralTabData} from './tabs/GeneralTab';
import {ItineraryTab} from './tabs/ItineraryTab';
import {PricingTab} from './tabs/PricingTab';
import {HighlightsTab} from './tabs/HighlightsTab';

type TabId = 'general' | 'itinerary' | 'pricing' | 'highlights';

interface TourEditTabsProps {
  mode: 'create' | 'edit';
  tourId: string | null;
  destinations: Array<{id: string; name: string}>;
  initialGeneral: GeneralTabData;
  initialItinerary: ItineraryDay[];
  initialPricingGroups: PricingGroup[];
  initialHighlightIds: string[];
}

const tabs: {id: TabId; label: string}[] = [
  {id: 'general', label: 'General'},
  {id: 'itinerary', label: 'Itinerary'},
  {id: 'pricing', label: 'Pricing'},
  {id: 'highlights', label: 'Highlights'},
];

export function TourEditTabs({
  mode,
  tourId: initialTourId,
  destinations,
  initialGeneral,
  initialItinerary,
  initialPricingGroups,
  initialHighlightIds,
}: TourEditTabsProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabId>('general');
  const [tourId, setTourId] = useState<string | null>(initialTourId);
  const [destinationId, setDestinationId] = useState(
    initialGeneral.destinationId,
  );

  const handleGeneralSave = useCallback(
    async (data: GeneralTabData) => {
      const url =
        mode === 'create' && !tourId
          ? '/api/admin/tours'
          : `/api/admin/tours/${tourId}`;
      const method = mode === 'create' && !tourId ? 'POST' : 'PUT';

      const res = await fetch(url, {
        method,
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? 'Failed to save');
      }

      const saved = await res.json();
      if (mode === 'create' && !tourId) {
        setTourId(saved.id);
        // Update URL without full reload
        window.history.replaceState(null, '', `/admin/tours/${saved.id}/edit`);
      }
    },
    [mode, tourId],
  );

  const handleItinerarySave = useCallback(
    async (itinerary: ItineraryDay[]) => {
      if (!tourId) throw new Error('Save General tab first');
      const res = await fetch(`/api/admin/tours/${tourId}`, {
        method: 'PUT',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({itinerary}),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? 'Failed to save');
      }
    },
    [tourId],
  );

  const handlePricingSave = useCallback(
    async (pricingGroups: PricingGroup[]) => {
      if (!tourId) throw new Error('Save General tab first');
      const res = await fetch(`/api/admin/tours/${tourId}`, {
        method: 'PUT',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({pricingGroups}),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? 'Failed to save');
      }
    },
    [tourId],
  );

  const handleHighlightsSave = useCallback(
    async (highlightIds: string[]) => {
      if (!tourId) throw new Error('Save General tab first');
      const res = await fetch(`/api/admin/tours/${tourId}`, {
        method: 'PUT',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({highlightIds}),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? 'Failed to save');
      }
    },
    [tourId],
  );

  const isTabDisabled = (tabId: TabId) =>
    tabId !== 'general' && mode === 'create' && !tourId;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="type-headline-sm">
          {mode === 'create' ? 'Create New Tour' : 'Edit Tour'}
        </h1>
        <button
          type="button"
          onClick={() => router.push('/admin/tours')}
          className="px-4 py-2 rounded-lg border border-border type-label-sm text-on-surface-secondary hover:bg-surface-alt transition-colors cursor-pointer"
        >
          Back to Tours
        </button>
      </div>

      {/* Tab bar */}
      <div className="flex border-b-2 border-border mb-0">
        {tabs.map((tab) => {
          const disabled = isTabDisabled(tab.id);
          return (
            <button
              key={tab.id}
              type="button"
              disabled={disabled}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-3 type-label-sm transition-colors cursor-pointer ${
                activeTab === tab.id
                  ? 'text-primary border-b-2 border-primary -mb-[2px] font-semibold'
                  : disabled
                    ? 'text-on-surface-secondary/40 cursor-not-allowed'
                    : 'text-on-surface-secondary hover:text-on-surface'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      <div className="border border-border border-t-0 rounded-b-lg overflow-hidden">
        {activeTab === 'general' && (
          <div className="p-5">
            <GeneralTab
              initialData={initialGeneral}
              destinations={destinations}
              tourId={tourId}
              onDestinationChange={setDestinationId}
              onSave={handleGeneralSave}
            />
          </div>
        )}

        {activeTab === 'itinerary' && (
          <ItineraryTab
            initialData={initialItinerary}
            onSave={handleItinerarySave}
          />
        )}

        {activeTab === 'pricing' && (
          <PricingTab
            initialData={initialPricingGroups}
            onSave={handlePricingSave}
          />
        )}

        {activeTab === 'highlights' && (
          <HighlightsTab
            tourId={tourId}
            destinationId={destinationId}
            initialSelectedIds={initialHighlightIds}
            destinations={destinations}
            onSave={handleHighlightsSave}
          />
        )}
      </div>
    </div>
  );
}
