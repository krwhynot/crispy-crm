import { renderHook, act } from '@testing-library/react';
import { PrincipalProvider, usePrincipalContext } from '../PrincipalContext';
import { useStore } from 'react-admin';

// Mock useStore
vi.mock('react-admin', () => ({
  useStore: vi.fn(),
}));

describe('PrincipalContext', () => {
  it('should persist selected principal to localStorage', () => {
    const mockSetStore = vi.fn();
    const mockStoreValue = null;

    (useStore as any).mockReturnValue([mockStoreValue, mockSetStore]);

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <PrincipalProvider>{children}</PrincipalProvider>
    );

    const { result } = renderHook(() => usePrincipalContext(), { wrapper });

    // Initially null
    expect(result.current.selectedPrincipalId).toBe(null);

    // Set principal ID
    act(() => {
      result.current.setSelectedPrincipal(123);
    });

    // Verify setStore was called with just the value (useStore handles the key internally)
    expect(mockSetStore).toHaveBeenCalledWith(123);
  });

  it('should restore principal from localStorage on mount', () => {
    const mockSetStore = vi.fn();
    const storedPrincipalId = 456;

    (useStore as any).mockReturnValue([storedPrincipalId, mockSetStore]);

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <PrincipalProvider>{children}</PrincipalProvider>
    );

    const { result } = renderHook(() => usePrincipalContext(), { wrapper });

    // Should restore from store
    expect(result.current.selectedPrincipalId).toBe(456);
  });
});
