'use client';

import {useState, useEffect, useCallback} from 'react';
import Image from 'next/image';
import {ImageUploadField} from './ImageUploadField';

interface Highlight {
  id: string;
  textEn: string;
  textVi: string;
  imageUrl: string | null;
}

interface DestinationHighlightsProps {
  destinationId: string;
}

export function DestinationHighlights({
  destinationId,
}: DestinationHighlightsProps) {
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTextEn, setNewTextEn] = useState('');
  const [newTextVi, setNewTextVi] = useState('');
  const [adding, setAdding] = useState(false);

  const fetchHighlights = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/admin/highlights?destinationId=${destinationId}`,
      );
      const data = await res.json();
      setHighlights(data);
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
    if (!newTextEn.trim()) return;
    setAdding(true);
    const res = await fetch('/api/admin/highlights', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({
        destinationId,
        textEn: newTextEn,
        textVi: newTextVi,
      }),
    });
    if (res.ok) {
      setNewTextEn('');
      setNewTextVi('');
      await fetchHighlights();
    }
    setAdding(false);
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this highlight?')) return;
    await fetch(`/api/admin/highlights/${id}`, {method: 'DELETE'});
    await fetchHighlights();
  }

  async function handleUpdateText(
    id: string,
    field: 'textEn' | 'textVi',
    value: string,
  ) {
    await fetch(`/api/admin/highlights/${id}`, {
      method: 'PUT',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({[field]: value}),
    });
    await fetchHighlights();
  }

  async function handleImageUpload(id: string, imageUrl: string) {
    await fetch(`/api/admin/highlights/${id}`, {
      method: 'PUT',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({imageUrl}),
    });
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
                value={h.textEn}
                onBlur={(e) => {
                  if (e.target.value !== h.textEn) {
                    handleUpdateText(h.id, 'textEn', e.target.value);
                  }
                }}
                onChange={(e) => {
                  setHighlights((prev) =>
                    prev.map((x) =>
                      x.id === h.id ? {...x, textEn: e.target.value} : x,
                    ),
                  );
                }}
                className="w-full px-2 py-1 rounded border border-border bg-surface text-on-surface type-body-sm cursor-pointer"
                placeholder="English text"
              />
              <input
                type="text"
                value={h.textVi}
                onBlur={(e) => {
                  if (e.target.value !== h.textVi) {
                    handleUpdateText(h.id, 'textVi', e.target.value);
                  }
                }}
                onChange={(e) => {
                  setHighlights((prev) =>
                    prev.map((x) =>
                      x.id === h.id ? {...x, textVi: e.target.value} : x,
                    ),
                  );
                }}
                className="w-full px-2 py-1 rounded border border-border bg-surface text-on-surface type-body-sm cursor-pointer"
                placeholder="Vietnamese text"
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-3">
          <input
            type="text"
            value={newTextEn}
            onChange={(e) => setNewTextEn(e.target.value)}
            placeholder="English text"
            className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-on-surface type-body-sm cursor-pointer"
          />
          <input
            type="text"
            value={newTextVi}
            onChange={(e) => setNewTextVi(e.target.value)}
            placeholder="Vietnamese text"
            className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-on-surface type-body-sm cursor-pointer"
          />
        </div>
        <button
          type="button"
          onClick={handleAdd}
          disabled={adding || !newTextEn.trim()}
          className="bg-primary hover:bg-primary-light text-on-primary px-4 py-2 rounded-lg type-label-sm transition-colors disabled:opacity-50 cursor-pointer"
        >
          {adding ? 'Adding...' : 'Add Highlight'}
        </button>
      </div>
    </div>
  );
}
