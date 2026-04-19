import {renderHook, act} from '@testing-library/react';
import {useScrollDirection} from '@/hooks/useScrollDirection';

describe('useScrollDirection', () => {
  let scrollListeners: Array<(event?: Event) => void>;

  beforeEach(() => {
    scrollListeners = [];
    jest
      .spyOn(window, 'addEventListener')
      .mockImplementation((event, handler) => {
        if (event === 'scroll') {
          scrollListeners.push(handler as (event?: Event) => void);
        }
      });
    jest
      .spyOn(window, 'removeEventListener')
      .mockImplementation((event, handler) => {
        if (event === 'scroll') {
          scrollListeners = scrollListeners.filter((h) => h !== handler);
        }
      });
    Object.defineProperty(window, 'scrollY', {value: 0, writable: true});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  function fireScroll(y: number) {
    Object.defineProperty(window, 'scrollY', {value: y, writable: true});
    for (const listener of scrollListeners) {
      listener();
    }
  }

  it('starts with direction up and scrollY 0', () => {
    const {result} = renderHook(() => useScrollDirection());
    expect(result.current.scrollDirection).toBe('up');
    expect(result.current.scrollY).toBe(0);
  });

  it('sets direction to down when scrolling past threshold', () => {
    const {result} = renderHook(() => useScrollDirection());
    act(() => fireScroll(100));
    expect(result.current.scrollDirection).toBe('down');
    expect(result.current.scrollY).toBe(100);
  });

  it('sets direction to up when scrolling back', () => {
    const {result} = renderHook(() => useScrollDirection());
    act(() => fireScroll(200));
    act(() => fireScroll(50));
    expect(result.current.scrollDirection).toBe('up');
    expect(result.current.scrollY).toBe(50);
  });

  it('does not set down when below threshold (80px)', () => {
    const {result} = renderHook(() => useScrollDirection());
    act(() => fireScroll(50));
    expect(result.current.scrollDirection).toBe('up');
  });

  it('cleans up scroll listener on unmount', () => {
    const {unmount} = renderHook(() => useScrollDirection());
    expect(scrollListeners.length).toBe(1);
    unmount();
    expect(scrollListeners.length).toBe(0);
  });
});
