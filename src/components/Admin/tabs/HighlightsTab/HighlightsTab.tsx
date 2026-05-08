'use client';

import {useState, useEffect} from 'react';
import Image from 'next/image';
import type * as VMT from '@/domain';
import {api} from '@/routes';
import {Button} from '@/components/ui';

type HighlightsTabProps = {
  tourId: string | null;
  destinationId: string;
  initialSelectedIds: string[];
  destinations: Array<{id: string; name: string}>;
  onSave: (highlightIds: string[]) => Promise<void>;
};

export function HighlightsTab({
  tourId,
  destinationId,
  initialSelectedIds,
  destinations,
  onSave,
}: HighlightsTabProps) {
  const [allHighlights, setAllHighlights] = useState<VMT.Highlight[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    new Set(initialSelectedIds),
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [savedIds, setSavedIds] = useState<Set<string>>(
    new Set(initialSelectedIds),
  );

  const isDirty =
    selectedIds.size !== savedIds.size ||
    [...selectedIds].some((id) => !savedIds.has(id));

  useEffect(() => {
    if (!destinationId) {
      setAllHighlights([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    api.admin.highlights
      .list(destinationId)
      .then(({data, error}) => {
        if (!error && data) setAllHighlights(data);
        else if (error) setError('Failed to load highlights');
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to load highlights');
        setLoading(false);
      });
  }, [destinationId]);

  function toggleHighlight(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  async function handleSave() {
    setSaving(true);
    setError('');
    try {
      await onSave([...selectedIds]);
      setSavedIds(new Set(selectedIds));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  }

  const destName =
    destinations.find((d) => d.id === destinationId)?.name ?? 'None selected';

  return (
    <div className="max-w-3xl p-5">
      <h2 className="type-title-lg text-on-surface mb-4">Tour Highlights</h2>

      <div className="mb-4">
        <span className="type-label-sm text-on-surface-secondary">
          Destination:{' '}
        </span>
        <span className="type-body-sm text-on-surface font-medium">
          {destName}
        </span>
        <p className="type-label-sm text-on-surface-secondary mt-1">
          Change destination in the General tab. Manage highlights in the
          destination edit page.
        </p>
      </div>

      {!tourId && (
        <p className="type-body-sm text-amber-500">
          Save the General tab first to enable highlight selection.
        </p>
      )}

      {loading && (
        <p className="type-body-sm text-on-surface-secondary">
          Loading highlights...
        </p>
      )}

      {!loading && allHighlights.length === 0 && destinationId && (
        <p className="type-body-sm text-on-surface-secondary">
          No highlights found for this destination. Add them on the destination
          edit page.
        </p>
      )}

      {!loading && allHighlights.length > 0 && (
        <div className="space-y-2 mb-6">
          {allHighlights.map((h) => (
            <label
              key={h.id}
              htmlFor={`hl-${h.id}`}
              className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-surface-elevated transition-colors cursor-pointer"
            >
              <input
                id={`hl-${h.id}`}
                type="checkbox"
                checked={selectedIds.has(h.id)}
                onChange={() => toggleHighlight(h.id)}
                disabled={!tourId}
                className="w-4 h-4 rounded border-border text-primary focus:ring-primary cursor-pointer"
              />
              {h.imageUrl && (
                <Image
                  src={h.imageUrl}
                  alt={h.titleEn}
                  width={40}
                  height={40}
                  className="rounded object-cover w-10 h-10"
                />
              )}
              <div className="flex-1 min-w-0">
                <div className="type-body-sm text-on-surface">{h.titleEn}</div>
                <div className="type-label-sm text-on-surface-secondary">
                  {h.titleVi}
                </div>
              </div>
            </label>
          ))}
        </div>
      )}

      {error && <p className="type-label-sm text-red-400 mb-2">{error}</p>}

      {isDirty && (
        <p className="type-label-sm text-amber-500 mb-2">Unsaved changes</p>
      )}

      <Button
        type="button"
        onClick={handleSave}
        disabled={!isDirty || !tourId}
        loading={saving}
        size="lg"
      >
        Save Highlights
      </Button>
    </div>
  );
}
