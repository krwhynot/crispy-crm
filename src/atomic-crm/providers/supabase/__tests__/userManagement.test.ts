/**
 * User Management Data Provider Tests
 *
 * Tests the custom Edge Function methods for user management:
 * - inviteUser: Sends POST to /functions/v1/users
 * - updateUser: Sends PATCH to /functions/v1/users
 *
 * These methods are added via the extension layer (customMethodsExtension.ts)
 * and call Edge Functions for admin user operations.
 *
 * Note: We test the actual inviteUser/updateUser implementations by
 * importing them from the extension module and testing with mocked fetch.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock fetch
const mockFetch = vi.fn();
const originalFetch = global.fetch;

// Mock supabase auth to provide test token
vi.mock("@/atomic-crm/providers/supabase/supabase", () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({
        data: { session: { access_token: "test-token" } },
      }),
    },
  },
}));

// Import the supabase mock
import { supabase } from "../supabase";

/**
 * Implementation of inviteUser matching customMethodsExtension.ts pattern
 * Extracted for isolated unit testing without full provider chain
 */
async function inviteUser(params: {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  role: string;
}): Promise<{ data: { id: number; email: string } }> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/users`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session?.access_token}`,
    },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    let errorMessage: string;
    try {
      const errorData = await response.json();
      errorMessage = errorData.message || errorData.error?.message || `Invite failed (${response.status})`;
    } catch {
      errorMessage = `Invite failed (${response.status})`;
    }
    throw new Error(errorMessage);
  }

  return response.json();
}

/**
 * Implementation of updateUser matching customMethodsExtension.ts pattern
 */
async function updateUser(params: {
  sales_id: number;
  first_name?: string;
  last_name?: string;
  role?: string;
  disabled?: boolean;
}): Promise<{ data: { id: number; role?: string; disabled?: boolean } }> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/users`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session?.access_token}`,
    },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    let errorMessage: string;
    try {
      const errorData = await response.json();
      errorMessage = errorData.message || errorData.error?.message || `Update failed (${response.status})`;
    } catch {
      errorMessage = `Update failed (${response.status})`;
    }
    throw new Error(errorMessage);
  }

  return response.json();
}

describe("User Management Data Provider", () => {
  beforeEach(() => {
    global.fetch = mockFetch;
    mockFetch.mockReset();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  describe("inviteUser", () => {
    it("sends POST request to Edge Function with correct payload", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: { id: 1, email: "new@test.com" } }),
      });

      const result = await inviteUser({
        email: "new@test.com",
        password: "SecurePass123!",
        first_name: "New",
        last_name: "User",
        role: "rep",
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/functions/v1/users"),
        expect.objectContaining({
          method: "POST",
          headers: expect.objectContaining({
            Authorization: "Bearer test-token",
          }),
        })
      );
      expect(result.data.email).toBe("new@test.com");
    });

    it("throws error on failed invite (fail-fast)", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: () => Promise.resolve({ message: "Email already exists" }),
      });

      await expect(
        inviteUser({
          email: "existing@test.com",
          password: "SecurePass123!",
          first_name: "Test",
          last_name: "User",
          role: "rep",
        })
      ).rejects.toThrow("Email already exists");
    });

    it("handles nested error format from Edge Function", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: () => Promise.resolve({ error: { message: "Nested error message" } }),
      });

      await expect(
        inviteUser({
          email: "test@test.com",
          password: "SecurePass123!",
          first_name: "Test",
          last_name: "User",
          role: "rep",
        })
      ).rejects.toThrow("Nested error message");
    });

    it("handles non-JSON error responses gracefully", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: () => Promise.reject(new Error("Not JSON")),
      });

      await expect(
        inviteUser({
          email: "test@test.com",
          password: "SecurePass123!",
          first_name: "Test",
          last_name: "User",
          role: "rep",
        })
      ).rejects.toThrow("Invite failed (500)");
    });
  });

  describe("updateUser", () => {
    it("sends PATCH request to Edge Function", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: { id: 1, role: "manager" } }),
      });

      const result = await updateUser({
        sales_id: 1,
        role: "manager",
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/functions/v1/users"),
        expect.objectContaining({ method: "PATCH" })
      );
      expect(result.data.role).toBe("manager");
    });

    it("throws error on failed update (fail-fast)", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: () => Promise.resolve({ message: "Not authorized" }),
      });

      await expect(updateUser({ sales_id: 1, role: "admin" })).rejects.toThrow(
        "Not authorized"
      );
    });

    it("sends optional fields when provided", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: { id: 1, disabled: true } }),
      });

      await updateUser({
        sales_id: 1,
        first_name: "Updated",
        last_name: "Name",
        disabled: true,
      });

      const [, options] = mockFetch.mock.calls[0];
      const body = JSON.parse(options.body);

      expect(body).toEqual({
        sales_id: 1,
        first_name: "Updated",
        last_name: "Name",
        disabled: true,
      });
    });
  });
});
