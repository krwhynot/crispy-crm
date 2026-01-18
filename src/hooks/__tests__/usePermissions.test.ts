/**
 * usePermissions Hook Tests
 *
 * Tests the React hook that combines identity retrieval with permission checking.
 * Requires mocking useGetIdentity from react-admin.
 *
 * The hook provides:
 * - Role booleans (isAdmin, isManager, isRep, isManagerOrAdmin)
 * - can() method for permission checks with optional record context
 * - salesId for ownership verification
 * - isLoading state from identity fetch
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { usePermissions } from "../usePermissions";
import type { UserRole } from "../useUserRole";

vi.mock("react-admin", () => ({
  useGetIdentity: vi.fn(),
}));

import { useGetIdentity } from "react-admin";

const mockUseGetIdentity = vi.mocked(useGetIdentity);

interface MockIdentity {
  id: number;
  role: UserRole;
  fullName: string;
  avatar?: string;
}

describe("usePermissions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("role booleans for admin user", () => {
    beforeEach(() => {
      mockUseGetIdentity.mockReturnValue({
        identity: { id: 1, role: "admin", fullName: "Admin User" } as MockIdentity,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      } as unknown as ReturnType<typeof useGetIdentity>);
    });

    it("should return isAdmin as true", () => {
      const { result } = renderHook(() => usePermissions());
      expect(result.current.isAdmin).toBe(true);
    });

    it("should return isManager as false", () => {
      const { result } = renderHook(() => usePermissions());
      expect(result.current.isManager).toBe(false);
    });

    it("should return isRep as false", () => {
      const { result } = renderHook(() => usePermissions());
      expect(result.current.isRep).toBe(false);
    });

    it("should return isManagerOrAdmin as true", () => {
      const { result } = renderHook(() => usePermissions());
      expect(result.current.isManagerOrAdmin).toBe(true);
    });

    it("should return role as admin", () => {
      const { result } = renderHook(() => usePermissions());
      expect(result.current.role).toBe("admin");
    });
  });

  describe("role booleans for manager user", () => {
    beforeEach(() => {
      mockUseGetIdentity.mockReturnValue({
        identity: { id: 2, role: "manager", fullName: "Manager User" } as MockIdentity,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      } as unknown as ReturnType<typeof useGetIdentity>);
    });

    it("should return isAdmin as false", () => {
      const { result } = renderHook(() => usePermissions());
      expect(result.current.isAdmin).toBe(false);
    });

    it("should return isManager as true", () => {
      const { result } = renderHook(() => usePermissions());
      expect(result.current.isManager).toBe(true);
    });

    it("should return isRep as false", () => {
      const { result } = renderHook(() => usePermissions());
      expect(result.current.isRep).toBe(false);
    });

    it("should return isManagerOrAdmin as true", () => {
      const { result } = renderHook(() => usePermissions());
      expect(result.current.isManagerOrAdmin).toBe(true);
    });

    it("should return role as manager", () => {
      const { result } = renderHook(() => usePermissions());
      expect(result.current.role).toBe("manager");
    });
  });

  describe("role booleans for rep user", () => {
    beforeEach(() => {
      mockUseGetIdentity.mockReturnValue({
        identity: { id: 3, role: "rep", fullName: "Rep User" } as MockIdentity,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      } as unknown as ReturnType<typeof useGetIdentity>);
    });

    it("should return isAdmin as false", () => {
      const { result } = renderHook(() => usePermissions());
      expect(result.current.isAdmin).toBe(false);
    });

    it("should return isManager as false", () => {
      const { result } = renderHook(() => usePermissions());
      expect(result.current.isManager).toBe(false);
    });

    it("should return isRep as true", () => {
      const { result } = renderHook(() => usePermissions());
      expect(result.current.isRep).toBe(true);
    });

    it("should return isManagerOrAdmin as false", () => {
      const { result } = renderHook(() => usePermissions());
      expect(result.current.isManagerOrAdmin).toBe(false);
    });

    it("should return role as rep", () => {
      const { result } = renderHook(() => usePermissions());
      expect(result.current.role).toBe("rep");
    });
  });

  describe("can() method delegates to canAccess", () => {
    it("should allow admin to delete contacts", () => {
      mockUseGetIdentity.mockReturnValue({
        identity: { id: 1, role: "admin", fullName: "Admin User" } as MockIdentity,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      } as unknown as ReturnType<typeof useGetIdentity>);

      const { result } = renderHook(() => usePermissions());
      expect(result.current.can("delete", "contacts")).toBe(true);
    });

    it("should allow admin to access sales resource", () => {
      mockUseGetIdentity.mockReturnValue({
        identity: { id: 1, role: "admin", fullName: "Admin User" } as MockIdentity,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      } as unknown as ReturnType<typeof useGetIdentity>);

      const { result } = renderHook(() => usePermissions());
      expect(result.current.can("list", "sales")).toBe(true);
      expect(result.current.can("edit", "sales")).toBe(true);
    });

    it("should deny manager access to sales resource", () => {
      mockUseGetIdentity.mockReturnValue({
        identity: { id: 2, role: "manager", fullName: "Manager User" } as MockIdentity,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      } as unknown as ReturnType<typeof useGetIdentity>);

      const { result } = renderHook(() => usePermissions());
      expect(result.current.can("list", "sales")).toBe(false);
      expect(result.current.can("edit", "sales")).toBe(false);
    });

    it("should deny rep access to sales resource", () => {
      mockUseGetIdentity.mockReturnValue({
        identity: { id: 3, role: "rep", fullName: "Rep User" } as MockIdentity,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      } as unknown as ReturnType<typeof useGetIdentity>);

      const { result } = renderHook(() => usePermissions());
      expect(result.current.can("list", "sales")).toBe(false);
    });

    it("should allow rep to create contacts", () => {
      mockUseGetIdentity.mockReturnValue({
        identity: { id: 3, role: "rep", fullName: "Rep User" } as MockIdentity,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      } as unknown as ReturnType<typeof useGetIdentity>);

      const { result } = renderHook(() => usePermissions());
      expect(result.current.can("create", "contacts")).toBe(true);
    });

    it("should allow rep to edit owned records", () => {
      const salesId = 123;
      mockUseGetIdentity.mockReturnValue({
        identity: { id: salesId, role: "rep", fullName: "Rep User" } as MockIdentity,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      } as unknown as ReturnType<typeof useGetIdentity>);

      const { result } = renderHook(() => usePermissions());
      const ownedRecord = { id: 1, sales_id: salesId, name: "Test Contact" };
      expect(result.current.can("edit", "contacts", ownedRecord)).toBe(true);
    });

    it("should deny rep edit access to non-owned records", () => {
      const salesId = 123;
      mockUseGetIdentity.mockReturnValue({
        identity: { id: salesId, role: "rep", fullName: "Rep User" } as MockIdentity,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      } as unknown as ReturnType<typeof useGetIdentity>);

      const { result } = renderHook(() => usePermissions());
      const otherRecord = { id: 1, sales_id: 999, name: "Other Contact" };
      expect(result.current.can("edit", "contacts", otherRecord)).toBe(false);
    });

    it("should allow rep delete access via created_by ownership", () => {
      const salesId = 456;
      mockUseGetIdentity.mockReturnValue({
        identity: { id: salesId, role: "rep", fullName: "Rep User" } as MockIdentity,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      } as unknown as ReturnType<typeof useGetIdentity>);

      const { result } = renderHook(() => usePermissions());
      const createdRecord = { id: 1, sales_id: 999, created_by: salesId };
      expect(result.current.can("delete", "tasks", createdRecord)).toBe(true);
    });

    it("should allow rep edit via opportunity_owner_id ownership", () => {
      const salesId = 789;
      mockUseGetIdentity.mockReturnValue({
        identity: { id: salesId, role: "rep", fullName: "Rep User" } as MockIdentity,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      } as unknown as ReturnType<typeof useGetIdentity>);

      const { result } = renderHook(() => usePermissions());
      const opportunity = { id: 1, sales_id: 999, opportunity_owner_id: salesId };
      expect(result.current.can("edit", "opportunities", opportunity)).toBe(true);
    });

    it("should allow rep edit via account_manager_id ownership", () => {
      const salesId = 101;
      mockUseGetIdentity.mockReturnValue({
        identity: { id: salesId, role: "rep", fullName: "Rep User" } as MockIdentity,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      } as unknown as ReturnType<typeof useGetIdentity>);

      const { result } = renderHook(() => usePermissions());
      const organization = { id: 1, sales_id: 999, account_manager_id: salesId };
      expect(result.current.can("edit", "organizations", organization)).toBe(true);
    });
  });

  describe("salesId extraction from identity", () => {
    it("should extract salesId from identity.id when it is a number", () => {
      mockUseGetIdentity.mockReturnValue({
        identity: { id: 42, role: "rep", fullName: "Rep User" } as MockIdentity,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      } as unknown as ReturnType<typeof useGetIdentity>);

      const { result } = renderHook(() => usePermissions());
      expect(result.current.salesId).toBe(42);
    });

    it("should return null for salesId when identity.id is a string", () => {
      mockUseGetIdentity.mockReturnValue({
        identity: {
          id: "uuid-string-id" as unknown as number,
          role: "rep",
          fullName: "Rep User",
        } as MockIdentity,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      } as unknown as ReturnType<typeof useGetIdentity>);

      const { result } = renderHook(() => usePermissions());
      expect(result.current.salesId).toBe(null);
    });

    it("should return null for salesId when identity is undefined", () => {
      mockUseGetIdentity.mockReturnValue({
        identity: undefined,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      } as unknown as ReturnType<typeof useGetIdentity>);

      const { result } = renderHook(() => usePermissions());
      expect(result.current.salesId).toBe(null);
    });

    it("should handle zero as valid salesId", () => {
      mockUseGetIdentity.mockReturnValue({
        identity: { id: 0, role: "rep", fullName: "Rep User" } as MockIdentity,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      } as unknown as ReturnType<typeof useGetIdentity>);

      const { result } = renderHook(() => usePermissions());
      expect(result.current.salesId).toBe(0);
    });
  });

  describe("isLoading reflects identity loading state", () => {
    it("should return isLoading true when identity is loading", () => {
      mockUseGetIdentity.mockReturnValue({
        identity: undefined,
        isLoading: true,
        error: null,
        refetch: vi.fn(),
      } as unknown as ReturnType<typeof useGetIdentity>);

      const { result } = renderHook(() => usePermissions());
      expect(result.current.isLoading).toBe(true);
    });

    it("should return isLoading false when identity is loaded", () => {
      mockUseGetIdentity.mockReturnValue({
        identity: { id: 1, role: "admin", fullName: "Admin User" } as MockIdentity,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      } as unknown as ReturnType<typeof useGetIdentity>);

      const { result } = renderHook(() => usePermissions());
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe("default role behavior", () => {
    it("should default to rep role when identity has no role", () => {
      mockUseGetIdentity.mockReturnValue({
        identity: { id: 1, fullName: "User Without Role" } as MockIdentity,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      } as unknown as ReturnType<typeof useGetIdentity>);

      const { result } = renderHook(() => usePermissions());
      expect(result.current.role).toBe("rep");
      expect(result.current.isRep).toBe(true);
      expect(result.current.isAdmin).toBe(false);
      expect(result.current.isManager).toBe(false);
    });

    it("should default to rep role when identity is undefined", () => {
      mockUseGetIdentity.mockReturnValue({
        identity: undefined,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      } as unknown as ReturnType<typeof useGetIdentity>);

      const { result } = renderHook(() => usePermissions());
      expect(result.current.role).toBe("rep");
      expect(result.current.isRep).toBe(true);
    });
  });

  describe("can() with various actions and resources", () => {
    beforeEach(() => {
      mockUseGetIdentity.mockReturnValue({
        identity: { id: 100, role: "manager", fullName: "Manager User" } as MockIdentity,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      } as unknown as ReturnType<typeof useGetIdentity>);
    });

    it("should allow list on all shared resources for manager", () => {
      const { result } = renderHook(() => usePermissions());
      expect(result.current.can("list", "contacts")).toBe(true);
      expect(result.current.can("list", "organizations")).toBe(true);
      expect(result.current.can("list", "opportunities")).toBe(true);
      expect(result.current.can("list", "activities")).toBe(true);
      expect(result.current.can("list", "tasks")).toBe(true);
      expect(result.current.can("list", "products")).toBe(true);
      expect(result.current.can("list", "tags")).toBe(true);
      expect(result.current.can("list", "segments")).toBe(true);
    });

    it("should allow show on all shared resources for manager", () => {
      const { result } = renderHook(() => usePermissions());
      expect(result.current.can("show", "contacts")).toBe(true);
      expect(result.current.can("show", "opportunities")).toBe(true);
    });

    it("should allow create on all shared resources for manager", () => {
      const { result } = renderHook(() => usePermissions());
      expect(result.current.can("create", "contacts")).toBe(true);
      expect(result.current.can("create", "opportunities")).toBe(true);
    });

    it("should allow edit on all shared resources for manager", () => {
      const { result } = renderHook(() => usePermissions());
      expect(result.current.can("edit", "contacts")).toBe(true);
      expect(result.current.can("edit", "opportunities")).toBe(true);
    });

    it("should allow delete on all shared resources for manager", () => {
      const { result } = renderHook(() => usePermissions());
      expect(result.current.can("delete", "contacts")).toBe(true);
      expect(result.current.can("delete", "opportunities")).toBe(true);
    });

    it("should allow export on all shared resources for manager", () => {
      const { result } = renderHook(() => usePermissions());
      expect(result.current.can("export", "contacts")).toBe(true);
      expect(result.current.can("export", "opportunities")).toBe(true);
    });
  });
});
