import * as f from './tours';

describe('admin tours fetchers', () => {
  const originalFetch = global.fetch;
  let fetchMock: jest.Mock;

  beforeEach(() => {
    fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => [],
    } as unknown as Response);
    global.fetch = fetchMock;
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('fetchTours with no filters omits query string', async () => {
    await f.fetchTours();
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/admin/tours',
      expect.any(Object),
    );
  });

  it('fetchTours with archived=false adds query string', async () => {
    await f.fetchTours({archived: false});
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/admin/tours?archived=false',
      expect.any(Object),
    );
  });

  it('fetchTours with archived=true adds query string', async () => {
    await f.fetchTours({archived: true});
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/admin/tours?archived=true',
      expect.any(Object),
    );
  });

  it('fetchTour requests by id', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({id: 'abc'}),
    } as unknown as Response);
    const tour = await f.fetchTour('abc');
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/admin/tours/abc',
      expect.any(Object),
    );
    expect(tour).toEqual({id: 'abc'});
  });

  it('createTour POSTs JSON body', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 201,
      json: async () => ({id: 'new'}),
    } as unknown as Response);
    await f.createTour({title: 'X'});
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/admin/tours',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({title: 'X'}),
      }),
    );
  });

  it('updateTour PUTs JSON body to id endpoint', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({id: 'abc'}),
    } as unknown as Response);
    await f.updateTour('abc', {status: 'PUBLISHED'});
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/admin/tours/abc',
      expect.objectContaining({
        method: 'PUT',
        body: JSON.stringify({status: 'PUBLISHED'}),
      }),
    );
  });

  it('deleteTour DELETEs without query when soft', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 204,
      json: async () => {
        throw new Error('no body');
      },
    } as unknown as Response);
    await f.deleteTour('abc');
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/admin/tours/abc',
      expect.objectContaining({method: 'DELETE'}),
    );
  });

  it('deleteTour DELETEs with hard=true query string when hard', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 204,
      json: async () => {
        throw new Error('no body');
      },
    } as unknown as Response);
    await f.deleteTour('abc', {hard: true});
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/admin/tours/abc?hard=true',
      expect.objectContaining({method: 'DELETE'}),
    );
  });
});
