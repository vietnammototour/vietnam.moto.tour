import {http, ApiError} from './http';

describe('http', () => {
  const originalFetch = global.fetch;
  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('returns parsed JSON on 200', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({foo: 'bar'}),
    } as unknown as Response);
    const result = await http<{foo: string}>('/api/x');
    expect(result).toEqual({foo: 'bar'});
  });

  it('returns undefined on 204', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 204,
      json: async () => {
        throw new Error('no body');
      },
    } as unknown as Response);
    const result = await http<void>('/api/x', {method: 'DELETE'});
    expect(result).toBeUndefined();
  });

  it('throws ApiError with body.error message on non-ok', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 422,
      statusText: 'Unprocessable Entity',
      json: async () => ({error: 'slug taken'}),
    } as unknown as Response);
    await expect(http('/api/x')).rejects.toMatchObject({
      message: 'slug taken',
      status: 422,
    });
    await expect(http('/api/x')).rejects.toBeInstanceOf(ApiError);
  });

  it('falls back to statusText when body has no error field', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Server Error',
      json: async () => ({}),
    } as unknown as Response);
    await expect(http('/api/x')).rejects.toMatchObject({
      message: 'Server Error',
      status: 500,
    });
  });

  it('falls back to statusText when body is not JSON', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Server Error',
      json: async () => {
        throw new Error('invalid json');
      },
    } as unknown as Response);
    await expect(http('/api/x')).rejects.toMatchObject({
      message: 'Server Error',
      status: 500,
    });
  });

  it('merges JSON content-type header with init', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({}),
    } as unknown as Response);
    global.fetch = fetchMock;
    await http('/api/x', {method: 'POST', body: '{}'});
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/x',
      expect.objectContaining({
        method: 'POST',
        body: '{}',
        headers: expect.objectContaining({'Content-Type': 'application/json'}),
      }),
    );
  });
});
