import {tourKeys} from './tours.keys';

describe('tourKeys', () => {
  it('all key is stable', () => {
    expect(tourKeys.all).toEqual(['admin', 'tours']);
  });

  it('lists key extends all', () => {
    expect(tourKeys.lists()).toEqual(['admin', 'tours', 'list']);
  });

  it('list key includes filters object', () => {
    expect(tourKeys.list({archived: false})).toEqual([
      'admin',
      'tours',
      'list',
      {archived: false},
    ]);
  });

  it('list key with empty filters', () => {
    expect(tourKeys.list({})).toEqual(['admin', 'tours', 'list', {}]);
  });

  it('details key extends all', () => {
    expect(tourKeys.details()).toEqual(['admin', 'tours', 'detail']);
  });

  it('detail key includes id', () => {
    expect(tourKeys.detail('abc')).toEqual(['admin', 'tours', 'detail', 'abc']);
  });

  it('list and detail keys share all prefix (invalidation contract)', () => {
    const all = tourKeys.all;
    expect(tourKeys.lists().slice(0, all.length)).toEqual(all);
    expect(tourKeys.detail('abc').slice(0, all.length)).toEqual(all);
  });
});
