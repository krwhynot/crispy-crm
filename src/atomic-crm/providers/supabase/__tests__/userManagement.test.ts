import { describe, it, expect, vi, beforeEach } from 'vitest';
import { unifiedDataProvider } from '../unifiedDataProvider';

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock supabase auth
vi.mock('@/atomic-crm/providers/supabase/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({
        data: { session: { access_token: 'test-token' } },
      }),
    },
  },
}));

describe('User Management Data Provider', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  describe('inviteUser', () => {
    it('sends POST request to Edge Function with correct payload', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: { id: 1, email: 'new@test.com' } }),
      });

      const result = await unifiedDataProvider.inviteUser({
        email: 'new@test.com',
        password: 'SecurePass123!',
        first_name: 'New',
        last_name: 'User',
        role: 'rep',
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/functions/v1/users'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-token',
          }),
        })
      );
      expect(result.data.email).toBe('new@test.com');
    });

    it('throws error on failed invite (fail-fast)', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: () => Promise.resolve({ message: 'Email already exists' }),
      });

      await expect(
        unifiedDataProvider.inviteUser({
          email: 'existing@test.com',
          password: 'SecurePass123!',
          first_name: 'Test',
          last_name: 'User',
          role: 'rep',
        })
      ).rejects.toThrow('Email already exists');
    });

    it('handles nested error format from Edge Function', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: () => Promise.resolve({ error: { message: 'Nested error message' } }),
      });

      await expect(
        unifiedDataProvider.inviteUser({
          email: 'test@test.com',
          password: 'SecurePass123!',
          first_name: 'Test',
          last_name: 'User',
          role: 'rep',
        })
      ).rejects.toThrow('Nested error message');
    });

    it('handles non-JSON error responses gracefully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: () => Promise.reject(new Error('Not JSON')),
      });

      await expect(
        unifiedDataProvider.inviteUser({
          email: 'test@test.com',
          password: 'SecurePass123!',
          first_name: 'Test',
          last_name: 'User',
          role: 'rep',
        })
      ).rejects.toThrow('Invite failed (500)');
    });
  });

  describe('updateUser', () => {
    it('sends PATCH request to Edge Function', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: { id: 1, role: 'manager' } }),
      });

      const result = await unifiedDataProvider.updateUser({
        sales_id: 1,
        role: 'manager',
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/functions/v1/users'),
        expect.objectContaining({ method: 'PATCH' })
      );
      expect(result.data.role).toBe('manager');
    });

    it('throws error on failed update (fail-fast)', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: () => Promise.resolve({ message: 'Not authorized' }),
      });

      await expect(
        unifiedDataProvider.updateUser({ sales_id: 1, role: 'admin' })
      ).rejects.toThrow('Not authorized');
    });

    it('sends optional fields when provided', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: { id: 1, disabled: true } }),
      });

      await unifiedDataProvider.updateUser({
        sales_id: 1,
        first_name: 'Updated',
        last_name: 'Name',
        disabled: true,
      });

      const [, options] = mockFetch.mock.calls[0];
      const body = JSON.parse(options.body);

      expect(body).toEqual({
        sales_id: 1,
        first_name: 'Updated',
        last_name: 'Name',
        disabled: true,
      });
    });
  });
});
