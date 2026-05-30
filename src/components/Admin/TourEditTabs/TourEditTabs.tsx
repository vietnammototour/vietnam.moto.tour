'use client';

import {useState, useCallback} from 'react';
import {useTranslations} from 'next-intl';
import type * as VMT from '@/domain';
import {routes, useNavigate, type TourTab} from '@/routes';
import {useCreateTour, useUpdateTour} from '@/queries/admin/tours';
import {Tabs, TabPanel} from '@/components/ui';
import {GeneralTab} from '../tabs/GeneralTab';
import type {GeneralTabData} from '../tabs/GeneralTab';
import {CardTab, type CardTabFormData} from '../tabs/CardTab';
import {ItineraryTab} from '../tabs/ItineraryTab';
import {PricingTab} from '../tabs/PricingTab';
import {HighlightsTab} from '../tabs/HighlightsTab';
import {PerksTab} from '../tabs/PerksTab';
import {LocaleSwitcher, type AdminLocale as Locale} from '@/components/ui';
import {AdminBreadcrumbs} from '../AdminBreadcrumbs';

type TourEditTabsProps = {
  mode: 'create' | 'edit';
  tourId: string | null;
  activeTab: TourTab;
  destinations: Array<{id: string; name: string; heroImage: string}>;
  initialGeneral: GeneralTabData;
  initialCard: CardTabFormData;
  initialItinerary: VMT.ItineraryDay[];
  initialPricingGroups: VMT.PricingGroup[];
  initialHighlightIds: string[];
  initialIncludedPerkIds: string[];
  initialExcludedPerkIds: string[];
};

export function TourEditTabs({
  mode,
  tourId: initialTourId,
  activeTab,
  destinations,
  initialGeneral,
  initialCard,
  initialItinerary,
  initialPricingGroups,
  initialHighlightIds,
  initialIncludedPerkIds,
  initialExcludedPerkIds,
}: TourEditTabsProps) {
  const t = useTranslations('admin.tours.tabs');
  const navigate = useNavigate();
  const [tourId, setTourId] = useState<string | null>(initialTourId);
  const [destinationId, setDestinationId] = useState(
    initialGeneral.destinationId,
  );
  const [locale, setLocale] = useState<Locale>('en');
  const createTour = useCreateTour();
  const updateTour = useUpdateTour();

  const [slug, setSlug] = useState(initialGeneral.slug);
  const [title, setTitle] = useState({
    en: initialGeneral.titleEn,
    vi: initialGeneral.titleVi,
  });
  const [pendingSlug, setPendingSlug] = useState<string | undefined>(undefined);
  const [generalDirty, setGeneralDirty] = useState(false);

  const handleGeneralSave = useCallback(
    async (data: GeneralTabData): Promise<string> => {
      const isNew = mode === 'create' && !tourId;
      const payload = data as unknown as Record<string, unknown>;
      const result = isNew
        ? await createTour.mutateAsync(payload)
        : await updateTour.mutateAsync({id: tourId!, input: payload});

      if (isNew && result) {
        const newId = String((result as {id: string}).id);
        setTourId(newId);
        navigate.replaceUrl(routes.admin.tours.edit, {
          id: newId,
          tab: 'general',
        });
        return newId;
      }
      return tourId!;
    },
    [mode, tourId, navigate, createTour, updateTour],
  );

  const handleItinerarySave = useCallback(
    async (itinerary: VMT.ItineraryDay[]) => {
      if (!tourId) throw new Error('Save General tab first');
      await updateTour.mutateAsync({id: tourId, input: {itinerary}});
    },
    [tourId, updateTour],
  );

  const handlePricingSave = useCallback(
    async (pricingGroups: VMT.PricingGroup[]) => {
      if (!tourId) throw new Error('Save General tab first');
      await updateTour.mutateAsync({id: tourId, input: {pricingGroups}});
    },
    [tourId, updateTour],
  );

  const handleHighlightsSave = useCallback(
    async (highlightIds: string[]) => {
      if (!tourId) throw new Error('Save General tab first');
      await updateTour.mutateAsync({id: tourId, input: {highlightIds}});
    },
    [tourId, updateTour],
  );

  const handlePerksSave = useCallback(
    async (data: {includedPerkIds: string[]; excludedPerkIds: string[]}) => {
      if (!tourId) throw new Error('Save General tab first');
      await updateTour.mutateAsync({id: tourId, input: data});
    },
    [tourId, updateTour],
  );

  const isTabDisabled = (tabId: TourTab) =>
    tabId !== 'general' && mode === 'create' && !tourId;

  const tourLabel =
    (mode === 'create' ? 'New tour' : title[locale] || title.en || title.vi) ||
    'Untitled tour';

  const dest = destinations.find((d) => d.id === destinationId);
  const cardPreviewTour: VMT.Tour = {
    id: tourId ?? 'preview',
    slug,
    destinationId,
    destinationName: {en: dest?.name ?? '', vi: dest?.name ?? ''},
    destinationHeroImage: dest?.heroImage ?? '',
    title,
    description: {en: '', vi: ''},
    imageUrl: '',
    images: [],
    duration: initialGeneral.duration,
    distance: initialGeneral.distance,
    transportation: initialGeneral.transportation,
    hotel: initialGeneral.hotel,
    guided: initialGeneral.guided,
    tripadvisorLocationId: null,
    itinerary: [],
    pricingGroups: [],
    paymentDetails: {en: '', vi: ''},
    notes: [],
    mealsInfo: {en: '', vi: ''},
    status: 'PUBLISHED',
    highlights: [],
    included: [],
    excluded: [],
  };

  return (
    <div className="h-full flex flex-col min-h-0">
      <div className="flex items-start justify-between mb-6 gap-4 shrink-0">
        <div className="min-w-0">
          <AdminBreadcrumbs
            items={[
              {label: 'Admin', href: routes.admin.dashboard.path()},
              {label: 'Tours', href: routes.admin.tours.list.path()},
              {
                label: slug || 'new',
                editable: {
                  fieldLabel: 'Slug',
                  onCommit: (next) => {
                    setSlug(next);
                    setPendingSlug(next);
                  },
                },
              },
            ]}
          />
          <h1 className="type-headline-sm truncate">{tourLabel}</h1>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {generalDirty && (
            <span className="type-label-sm text-primary">
              Unsaved changes
            </span>
          )}
          <LocaleSwitcher value={locale} onChange={setLocale} />
        </div>
      </div>

      <Tabs
        items={routes.admin.tours.edit.tabs.map((tab) => ({
          key: tab.key,
          label: t(tab.key),
          disabled: isTabDisabled(tab.key),
        }))}
        activeKey={activeTab}
        onChange={(key) => {
          const next = key as TourTab;
          if (mode === 'create' && !tourId) {
            navigate.to(routes.admin.tours.new, {tab: next});
          } else {
            navigate.to(routes.admin.tours.edit, {id: tourId!, tab: next});
          }
        }}
      >
        <TabPanel tabKey="general">
          <GeneralTab
            initialData={initialGeneral}
            destinations={destinations}
            tourId={tourId}
            locale={locale}
            externalSlug={pendingSlug}
            onSlugChange={(s) => {
              setSlug(s);
              setPendingSlug(undefined);
            }}
            onTitleChange={(activeTitle) =>
              setTitle((prev) => ({...prev, [locale]: activeTitle}))
            }
            onDestinationChange={setDestinationId}
            onDirtyChange={setGeneralDirty}
            onSave={handleGeneralSave}
          />
        </TabPanel>
        <TabPanel tabKey="card">
          <CardTab
            tourId={tourId}
            locale={locale}
            initialData={initialCard}
            previewTour={cardPreviewTour}
          />
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
        <TabPanel tabKey="perks">
          <PerksTab
            tourId={tourId}
            initialIncludedIds={initialIncludedPerkIds}
            initialExcludedIds={initialExcludedPerkIds}
            locale={locale}
            onSave={handlePerksSave}
          />
        </TabPanel>
      </Tabs>
    </div>
  );
}
