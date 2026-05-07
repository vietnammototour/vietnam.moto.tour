'use client';

import {useState, useCallback} from 'react';
import type * as VMT from '@/domain';
import {routes, api, useNavigate} from '@/routes';
import {Tabs, TabPanel, Button} from '@/components/ui';
import {GeneralTab} from '../tabs/GeneralTab';
import type {GeneralTabData} from '../tabs/GeneralTab';
import {ItineraryTab} from '../tabs/ItineraryTab';
import {PricingTab} from '../tabs/PricingTab';
import {HighlightsTab} from '../tabs/HighlightsTab';
import {LocalePicker, type Locale} from '../LocalePicker';
import {AdminBreadcrumbs} from '../AdminBreadcrumbs';

type TabId = 'general' | 'itinerary' | 'pricing' | 'highlights';

type TourEditTabsProps = {
  mode: 'create' | 'edit';
  tourId: string | null;
  destinations: Array<{id: string; name: string}>;
  initialGeneral: GeneralTabData;
  initialItinerary: VMT.ItineraryDay[];
  initialPricingGroups: VMT.PricingGroup[];
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
  const [locale, setLocale] = useState<Locale>('en');

  const destinationName =
    destinations.find((d) => d.id === destinationId)?.name ?? '';

  const handleGeneralSave = useCallback(
    async (data: Omit<GeneralTabData, 'imageCard'>): Promise<string> => {
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
        const newId = String(result.data.id);
        setTourId(newId);
        navigate.replaceUrl(routes.admin.tours.edit, {id: newId});
        return newId;
      }
      return tourId!;
    },
    [mode, tourId, navigate],
  );

  const handleItinerarySave = useCallback(
    async (itinerary: VMT.ItineraryDay[]) => {
      if (!tourId) throw new Error('Save General tab first');
      const {error} = await api.admin.tours.update(tourId, {itinerary});
      if (error) throw new Error(error);
    },
    [tourId],
  );

  const handlePricingSave = useCallback(
    async (pricingGroups: VMT.PricingGroup[]) => {
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

  const tourName =
    initialGeneral.title ||
    initialGeneral.titleEn ||
    initialGeneral.titleVi ||
    '';
  const currentLabel =
    mode === 'create' ? 'New tour' : tourName || 'Untitled tour';

  return (
    <div className="h-full flex flex-col min-h-0">
      <div className="flex items-start justify-between mb-6 gap-4 shrink-0">
        <div className="min-w-0">
          <AdminBreadcrumbs
            items={[
              {label: 'Admin', href: routes.admin.dashboard.path()},
              {label: 'Tours', href: routes.admin.tours.list.path()},
              {label: currentLabel},
            ]}
          />
          <h1 className="type-headline-sm truncate">{currentLabel}</h1>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <LocalePicker value={locale} onChange={setLocale} />
          <Button
            variant="secondary"
            onClick={() => navigate.to(routes.admin.tours.list)}
          >
            Back to Tours
          </Button>
        </div>
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
              locale={locale}
              destinationName={destinationName}
              onDestinationChange={setDestinationId}
              onSave={handleGeneralSave}
            />
          </div>
        </TabPanel>
        <TabPanel tabKey="itinerary">
          <ItineraryTab
            initialData={initialItinerary}
            locale={locale}
            onSave={handleItinerarySave}
          />
        </TabPanel>
        <TabPanel tabKey="pricing">
          <PricingTab
            initialData={initialPricingGroups}
            locale={locale}
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
