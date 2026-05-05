'use client';

import {useState, useEffect, useCallback} from 'react';
import Image from 'next/image';
import {ImageUploadField} from './ImageUploadField';
import {api} from '@/routes';

interface Highlight {
  id: string;
  textEn: string;
  textVi: string;
  imageUrl: string | null;
}

interface DestinationHighlightsProps {
  destinationId: string;
  locale: 'en' | 'vi';
}

export function DestinationHighlights({
  destinationId,
  locale,
}: DestinationHighlightsProps) {
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [loading, setLoading] = useState(true);
  const [newText, setNewText] = useState('');
  const [adding, setAdding] = useState(false);

  const textField = locale === 'en' ? 'textEn' : 'textVi';

  const fetchHighlights = useCallback(async () => {
    try {
      const {data, error} = await api.admin.highlights.list(destinationId);
      if (!error && data) setHighlights(data);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [destinationId]);

  useEffect(() => {
    fetchHighlights();
  }, [fetchHighlights]);

  async function handleAdd() {
    if (!newText.trim()) return;
    setAdding(true);
    const {error} = await api.admin.highlights.create({
      destinationId,
      [textField]: newText,
    });
    if (!error) {
      setNewText('');
      await fetchHighlights();
    }
    setAdding(false);
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this highlight?')) return;
    await api.admin.highlights.delete(id);
    await fetchHighlights();
  }

  async function handleUpdateText(
    id: string,
    field: 'textEn' | 'textVi',
    value: string,
  ) {
    await api.admin.highlights.update(id, {[field]: value});
    await fetchHighlights();
  }

  async function handleImageUpload(id: string, imageUrl: string) {
    await api.admin.highlights.update(id, {imageUrl});
    await fetchHighlights();
  }

  if (loading) {
    return (
      <p className="type-body-sm text-on-surface-secondary">
        Loading highlights...
      </p>
    );
  }

  return (
    <div>
      <h2 className="type-title-lg text-on-surface mb-4">
        Destination Highlights
      </h2>

      {/* Existing highlights */}
      <div className="space-y-3 mb-6">
        {highlights.map((h) => (
          <div
            key={h.id}
            className="flex items-start gap-3 p-3 rounded-lg border border-border bg-surface-elevated"
          >
            <div className="w-16 h-16 shrink-0">
              {h.imageUrl ? (
                <Image
                  src={h.imageUrl}
                  alt={h.textEn}
                  width={64}
                  height={64}
                  className="rounded object-cover w-16 h-16"
                />
              ) : (
                <div className="w-16 h-16 rounded bg-surface-alt flex items-center justify-center type-label-sm text-on-surface-secondary">
                  No img
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0 space-y-1">
              <input
                type="text"
                value={h[textField]}
                onBlur={(e) => {
                  if (e.target.value !== h[textField]) {
                    handleUpdateText(h.id, textField, e.target.value);
                  }
                }}
                onChange={(e) => {
                  setHighlights((prev) =>
                    prev.map((x) =>
                      x.id === h.id ? {...x, [textField]: e.target.value} : x,
                    ),
                  );
                }}
                className="w-full px-2 py-1 rounded border border-border bg-surface text-on-surface type-body-sm cursor-pointer"
                placeholder={
                  locale === 'en' ? 'English text' : 'Vietnamese text'
                }
              />
              <ImageUploadField
                entityType="destination"
                entityId={h.id}
                imageType="card"
                currentUrl={h.imageUrl ?? ''}
                onUploadComplete={(url) => handleImageUpload(h.id, url)}
                label=""
              />
            </div>
            <button
              type="button"
              onClick={() => handleDelete(h.id)}
              className="type-label-sm text-red-400 hover:text-red-300 shrink-0 cursor-pointer"
            >
              Delete
            </button>
          </div>
        ))}
      </div>

      {/* Add new */}
      <div className="p-4 rounded-lg border border-dashed border-border">
        <h3 className="type-title-sm text-on-surface mb-3">Add Highlight</h3>
        <div className="flex gap-2 mb-3">
          <input
            type="text"
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
            placeholder={locale === 'en' ? 'English text' : 'Vietnamese text'}
            className="flex-1 px-3 py-2 rounded-lg border border-border bg-surface text-on-surface type-body-sm cursor-pointer"
          />
          <button
            type="button"
            onClick={handleAdd}
            disabled={adding || !newText.trim()}
            className="bg-primary hover:bg-primary-light text-on-primary px-4 py-2 rounded-lg type-label-sm transition-colors disabled:opacity-50 cursor-pointer"
          >
            {adding ? 'Adding...' : 'Add'}
          </button>
        </div>
      </div>
    </div>
  );
}
