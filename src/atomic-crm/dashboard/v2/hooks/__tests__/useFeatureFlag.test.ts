import { renderHook } from '@testing-library/react';
import { useFeatureFlag } from '../useFeatureFlag';

describe('useFeatureFlag', () => {
  it('should return false when window is undefined (SSR)', () => {
    // Mock SSR environment
    const originalWindow = global.window;
    // @ts-ignore
    delete global.window;

    const { result } = renderHook(() => useFeatureFlag());

    expect(result.current).toBe(false);

    // Restore
    global.window = originalWindow;
  });

  it('should return true when layout=v2 in query string', () => {
    // Mock window.location
    delete (window as any).location;
    window.location = { search: '?layout=v2' } as any;

    const { result } = renderHook(() => useFeatureFlag());

    expect(result.current).toBe(true);
  });

  it('should return false when layout is not v2', () => {
    delete (window as any).location;
    window.location = { search: '' } as any;

    const { result } = renderHook(() => useFeatureFlag());

    expect(result.current).toBe(false);
  });
});
