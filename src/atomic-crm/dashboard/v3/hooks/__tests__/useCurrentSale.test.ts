import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useCurrentSale } from '../useCurrentSale';

// Mock Supabase
const mockSupabase = {
  auth: {
    getUser: vi.fn(),
  },
  from: vi.fn(),
};

vi.mock('@/atomic-crm/providers/supabase/supabase', () => ({
  supabase: mockSupabase,
}));

describe('useCurrentSale', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch sales ID using user.id only', async () => {
    const mockUser = { id: 'user-uuid-123', email: 'test@example.com' };
    const mockSale = { id: 42, user_id: 'user-uuid-123', email: 'test@example.com' };

    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });

    mockSupabase.from.mockReturnValue({
      select: vi.fn().mockReturnValue({
        or: vi.fn().mockReturnValue({
          maybeSingle: vi.fn().mockResolvedValue({ data: mockSale, error: null }),
        }),
      }),
    });

    const { result } = renderHook(() => useCurrentSale());

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.salesId).toBe(42);
    });

    // Verify it used user.id, not identity.id
    expect(mockSupabase.from).toHaveBeenCalledWith('sales');
  });

  it('should handle legacy users with NULL user_id by matching email', async () => {
    const mockUser = { id: 'user-uuid-123', email: 'legacy@example.com' };
    const mockSale = { id: 99, user_id: null, email: 'legacy@example.com' };

    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });

    mockSupabase.from.mockReturnValue({
      select: vi.fn().mockReturnValue({
        or: vi.fn().mockReturnValue({
          maybeSingle: vi.fn().mockResolvedValue({ data: mockSale, error: null }),
        }),
      }),
    });

    const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const { result } = renderHook(() => useCurrentSale());

    await waitFor(() => {
      expect(result.current.salesId).toBe(99);
    });

    // Should warn about NULL user_id
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      expect.stringContaining('matched by email but has NULL user_id')
    );

    consoleWarnSpy.mockRestore();
  });

  it('should handle errors gracefully', async () => {
    const mockError = new Error('Auth failed');

    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: mockError,
    });

    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const { result } = renderHook(() => useCurrentSale());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeTruthy();
    });

    consoleErrorSpy.mockRestore();
  });
});
