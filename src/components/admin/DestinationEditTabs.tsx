'use client';

import {useState, useCallback, useEffect, useRef} from 'react';
import {routes, api, useNavigate} from '@/routes';
import {Tabs, TabPanel, Button} from '@/components/ui';
import {DestinationGeneralForm} from './DestinationGeneralForm';
import {HeroImagePreview} from './HeroImagePreview';
import {CardImagePreview} from './CardImagePreview';
import {DestinationHighlights} from './DestinationHighlights';
import {LocalePicker, type Locale} from './LocalePicker';

type TabId = 'general' | 'heroImage' | 'cardImage' | 'highlights';

export type DestinationFormData = {
  slug: string;
  name: string;
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
  initialData: DestinationFormData;
};

export function DestinationEditTabs({
  mode,
  destinationId: initialId,
  initialData,
}: DestinationEditTabsProps) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabId>('general');
  const [destinationId, setDestinationId] = useState<string | null>(initialId);
  const [locale, setLocale] = useState<Locale>('en');
  const [form, setForm] = useState<DestinationFormData>(initialData);
  const [imgVersion, setImgVersion] = useState(0);

  const handleSaved = useCallback(
    (id: string) => {
      if (!destinationId) {
        setDestinationId(id);
        navigate.replaceUrl(routes.admin.destinations.edit, {id});
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

  const isTabDisabled = (tabId: TabId) =>
    tabId !== 'general' && mode === 'create' && !destinationId;

  const prevSizeRef = useRef(initialData.size);

  useEffect(() => {
    if (!destinationId || form.size === prevSizeRef.current) return;
    prevSizeRef.current = form.size;

    api.admin.destinations.update(destinationId, {...form, size: form.size});
  }, [form.size, destinationId, form]);

  const currentName = locale === 'en' ? form.nameEn : form.nameVi;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="type-headline-sm">
          {mode === 'create' ? 'Create New Destination' : 'Edit Destination'}
        </h1>
        <div className="flex items-center gap-3">
          <LocalePicker value={locale} onChange={setLocale} />
          <Button
            variant="secondary"
            onClick={() => navigate.to(routes.admin.destinations.list)}
          >
            Back to Destinations
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
            key: 'heroImage',
            label: 'Hero Image',
            disabled: isTabDisabled('heroImage'),
          },
          {
            key: 'cardImage',
            label: 'Card Image',
            disabled: isTabDisabled('cardImage'),
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
            <DestinationGeneralForm
              initialData={form}
              locale={locale}
              mode={mode}
              destinationId={destinationId}
              onSaved={handleSaved}
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
              destinationName={currentName || form.name}
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
