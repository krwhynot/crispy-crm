/**
 * Tests for authProvider
 * Coverage: login, checkAuth, canAccess, getIdentity, error handling
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { authProvider } from "./authProvider";

// Mock the base supabase auth provider
const mockBaseAuthProvider = {
  login: vi.fn(),
  logout: vi.fn(),
  checkAuth: vi.fn(),
  checkError: vi.fn(),
  getIdentity: vi.fn(),
  getPermissions: vi.fn(),
};

vi.mock("ra-supabase-core", () => ({
  supabaseAuthProvider: () => mockBaseAuthProvider,
}));

// Mock canAccess
const mockCanAccess = vi.fn();
vi.mock("../commons/canAccess", () => ({
  canAccess: (...args: any[]) => mockCanAccess(...args),
}));

// Mock the supabase client
const mockSupabase = {
  auth: {
    getSession: vi.fn(),
    getUser: vi.fn(),
  },
  from: vi.fn(),
};

vi.mock("./supabase", () => ({
  supabase: mockSupabase,
}));

describe("authProvider", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset module-level cached sale
    vi.resetModules();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("login", () => {
    it("should call baseAuthProvider.login and clear cached sale", async () => {
      const params = { username: "test@test.com", password: "password123" };
      mockBaseAuthProvider.login.mockResolvedValue(undefined);

      await authProvider.login(params);

      expect(mockBaseAuthProvider.login).toHaveBeenCalledWith(params);
      expect(mockBaseAuthProvider.login).toHaveBeenCalledTimes(1);
    });

    it("should propagate login errors", async () => {
      const params = { username: "test@test.com", password: "wrong" };
      const error = new Error("Invalid credentials");
      mockBaseAuthProvider.login.mockRejectedValue(error);

      await expect(authProvider.login(params)).rejects.toThrow(
        "Invalid credentials"
      );
    });
  });

  describe("checkAuth", () => {
    it("should allow access to public paths without session", async () => {
      // Mock no session
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: null,
      });

      // Mock window.location.pathname for public path
      const originalLocation = window.location;
      delete (window as any).location;
      window.location = { ...originalLocation, pathname: "/login" };

      await expect(authProvider.checkAuth({})).resolves.toBeUndefined();

      expect(mockSupabase.auth.getSession).toHaveBeenCalled();
      expect(mockBaseAuthProvider.checkAuth).not.toHaveBeenCalled();

      // Restore window.location
      window.location = originalLocation;
    });

    it("should block access to protected paths without session", async () => {
      // Mock no session
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: null,
      });

      // Mock window.location.pathname for protected path
      const originalLocation = window.location;
      delete (window as any).location;
      window.location = { ...originalLocation, pathname: "/opportunities" };

      await expect(authProvider.checkAuth({})).rejects.toThrow(
        "Not authenticated"
      );

      expect(mockSupabase.auth.getSession).toHaveBeenCalled();
      expect(mockBaseAuthProvider.checkAuth).not.toHaveBeenCalled();

      // Restore window.location
      window.location = originalLocation;
    });

    it("should call baseAuthProvider.checkAuth with valid session", async () => {
      const mockSession = {
        user: { id: "user-123", email: "test@test.com" },
        access_token: "token-123",
      };

      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null,
      });

      mockBaseAuthProvider.checkAuth.mockResolvedValue(undefined);

      const params = { someParam: "value" };
      await authProvider.checkAuth(params);

      expect(mockSupabase.auth.getSession).toHaveBeenCalled();
      expect(mockBaseAuthProvider.checkAuth).toHaveBeenCalledWith(params);
    });

    it("should block access when session fetch errors", async () => {
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: new Error("Session fetch failed"),
      });

      // Mock window.location.pathname for protected path
      const originalLocation = window.location;
      delete (window as any).location;
      window.location = { ...originalLocation, pathname: "/dashboard" };

      await expect(authProvider.checkAuth({})).rejects.toThrow(
        "Not authenticated"
      );

      // Restore window.location
      window.location = originalLocation;
    });

    it("should recognize all public paths", async () => {
      const publicPaths = [
        "/login",
        "/forgot-password",
        "/set-password",
        "/reset-password",
      ];

      // Mock no session
      mockSupabase.auth.getSession.mockResolvedValue({
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

      expect(mockBaseAuthProvider.checkAuth).not.toHaveBeenCalled();
    });
  });

  describe("canAccess", () => {
    it("should return false when sale not found", async () => {
      mockSupabase.auth.getSession.mockResolvedValue({
        data: {
          session: { user: { id: "user-123" } },
        },
        error: null,
      });

      // Mock from().select().match().maybeSingle() chain
      const mockMaybeSingle = vi.fn().mockResolvedValue({
        data: null,
        error: null,
      });
      const mockMatch = vi.fn().mockReturnValue({
        maybeSingle: mockMaybeSingle,
      });
      const mockSelect = vi.fn().mockReturnValue({
        match: mockMatch,
      });
      mockSupabase.from.mockReturnValue({
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

      mockSupabase.auth.getSession.mockResolvedValue({
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
      mockSupabase.from.mockReturnValue({
        select: mockSelect,
      });

      mockCanAccess.mockResolvedValue(true);

      const params = { resource: "opportunities", action: "delete" };
      const result = await authProvider.canAccess(params);

      expect(mockCanAccess).toHaveBeenCalledWith("admin", params);
      expect(result).toBe(true);
    });

    it("should check access for regular user", async () => {
      const mockSale = {
        id: "sale-456",
        first_name: "Jane",
        last_name: "Smith",
        avatar_url: null,
        is_admin: false,
      };

      mockSupabase.auth.getSession.mockResolvedValue({
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
      mockSupabase.from.mockReturnValue({
        select: mockSelect,
      });

      mockCanAccess.mockResolvedValue(false);

      const params = { resource: "settings", action: "edit" };
      const result = await authProvider.canAccess(params);

      expect(mockCanAccess).toHaveBeenCalledWith("user", params);
      expect(result).toBe(false);
    });

    it("should return false when session error occurs", async () => {
      mockSupabase.auth.getSession.mockResolvedValue({
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
      mockSupabase.auth.getSession.mockResolvedValue({
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
      mockSupabase.from.mockReturnValue({
        select: mockSelect,
      });

      const result = await authProvider.canAccess({
        resource: "opportunities",
        action: "create",
      });

      expect(result).toBe(false);
    });
  });

  describe("getSaleFromCache (via getIdentity)", () => {
    it("should cache sale data across calls", async () => {
      const mockSale = {
        id: "sale-123",
        first_name: "John",
        last_name: "Doe",
        avatar_url: "https://example.com/avatar.jpg",
        is_admin: false,
      };

      mockSupabase.auth.getSession.mockResolvedValue({
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
      mockSupabase.from.mockReturnValue({
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
      expect(mockSupabase.from).toHaveBeenCalledTimes(1);
      expect(mockSelect).toHaveBeenCalledTimes(1);
    });

    it("should clear cache on login", async () => {
      const mockSale = {
        id: "sale-123",
        first_name: "John",
        last_name: "Doe",
        avatar_url: null,
        is_admin: false,
      };

      mockSupabase.auth.getSession.mockResolvedValue({
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
      mockSupabase.from.mockReturnValue({
        select: mockSelect,
      });

      // First call - populates cache
      await authProvider.canAccess({ resource: "contacts", action: "read" });

      // Login - clears cache
      mockBaseAuthProvider.login.mockResolvedValue(undefined);
      await authProvider.login({
        username: "test@test.com",
        password: "password",
      });

      // Second call - should fetch from database again (cache was cleared)
      await authProvider.canAccess({ resource: "contacts", action: "read" });

      // Should query database twice (once before login, once after)
      expect(mockSupabase.from).toHaveBeenCalledTimes(2);
    });
  });

  describe("error scenarios", () => {
    it("should handle user not in sales table", async () => {
      mockSupabase.auth.getSession.mockResolvedValue({
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
      mockSupabase.from.mockReturnValue({
        select: mockSelect,
      });

      const result = await authProvider.canAccess({
        resource: "opportunities",
        action: "read",
      });

      expect(result).toBe(false);
    });

    it("should handle network timeout during session check", async () => {
      mockSupabase.auth.getSession.mockRejectedValue(
        new Error("Network timeout")
      );

      // Mock window.location.pathname
      const originalLocation = window.location;
      delete (window as any).location;
      window.location = { ...originalLocation, pathname: "/dashboard" };

      await expect(authProvider.checkAuth({})).rejects.toThrow(
        "Not authenticated"
      );

      // Restore window.location
      window.location = originalLocation;
    });

    it("should handle database error when fetching sale", async () => {
      mockSupabase.auth.getSession.mockResolvedValue({
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
      mockSupabase.from.mockReturnValue({
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
