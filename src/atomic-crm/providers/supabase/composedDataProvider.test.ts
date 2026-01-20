/**
 * Tests for composedDataProvider
 *
 * TDD: These tests define the expected behavior for the Proxy pattern composer
 * that routes DataProvider method calls to appropriate resource handlers.
 *
 * Key behaviors:
 * 1. Route known resources to their composed handlers
 * 2. Fall back to base provider for unknown resources
 * 3. Maintain backward compatibility with existing API
 * 4. Preserve custom methods (rpc, storage operations)
 *
 * Engineering Constitution: Proxy pattern for routing, composition over inheritance
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import type { DataProvider } from "ra-core";
import { createComposedDataProvider, HANDLED_RESOURCES } from "./composedDataProvider";

// Mock supabase for RPC cascade delete tests
vi.mock("./supabase", () => ({
  supabase: {
    rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
  },
}));

// Mock storage cleanup utilities
vi.mock("./utils/storageCleanup", () => ({
  collectContactFilePaths: vi.fn().mockResolvedValue([]),
  deleteStorageFiles: vi.fn().mockResolvedValue(undefined),
}));

describe("composedDataProvider", () => {
  let mockBaseProvider: DataProvider;

  beforeEach(() => {
    mockBaseProvider = {
      getList: vi.fn().mockResolvedValue({ data: [], total: 0 }),
      getOne: vi.fn().mockResolvedValue({ data: { id: 1 } }),
      getMany: vi.fn().mockResolvedValue({ data: [] }),
      getManyReference: vi.fn().mockResolvedValue({ data: [], total: 0 }),
      create: vi.fn().mockResolvedValue({ data: { id: 1 } }),
      update: vi.fn().mockResolvedValue({ data: { id: 1 } }),
      updateMany: vi.fn().mockResolvedValue({ data: [1] }),
      delete: vi.fn().mockResolvedValue({ data: { id: 1 } }),
      deleteMany: vi.fn().mockResolvedValue({ data: [1, 2] }),
    };
  });

  describe("factory function", () => {
    it("should create a DataProvider with all standard methods", () => {
      const provider = createComposedDataProvider(mockBaseProvider);

      expect(provider.getList).toBeDefined();
      expect(provider.getOne).toBeDefined();
      expect(provider.getMany).toBeDefined();
      expect(provider.getManyReference).toBeDefined();
      expect(provider.create).toBeDefined();
      expect(provider.update).toBeDefined();
      expect(provider.updateMany).toBeDefined();
      expect(provider.delete).toBeDefined();
      expect(provider.deleteMany).toBeDefined();
    });

    it("should return a valid DataProvider type", () => {
      const provider = createComposedDataProvider(mockBaseProvider);

      const dp: DataProvider = provider;
      expect(dp).toBeDefined();
    });
  });

  describe("resource routing - handled resources", () => {
    it("should route contacts to composed handler (contacts_summary view)", async () => {
      const provider = createComposedDataProvider(mockBaseProvider);

      await provider.getList("contacts", {
        pagination: { page: 1, perPage: 10 },
        sort: { field: "id", order: "ASC" },
        filter: {},
      });

      // Contacts handler routes to contacts_summary view via getDatabaseResource
      expect(mockBaseProvider.getList).toHaveBeenCalledWith(
        "contacts_summary",
        expect.objectContaining({
          filter: expect.any(Object),
        })
      );
    });

    it("should route organizations to composed handler (organizations view)", async () => {
      const provider = createComposedDataProvider(mockBaseProvider);

      await provider.getList("organizations", {
        pagination: { page: 1, perPage: 10 },
        sort: { field: "id", order: "ASC" },
        filter: {},
      });

      // Organizations handler may route to summary view
      expect(mockBaseProvider.getList).toHaveBeenCalled();
    });

    it("should route opportunities to composed handler (opportunities view)", async () => {
      const provider = createComposedDataProvider(mockBaseProvider);

      await provider.getList("opportunities", {
        pagination: { page: 1, perPage: 10 },
        sort: { field: "id", order: "ASC" },
        filter: {},
      });

      // Opportunities handler routes to appropriate view
      expect(mockBaseProvider.getList).toHaveBeenCalled();
    });

    it("should route activities to composed handler", async () => {
      const provider = createComposedDataProvider(mockBaseProvider);

      await provider.getList("activities", {
        pagination: { page: 1, perPage: 10 },
        sort: { field: "date", order: "DESC" },
        filter: {},
      });

      expect(mockBaseProvider.getList).toHaveBeenCalledWith(
        "activities",
        expect.objectContaining({
          filter: expect.objectContaining({
            "deleted_at@is": null,
          }),
        })
      );
    });

    it("should route products to composed handler (products_summary view)", async () => {
      const provider = createComposedDataProvider(mockBaseProvider);

      await provider.getList("products", {
        pagination: { page: 1, perPage: 10 },
        sort: { field: "name", order: "ASC" },
        filter: {},
      });

      // Products handler routes to products_summary view
      expect(mockBaseProvider.getList).toHaveBeenCalledWith(
        "products_summary",
        expect.objectContaining({
          filter: expect.any(Object),
        })
      );
    });
  });

  describe("resource routing - fallback to base provider", () => {
    it("should fall back to base provider for unknown resources (passthrough - no soft delete filter)", async () => {
      const provider = createComposedDataProvider(mockBaseProvider);

      // Use a resource that's truly not in HANDLED_RESOURCES
      // Note: "segments" was added in Phase 4, so we use "reports" instead
      await provider.getList("reports", {
        pagination: { page: 1, perPage: 10 },
        sort: { field: "id", order: "ASC" },
        filter: { status: "active" },
      });

      // Unknown resources pass through unchanged (no soft delete filter added)
      // Only HANDLED_RESOURCES get lifecycle callbacks applied
      expect(mockBaseProvider.getList).toHaveBeenCalledWith("reports", {
        pagination: { page: 1, perPage: 10 },
        sort: { field: "id", order: "ASC" },
        filter: { status: "active" },
      });
    });

    it("should route tags to composed handler (handled resource)", async () => {
      const provider = createComposedDataProvider(mockBaseProvider);

      await provider.getOne("tags", { id: 1 });

      // Tags is now a handled resource
      expect(mockBaseProvider.getOne).toHaveBeenCalled();
    });

    it("should fall back for junction tables without handlers (pass through unchanged)", async () => {
      const provider = createComposedDataProvider(mockBaseProvider);

      await provider.getList("contact_organizations", {
        pagination: { page: 1, perPage: 10 },
        sort: { field: "id", order: "ASC" },
        filter: {},
      });

      // Junction tables pass through to base provider unchanged
      expect(mockBaseProvider.getList).toHaveBeenCalledWith("contact_organizations", {
        pagination: { page: 1, perPage: 10 },
        sort: { field: "id", order: "ASC" },
        filter: {},
      });
    });
  });

  describe("all DataProvider methods route correctly", () => {
    it("should route getOne to handler for contacts (routes to base table)", async () => {
      const provider = createComposedDataProvider(mockBaseProvider);

      await provider.getOne("contacts", { id: 1 });

      // getOne uses base table (not summary view) to avoid RLS mismatches
      expect(mockBaseProvider.getOne).toHaveBeenCalledWith("contacts", { id: 1 });
    });

    it("should route getMany to handler for contacts (uses contacts_summary view for soft delete filtering)", async () => {
      const provider = createComposedDataProvider(mockBaseProvider);

      await provider.getMany("contacts", { ids: [1, 2, 3] });

      // FIX [SF-C09]: getMany now uses contacts_summary view to ensure soft-deleted records are filtered
      expect(mockBaseProvider.getMany).toHaveBeenCalledWith("contacts_summary", { ids: [1, 2, 3] });
    });

    it("should route create to handler for contacts", async () => {
      const provider = createComposedDataProvider(mockBaseProvider);

      await provider.create("contacts", { data: { first_name: "John" } });

      expect(mockBaseProvider.create).toHaveBeenCalled();
    });

    it("should route update to handler for contacts", async () => {
      const provider = createComposedDataProvider(mockBaseProvider);

      await provider.update("contacts", {
        id: 1,
        data: { first_name: "Jane" },
        previousData: { id: 1, first_name: "John" },
      });

      expect(mockBaseProvider.update).toHaveBeenCalled();
    });

    it("should route delete to handler for contacts (uses RPC for cascade soft delete)", async () => {
      // Import mocked supabase to verify RPC call
      const { supabase } = await import("./supabase");

      const provider = createComposedDataProvider(mockBaseProvider);

      await provider.delete("contacts", {
        id: 1,
        previousData: { id: 1, first_name: "John" },
      });

      // Composed handler now performs cascade soft delete via RPC (FIX [WF-C01])
      // This ensures related records (activities, notes, etc.) are also archived
      expect(supabase.rpc).toHaveBeenCalledWith("archive_contact_with_relations", {
        contact_id: 1,
      });
    });
  });

  describe("HANDLED_RESOURCES constant", () => {
    it("should export list of core handled resources", () => {
      expect(HANDLED_RESOURCES).toContain("contacts");
      expect(HANDLED_RESOURCES).toContain("organizations");
      expect(HANDLED_RESOURCES).toContain("opportunities");
      expect(HANDLED_RESOURCES).toContain("activities");
      expect(HANDLED_RESOURCES).toContain("products");
    });

    it("should include extended resources (tasks, notes, tags, sales)", () => {
      expect(HANDLED_RESOURCES).toContain("tasks");
      expect(HANDLED_RESOURCES).toContain("contact_notes");
      expect(HANDLED_RESOURCES).toContain("opportunity_notes");
      expect(HANDLED_RESOURCES).toContain("organization_notes");
      expect(HANDLED_RESOURCES).toContain("tags");
      expect(HANDLED_RESOURCES).toContain("sales");
    });

    it("should have exactly 21 handled resources", () => {
      // Core: contacts, organizations, opportunities, activities, products
      // Tasks: tasks
      // Notes: contact_notes, opportunity_notes, organization_notes
      // Supporting: tags, sales, segments, product_distributors
      // Junction tables: opportunity_participants, opportunity_contacts, interaction_participants, distributor_principal_authorizations, organization_distributors
      // Notifications: user_favorites, notifications
      // Timeline: entity_timeline
      expect(HANDLED_RESOURCES).toHaveLength(21);
    });
  });

  describe("backward compatibility", () => {
    it("should preserve base provider methods", async () => {
      const provider = createComposedDataProvider(mockBaseProvider);

      // All standard DataProvider methods should be callable
      await expect(
        provider.getList("any", {
          pagination: { page: 1, perPage: 10 },
          sort: { field: "id", order: "ASC" },
          filter: {},
        })
      ).resolves.toBeDefined();
    });
  });
});
