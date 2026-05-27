'use client';

import {useState, useCallback, useEffect, useRef} from 'react';
import {useTranslations} from 'next-intl';
import {routes, api, useNavigate, type DestinationTab} from '@/routes';
import {
  Tabs,
  TabPanel,
  LocaleSwitcher,
  type AdminLocale as Locale,
} from '@/components/ui';
import {DestinationGeneralForm} from '../DestinationGeneralForm';
import {HeroImagePreview} from '../HeroImagePreview';
import {CardImagePreview} from '../CardImagePreview';
import {DestinationHighlights} from '../DestinationHighlights';
import {AdminBreadcrumbs} from '../AdminBreadcrumbs';

export type DestinationFormData = {
  slug: string;
  nameVi: string;
  nameEn: string;
  imageUrl: string;
  heroImage: string;
  descriptionVi: string;
  descriptionEn: string;
  size: string;
};

type DestinationEditTabsProps = {
  mode: 'create' | 'edit';
  destinationId: string | null;
  activeTab: DestinationTab;
  initialData: DestinationFormData;
};

export function DestinationEditTabs({
  mode,
  destinationId: initialId,
  activeTab,
  initialData,
}: DestinationEditTabsProps) {
  const navigate = useNavigate();
  const t = useTranslations('admin.destinations.tabs');
  const [destinationId, setDestinationId] = useState<string | null>(initialId);
  const [locale, setLocale] = useState<Locale>('en');
  const [form, setForm] = useState<DestinationFormData>(initialData);
  const [imgVersion, setImgVersion] = useState(0);
  const [pendingSlug, setPendingSlug] = useState<string | undefined>(undefined);

  const handleSaved = useCallback(
    (id: string) => {
      if (!destinationId) {
        setDestinationId(id);
        navigate.replaceUrl(routes.admin.destinations.edit, {
          id,
          tab: 'general',
        });
      }
    },
    [destinationId, navigate],
  );

  const updateForm = useCallback(
    <K extends keyof DestinationFormData>(
      key: K,
      value: DestinationFormData[K],
    ) => {
      setForm((prev) => ({...prev, [key]: value}));
    },
    [],
  );

  const isTabDisabled = (tabId: DestinationTab) =>
    tabId !== 'general' && mode === 'create' && !destinationId;

  const prevSizeRef = useRef(initialData.size);

  useEffect(() => {
    if (!destinationId || form.size === prevSizeRef.current) return;
    prevSizeRef.current = form.size;

    api.admin.destinations.update(destinationId, {...form, size: form.size});
  }, [form.size, destinationId, form]);

  const currentName = locale === 'en' ? form.nameEn : form.nameVi;

  const destName = form.nameEn || form.nameVi || '';
  const currentLabel =
    mode === 'create' ? 'New destination' : destName || 'Untitled destination';

  return (
    <div className="h-full flex flex-col min-h-0">
      <div className="flex items-start justify-between mb-6 gap-4 shrink-0">
        <div className="min-w-0">
          <AdminBreadcrumbs
            items={[
              {label: 'Admin', href: routes.admin.dashboard.path()},
              {
                label: 'Destinations',
                href: routes.admin.destinations.list.path(),
              },
              {
                label: form.slug || 'new',
                editable: {
                  fieldLabel: 'Slug',
                  onCommit: (next) => {
                    updateForm('slug', next);
                    setPendingSlug(next);
                  },
                },
              },
            ]}
          />
          <h1 className="type-headline-sm truncate">{currentLabel}</h1>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <LocaleSwitcher value={locale} onChange={setLocale} />
        </div>
      </div>

      <Tabs
        items={routes.admin.destinations.edit.tabs.map((tab) => ({
          key: tab.key,
          label: t(tab.key),
          disabled: isTabDisabled(tab.key),
        }))}
        activeKey={activeTab}
        onChange={(key) => {
          const next = key as DestinationTab;
          if (mode === 'create' && !destinationId) {
            navigate.to(routes.admin.destinations.new, {tab: next});
          } else {
            navigate.to(routes.admin.destinations.edit, {
              id: destinationId!,
              tab: next,
            });
          }
        }}
      >
        <TabPanel tabKey="general">
          <div className="p-5">
            <DestinationGeneralForm
              initialData={form}
              locale={locale}
              mode={mode}
              destinationId={destinationId}
              externalSlug={pendingSlug}
              onSaved={(id) => {
                setPendingSlug(undefined);
                handleSaved(id);
              }}
            />
          </div>
        </TabPanel>
        <TabPanel tabKey="heroImage">
          <div className="p-5">
            <HeroImagePreview
              destinationId={destinationId}
              heroImage={
                form.heroImage ? `${form.heroImage}?v=${imgVersion}` : ''
              }
              destinationName={currentName || destName}
              onImageChange={(url) => {
                updateForm('heroImage', url);
                setImgVersion((v) => v + 1);
              }}
            />
          </div>
        </TabPanel>
        <TabPanel tabKey="cardImage">
          <div className="p-5">
            <CardImagePreview
              destinationId={destinationId}
              imageUrl={form.imageUrl ? `${form.imageUrl}?v=${imgVersion}` : ''}
              destinationName={currentName}
              size={form.size as 'small' | 'large'}
              onImageChange={(url) => {
                updateForm('imageUrl', url);
                setImgVersion((v) => v + 1);
              }}
              onSizeChange={(size) => updateForm('size', size)}
            />
          </div>
        </TabPanel>
        <TabPanel tabKey="highlights">
          <div className="p-5">
            {destinationId && (
              <DestinationHighlights
                destinationId={destinationId}
                locale={locale}
              />
            )}
          </div>
        </TabPanel>
      </Tabs>
    </div>
  );
}
