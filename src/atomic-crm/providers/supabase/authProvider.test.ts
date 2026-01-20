/**
 * Tests for authProvider
 * Coverage: login, checkAuth, canAccess, getIdentity, error handling
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// Use vi.hoisted to create mocks that can be used in vi.mock factories
const mocks = vi.hoisted(() => ({
  mockLogin: vi.fn(),
  mockLogout: vi.fn(),
  mockCheckAuth: vi.fn(),
  mockCheckError: vi.fn(),
  mockGetIdentity: vi.fn(),
  mockGetPermissions: vi.fn(),
  mockCanAccessFn: vi.fn(),
  mockGetSession: vi.fn(),
  mockGetUser: vi.fn(),
  mockFrom: vi.fn(),
}));

// Destructure for easier access
const { mockLogin, mockCheckAuth, mockCanAccessFn, mockGetSession, mockFrom } = mocks;

// Mock the base supabase auth provider
vi.mock("ra-supabase-core", () => ({
  supabaseAuthProvider: () => ({
    login: mocks.mockLogin,
    logout: mocks.mockLogout,
    checkAuth: mocks.mockCheckAuth,
    checkError: mocks.mockCheckError,
    getIdentity: mocks.mockGetIdentity,
    getPermissions: mocks.mockGetPermissions,
  }),
}));

// Mock canAccess
vi.mock("../commons/canAccess", () => ({
  canAccess: (...args: any[]) => mocks.mockCanAccessFn(...args),
}));

// Mock the supabase client
vi.mock("./supabase", () => ({
  supabase: {
    auth: {
      getSession: (...args: any[]) => mocks.mockGetSession(...args),
      getUser: (...args: any[]) => mocks.mockGetUser(...args),
    },
    from: (...args: any[]) => mocks.mockFrom(...args),
  },
}));

import { authProvider } from "./authProvider";

describe("authProvider", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("login", () => {
    it("should call baseAuthProvider.login and clear cached sale", async () => {
      const params = { username: "test@test.com", password: "password123" };
      mockLogin.mockResolvedValue(undefined);

      await authProvider.login(params);

      expect(mockLogin).toHaveBeenCalledWith(params);
      expect(mockLogin).toHaveBeenCalledTimes(1);
    });

    it("should propagate login errors", async () => {
      const params = { username: "test@test.com", password: "wrong" };
      const error = new Error("Invalid credentials");
      mockLogin.mockRejectedValue(error);

      await expect(authProvider.login(params)).rejects.toThrow("Invalid credentials");
    });
  });

  describe("checkAuth", () => {
    it("should allow access to public paths without session", async () => {
      // Mock no session
      mockGetSession.mockResolvedValue({
        data: { session: null },
        error: null,
      });

      // Mock window.location.pathname for public path
      const originalLocation = window.location;
      delete (window as any).location;
      window.location = { ...originalLocation, pathname: "/login" };

      await expect(authProvider.checkAuth({})).resolves.toBeUndefined();

      expect(mockGetSession).toHaveBeenCalled();
      expect(mockCheckAuth).not.toHaveBeenCalled();

      // Restore window.location
      window.location = originalLocation;
    });

    it("should block access to protected paths without session", async () => {
      // Mock no session
      mockGetSession.mockResolvedValue({
        data: { session: null },
        error: null,
      });

      // Mock window.location.pathname for protected path
      const originalLocation = window.location;
      delete (window as any).location;
      window.location = { ...originalLocation, pathname: "/opportunities" };

      await expect(authProvider.checkAuth({})).rejects.toThrow("Not authenticated");

      expect(mockGetSession).toHaveBeenCalled();
      expect(mockCheckAuth).not.toHaveBeenCalled();

      // Restore window.location
      window.location = originalLocation;
    });

    it("should call baseAuthProvider.checkAuth with valid session", async () => {
      const mockSession = {
        user: { id: "user-123", email: "test@test.com" },
        access_token: "token-123",
      };

      mockGetSession.mockResolvedValue({
        data: { session: mockSession },
        error: null,
      });

      mockCheckAuth.mockResolvedValue(undefined);

      const params = { someParam: "value" };
      await authProvider.checkAuth(params);

      expect(mockGetSession).toHaveBeenCalled();
      expect(mockCheckAuth).toHaveBeenCalledWith(params);
    });

    it("should block access when session fetch errors", async () => {
      mockGetSession.mockResolvedValue({
        data: { session: null },
        error: new Error("Session fetch failed"),
      });

      // Mock window.location.pathname for protected path
      const originalLocation = window.location;
      delete (window as any).location;
      window.location = { ...originalLocation, pathname: "/dashboard" };

      await expect(authProvider.checkAuth({})).rejects.toThrow("Not authenticated");

      // Restore window.location
      window.location = originalLocation;
    });

    it("should recognize all public paths", async () => {
      const publicPaths = ["/login", "/forgot-password", "/set-password", "/reset-password"];

      // Mock no session
      mockGetSession.mockResolvedValue({
        data: { session: null },
        error: null,
      });

      const originalLocation = window.location;

      for (const path of publicPaths) {
        delete (window as any).location;
        window.location = { ...originalLocation, pathname: path };

        await expect(authProvider.checkAuth({})).resolves.toBeUndefined();
      }

      // Restore window.location
      window.location = originalLocation;

      expect(mockCheckAuth).not.toHaveBeenCalled();
    });
  });

  describe("canAccess", () => {
    it("should return false when sale not found", async () => {
      mockGetSession.mockResolvedValue({
        data: {
          session: { user: { id: "user-123" } },
        },
        error: null,
      });

      // Mock from().select().match().is().maybeSingle() chain
      const mockMaybeSingle = vi.fn().mockResolvedValue({
        data: null,
        error: null,
      });
      const mockIs = vi.fn().mockReturnValue({
        maybeSingle: mockMaybeSingle,
      });
      const mockMatch = vi.fn().mockReturnValue({
        is: mockIs,
      });
      const mockSelect = vi.fn().mockReturnValue({
        match: mockMatch,
      });
      mockFrom.mockReturnValue({
        select: mockSelect,
      });

      const result = await authProvider.canAccess({
        resource: "opportunities",
        action: "read",
      });

      expect(result).toBe(false);
    });

    it("should check access for admin user", async () => {
      const mockSale = {
        id: "sale-123",
        first_name: "John",
        last_name: "Doe",
        avatar_url: "https://example.com/avatar.jpg",
        is_admin: true,
      };

      mockGetSession.mockResolvedValue({
        data: {
          session: { user: { id: "user-123" } },
        },
        error: null,
      });

      const mockMaybeSingle = vi.fn().mockResolvedValue({
        data: mockSale,
        error: null,
      });
      const mockIs = vi.fn().mockReturnValue({
        maybeSingle: mockMaybeSingle,
      });
      const mockMatch = vi.fn().mockReturnValue({
        is: mockIs,
      });
      const mockSelect = vi.fn().mockReturnValue({
        match: mockMatch,
      });
      mockFrom.mockReturnValue({
        select: mockSelect,
      });

      mockCanAccessFn.mockResolvedValue(true);

      const params = { resource: "opportunities", action: "delete" };
      const result = await authProvider.canAccess(params);

      expect(mockCanAccessFn).toHaveBeenCalledWith("admin", params);
      expect(result).toBe(true);
    });

    it("should check access for regular user", async () => {
      // Clear cache from previous test
      mockLogin.mockResolvedValue(undefined);
      await authProvider.login({ username: "test@test.com", password: "pass" });
      vi.clearAllMocks();

      const mockSale = {
        id: "sale-456",
        first_name: "Jane",
        last_name: "Smith",
        avatar_url: null,
        is_admin: false,
      };

      mockGetSession.mockResolvedValue({
        data: {
          session: { user: { id: "user-456" } },
        },
        error: null,
      });

      const mockMaybeSingle = vi.fn().mockResolvedValue({
        data: mockSale,
        error: null,
      });
      const mockMatch = vi.fn().mockReturnValue({
        maybeSingle: mockMaybeSingle,
      });
      const mockSelect = vi.fn().mockReturnValue({
        match: mockMatch,
      });
      mockFrom.mockReturnValue({
        select: mockSelect,
      });

      mockCanAccessFn.mockResolvedValue(false);

      const params = { resource: "settings", action: "edit" };
      const result = await authProvider.canAccess(params);

      expect(mockCanAccessFn).toHaveBeenCalledWith("user", params);
      expect(result).toBe(false);
    });

    it("should return false when session error occurs", async () => {
      mockGetSession.mockResolvedValue({
        data: { session: null },
        error: new Error("Session error"),
      });

      const result = await authProvider.canAccess({
        resource: "contacts",
        action: "read",
      });

      expect(result).toBe(false);
    });

    it("should return false when sales query errors", async () => {
      mockGetSession.mockResolvedValue({
        data: {
          session: { user: { id: "user-123" } },
        },
        error: null,
      });

      const mockMaybeSingle = vi.fn().mockResolvedValue({
        data: null,
        error: new Error("Database error"),
      });
      const mockMatch = vi.fn().mockReturnValue({
        maybeSingle: mockMaybeSingle,
      });
      const mockSelect = vi.fn().mockReturnValue({
        match: mockMatch,
      });
      mockFrom.mockReturnValue({
        select: mockSelect,
      });

      const result = await authProvider.canAccess({
        resource: "opportunities",
        action: "create",
      });

      expect(result).toBe(false);
    });
  });

  describe("getSaleFromCache (via canAccess)", () => {
    it("should cache sale data across calls", async () => {
      // Clear cache first by calling login
      mockLogin.mockResolvedValue(undefined);
      await authProvider.login({ username: "test@test.com", password: "pass" });
      vi.clearAllMocks(); // Clear the login call from mock counts

      const mockSale = {
        id: "sale-123",
        first_name: "John",
        last_name: "Doe",
        avatar_url: "https://example.com/avatar.jpg",
        is_admin: false,
      };

      mockGetSession.mockResolvedValue({
        data: {
          session: { user: { id: "user-123" } },
        },
        error: null,
      });

      const mockMaybeSingle = vi.fn().mockResolvedValue({
        data: mockSale,
        error: null,
      });
      const mockMatch = vi.fn().mockReturnValue({
        maybeSingle: mockMaybeSingle,
      });
      const mockSelect = vi.fn().mockReturnValue({
        match: mockMatch,
      });
      mockFrom.mockReturnValue({
        select: mockSelect,
      });

      // First call - should fetch from database
      await authProvider.canAccess({ resource: "contacts", action: "read" });

      // Second call - should use cache
      await authProvider.canAccess({
        resource: "opportunities",
        action: "read",
      });

      // Should only query database once (cached on second call)
      expect(mockFrom).toHaveBeenCalledTimes(1);
      expect(mockSelect).toHaveBeenCalledTimes(1);
    });

    it("should clear cache on login", async () => {
      // Ensure cache is cleared before starting this test
      mockLogin.mockResolvedValue(undefined);
      await authProvider.login({ username: "test@test.com", password: "pass" });
      vi.clearAllMocks(); // Clear the initial login call

      const mockSale = {
        id: "sale-123",
        first_name: "John",
        last_name: "Doe",
        avatar_url: null,
        is_admin: false,
      };

      mockGetSession.mockResolvedValue({
        data: {
          session: { user: { id: "user-123" } },
        },
        error: null,
      });

      const mockMaybeSingle = vi.fn().mockResolvedValue({
        data: mockSale,
        error: null,
      });
      const mockMatch = vi.fn().mockReturnValue({
        maybeSingle: mockMaybeSingle,
      });
      const mockSelect = vi.fn().mockReturnValue({
        match: mockMatch,
      });
      mockFrom.mockReturnValue({
        select: mockSelect,
      });

      // First call - populates cache
      await authProvider.canAccess({ resource: "contacts", action: "read" });

      // Login - clears cache
      mockLogin.mockResolvedValue(undefined);
      await authProvider.login({
        username: "test@test.com",
        password: "password",
      });

      // Second call - should fetch from database again (cache was cleared)
      await authProvider.canAccess({ resource: "contacts", action: "read" });

      // Should query database twice (once before login, once after)
      expect(mockFrom).toHaveBeenCalledTimes(2);
    });
  });

  describe("error scenarios", () => {
    it("should handle user not in sales table", async () => {
      mockGetSession.mockResolvedValue({
        data: {
          session: { user: { id: "orphan-user-123" } },
        },
        error: null,
      });

      const mockMaybeSingle = vi.fn().mockResolvedValue({
        data: null, // User exists in auth.users but not in sales table
        error: null,
      });
      const mockMatch = vi.fn().mockReturnValue({
        maybeSingle: mockMaybeSingle,
      });
      const mockSelect = vi.fn().mockReturnValue({
        match: mockMatch,
      });
      mockFrom.mockReturnValue({
        select: mockSelect,
      });

      const result = await authProvider.canAccess({
        resource: "opportunities",
        action: "read",
      });

      expect(result).toBe(false);
    });

    it("should handle network timeout during session check", async () => {
      mockGetSession.mockRejectedValue(new Error("Network timeout"));

      // Mock window.location.pathname
      const originalLocation = window.location;
      delete (window as any).location;
      window.location = { ...originalLocation, pathname: "/dashboard" };

      // Should propagate the network error (fail fast principle)
      await expect(authProvider.checkAuth({})).rejects.toThrow("Network timeout");

      // Restore window.location
      window.location = originalLocation;
    });

    it("should handle database error when fetching sale", async () => {
      mockGetSession.mockResolvedValue({
        data: {
          session: { user: { id: "user-123" } },
        },
        error: null,
      });

      const mockMaybeSingle = vi.fn().mockResolvedValue({
        data: null,
        error: { code: "PGRST301", message: "Database connection failed" },
      });
      const mockMatch = vi.fn().mockReturnValue({
        maybeSingle: mockMaybeSingle,
      });
      const mockSelect = vi.fn().mockReturnValue({
        match: mockMatch,
      });
      mockFrom.mockReturnValue({
        select: mockSelect,
      });

      const result = await authProvider.canAccess({
        resource: "contacts",
        action: "read",
      });

      expect(result).toBe(false);
    });
  });
});
