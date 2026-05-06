'use client';

import {useState, useCallback} from 'react';
import type {ItineraryDay, PricingGroup} from '@/types';
import {routes, api, useNavigate} from '@/routes';
import {Tabs, TabPanel, Button} from '@/components/ui';
import {GeneralTab} from './tabs/GeneralTab';
import type {GeneralTabData} from './tabs/GeneralTab';
import {ItineraryTab} from './tabs/ItineraryTab';
import {PricingTab} from './tabs/PricingTab';
import {HighlightsTab} from './tabs/HighlightsTab';

type TabId = 'general' | 'itinerary' | 'pricing' | 'highlights';

type TourEditTabsProps = {
  mode: 'create' | 'edit';
  tourId: string | null;
  destinations: Array<{id: string; name: string}>;
  initialGeneral: GeneralTabData;
  initialItinerary: ItineraryDay[];
  initialPricingGroups: PricingGroup[];
  initialHighlightIds: string[];
};

export function TourEditTabs({
  mode,
  tourId: initialTourId,
  destinations,
  initialGeneral,
  initialItinerary,
  initialPricingGroups,
  initialHighlightIds,
}: TourEditTabsProps) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabId>('general');
  const [tourId, setTourId] = useState<string | null>(initialTourId);
  const [destinationId, setDestinationId] = useState(
    initialGeneral.destinationId,
  );

  const handleGeneralSave = useCallback(
    async (data: GeneralTabData) => {
      const isNew = mode === 'create' && !tourId;
      const result = isNew
        ? await api.admin.tours.create(
            data as unknown as Record<string, unknown>,
          )
        : await api.admin.tours.update(
            tourId!,
            data as unknown as Record<string, unknown>,
          );

      if (result.error) throw new Error(result.error);

      if (isNew && result.data) {
        const saved = result.data;
        setTourId(String(saved.id));
        navigate.replaceUrl(routes.admin.tours.edit, {id: String(saved.id)});
      }
    },
    [mode, tourId, navigate],
  );

  const handleItinerarySave = useCallback(
    async (itinerary: ItineraryDay[]) => {
      if (!tourId) throw new Error('Save General tab first');
      const {error} = await api.admin.tours.update(tourId, {itinerary});
      if (error) throw new Error(error);
    },
    [tourId],
  );

  const handlePricingSave = useCallback(
    async (pricingGroups: PricingGroup[]) => {
      if (!tourId) throw new Error('Save General tab first');
      const {error} = await api.admin.tours.update(tourId, {pricingGroups});
      if (error) throw new Error(error);
    },
    [tourId],
  );

  const handleHighlightsSave = useCallback(
    async (highlightIds: string[]) => {
      if (!tourId) throw new Error('Save General tab first');
      const {error} = await api.admin.tours.update(tourId, {highlightIds});
      if (error) throw new Error(error);
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
        <Button
          variant="secondary"
          onClick={() => navigate.to(routes.admin.tours.list)}
        >
          Back to Tours
        </Button>
      </div>

      <Tabs
        items={[
          {
            key: 'general',
            label: 'General',
            disabled: isTabDisabled('general'),
          },
          {
            key: 'itinerary',
            label: 'Itinerary',
            disabled: isTabDisabled('itinerary'),
          },
          {
            key: 'pricing',
            label: 'Pricing',
            disabled: isTabDisabled('pricing'),
          },
          {
            key: 'highlights',
            label: 'Highlights',
            disabled: isTabDisabled('highlights'),
          },
        ]}
        activeKey={activeTab}
        onChange={(key) => setActiveTab(key as TabId)}
      >
        <TabPanel tabKey="general">
          <div className="p-5">
            <GeneralTab
              initialData={initialGeneral}
              destinations={destinations}
              tourId={tourId}
              onDestinationChange={setDestinationId}
              onSave={handleGeneralSave}
            />
          </div>
        </TabPanel>
        <TabPanel tabKey="itinerary">
          <ItineraryTab
            initialData={initialItinerary}
            onSave={handleItinerarySave}
          />
        </TabPanel>
        <TabPanel tabKey="pricing">
          <PricingTab
            initialData={initialPricingGroups}
            onSave={handlePricingSave}
          />
        </TabPanel>
        <TabPanel tabKey="highlights">
          <HighlightsTab
            tourId={tourId}
            destinationId={destinationId}
            initialSelectedIds={initialHighlightIds}
            destinations={destinations}
            onSave={handleHighlightsSave}
          />
        </TabPanel>
      </Tabs>
    </div>
  );
}
