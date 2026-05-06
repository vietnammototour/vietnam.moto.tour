import {flushImageSlots} from './submit-with-images';

const mockFetch = jest.fn();
beforeEach(() => {
  mockFetch.mockReset();
  global.fetch = mockFetch as unknown as typeof fetch;
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});

it('no calls when all slots saved/empty', async () => {
  const result = await flushImageSlots({
    entityType: 'tour',
    entityId: 't1',
    slots: {card: {kind: 'saved', url: '/x'}},
  });
  expect(mockFetch).not.toHaveBeenCalled();
  expect(result.errors).toEqual({});
});

it('POSTs pending-replace blobs', async () => {
  mockFetch.mockResolvedValue({
    ok: true,
    json: async () => ({url: '/uploads/tours/t1/card.abcd1234.webp'}),
  });
  const result = await flushImageSlots({
    entityType: 'tour',
    entityId: 't1',
    slots: {
      card: {
        kind: 'pending-replace',
        blob: new Blob(['x']),
        previewUrl: 'blob:x',
        hash: 'abcd1234',
      },
    },
  });
  expect(mockFetch).toHaveBeenCalledWith(
    '/api/admin/upload',
    expect.objectContaining({method: 'POST'}),
  );
  expect(result.errors).toEqual({});
  expect(result.updated.card?.kind).toBe('saved');
});

it('DELETEs pending-delete', async () => {
  mockFetch.mockResolvedValue({
    ok: true,
    json: async () => ({success: true}),
  });
  await flushImageSlots({
    entityType: 'tour',
    entityId: 't1',
    slots: {card: {kind: 'pending-delete', previousUrl: '/uploads/x'}},
  });
  expect(mockFetch).toHaveBeenCalledWith(
    '/api/admin/upload',
    expect.objectContaining({method: 'DELETE'}),
  );
});

it('retries once on transient failure, returns slot error after second', async () => {
  mockFetch
    .mockResolvedValueOnce({ok: false, status: 500, json: async () => ({})})
    .mockResolvedValueOnce({ok: false, status: 500, json: async () => ({})});

  const promise = flushImageSlots({
    entityType: 'tour',
    entityId: 't1',
    slots: {
      card: {
        kind: 'pending-replace',
        blob: new Blob(['x']),
        previewUrl: 'blob:x',
        hash: 'abcd1234',
      },
    },
  });

  await jest.runAllTimersAsync();
  const r = await promise;

  expect(mockFetch).toHaveBeenCalledTimes(2);
  expect(r.errors.card).toMatch(/upload failed/i);
});

it('isolates per-slot failures', async () => {
  // card: attempt0 → fail, attempt1 → fail (uses mocks 1 and 3 after hero takes mock 2)
  // hero: attempt0 → succeed (uses mock 2)
  // Parallel execution order: card attempt0, hero attempt0 (interleaved due to async),
  // then after 1s sleep card attempt1.
  // To guarantee card fails twice and hero succeeds once regardless of parallel ordering,
  // we mock card's slot to always fail and hero to always succeed using mockImplementation.
  mockFetch.mockImplementation((_url: string, init?: RequestInit) => {
    const body = init?.body;
    // Distinguish by FormData imageType field or JSON body
    if (body instanceof FormData) {
      const imageType = body.get('imageType');
      if (imageType === 'card') {
        return Promise.resolve({
          ok: false,
          status: 500,
          json: async () => ({}),
        });
      }
      // hero
      return Promise.resolve({
        ok: true,
        json: async () => ({
          url: '/uploads/destinations/d1/hero.aaaa1111.webp',
        }),
      });
    }
    return Promise.resolve({ok: false, status: 500, json: async () => ({})});
  });

  const promise = flushImageSlots({
    entityType: 'destination',
    entityId: 'd1',
    slots: {
      card: {
        kind: 'pending-replace',
        blob: new Blob(['a']),
        previewUrl: 'blob:a',
        hash: 'aaaaaaaa',
      },
      hero: {
        kind: 'pending-replace',
        blob: new Blob(['b']),
        previewUrl: 'blob:b',
        hash: 'bbbbbbbb',
      },
    },
  });

  await jest.runAllTimersAsync();
  const r = await promise;

  expect(r.errors.card).toBeDefined();
  expect(r.errors.hero).toBeUndefined();
  expect(r.updated.hero?.kind).toBe('saved');
});
