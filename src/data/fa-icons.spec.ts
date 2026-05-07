import {FA_ICONS} from './fa-icons';

describe('FA_ICONS', () => {
  it('contains a non-trivial number of icons', () => {
    expect(FA_ICONS.length).toBeGreaterThan(100);
  });

  it('has no duplicates after dedupe', () => {
    expect(new Set(FA_ICONS).size).toBe(FA_ICONS.length);
  });

  it('every entry starts with a fa- prefix style', () => {
    expect(FA_ICONS.every((c) => c.startsWith('fa-'))).toBe(true);
  });
});
