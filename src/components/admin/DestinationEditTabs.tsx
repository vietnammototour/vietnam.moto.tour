'use client';

import {useState, useCallback, useEffect, useRef} from 'react';
import {useRouter} from 'next/router';
import {DestinationGeneralForm} from './DestinationGeneralForm';
import {CardImagePreview} from './CardImagePreview';
import {DestinationHighlights} from './DestinationHighlights';
import {LocalePicker, type Locale} from './LocalePicker';

type TabId = 'general' | 'cardImage' | 'highlights';

export interface DestinationFormData {
  slug: string;
  name: string;
  nameVi: string;
  nameEn: string;
  imageUrl: string;
  heroImage: string;
  descriptionVi: string;
  descriptionEn: string;
  size: string;
}

interface DestinationEditTabsProps {
  mode: 'create' | 'edit';
  destinationId: string | null;
  initialData: DestinationFormData;
}

const tabs: {id: TabId; label: string}[] = [
  {id: 'general', label: 'General'},
  {id: 'cardImage', label: 'Card Image'},
  {id: 'highlights', label: 'Highlights'},
];

export function DestinationEditTabs({
  mode,
  destinationId: initialId,
  initialData,
}: DestinationEditTabsProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabId>('general');
  const [destinationId, setDestinationId] = useState<string | null>(initialId);
  const [locale, setLocale] = useState<Locale>('en');
  const [form, setForm] = useState<DestinationFormData>(initialData);

  const handleSaved = useCallback(
    (id: string) => {
      if (!destinationId) {
        setDestinationId(id);
        window.history.replaceState(null, '', `/admin/destinations/${id}/edit`);
      }
    },
    [destinationId],
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

    fetch(`/api/admin/destinations/${destinationId}`, {
      method: 'PUT',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({...form, size: form.size}),
    });
  }, [form.size, destinationId, form]);

  const currentName = locale === 'en' ? form.nameEn : form.nameVi;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="type-headline-sm">
          {mode === 'create' ? 'Create New Destination' : 'Edit Destination'}
        </h1>
        <button
          type="button"
          onClick={() => router.push('/admin/destinations')}
          className="px-4 py-2 rounded-lg border border-border type-label-sm text-on-surface-secondary hover:bg-surface-alt transition-colors cursor-pointer"
        >
          Back to Destinations
        </button>
      </div>

      {/* Tab bar with locale picker */}
      <div className="flex items-center justify-between border-b-2 border-border mb-0">
        <div className="flex">
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
        <div className="pb-2">
          <LocalePicker value={locale} onChange={setLocale} />
        </div>
      </div>

      {/* Tab content */}
      <div className="border border-border border-t-0 rounded-b-lg overflow-hidden">
        {activeTab === 'general' && (
          <div className="p-5">
            <DestinationGeneralForm
              form={form}
              locale={locale}
              mode={mode}
              destinationId={destinationId}
              onFieldChange={updateForm}
              onSaved={handleSaved}
            />
          </div>
        )}

        {activeTab === 'cardImage' && (
          <div className="p-5">
            <CardImagePreview
              destinationId={destinationId}
              imageUrl={form.imageUrl}
              destinationName={currentName}
              size={form.size as 'small' | 'large'}
              onImageChange={(url) => updateForm('imageUrl', url)}
              onSizeChange={(size) => updateForm('size', size)}
            />
          </div>
        )}

        {activeTab === 'highlights' && destinationId && (
          <div className="p-5">
            <DestinationHighlights
              destinationId={destinationId}
              locale={locale}
            />
          </div>
        )}
      </div>
    </div>
  );
}
