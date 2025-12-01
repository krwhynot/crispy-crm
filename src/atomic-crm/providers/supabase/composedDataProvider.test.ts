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
    it("should route contacts to composed handler", async () => {
      const provider = createComposedDataProvider(mockBaseProvider);

      await provider.getList("contacts", {
        pagination: { page: 1, perPage: 10 },
        sort: { field: "id", order: "ASC" },
        filter: {},
      });

      // The composed handler adds soft delete filter
      expect(mockBaseProvider.getList).toHaveBeenCalledWith(
        "contacts",
        expect.objectContaining({
          filter: expect.objectContaining({
            "deleted_at@is": null,
          }),
        })
      );
    });

    it("should route organizations to composed handler", async () => {
      const provider = createComposedDataProvider(mockBaseProvider);

      await provider.getList("organizations", {
        pagination: { page: 1, perPage: 10 },
        sort: { field: "id", order: "ASC" },
        filter: {},
      });

      expect(mockBaseProvider.getList).toHaveBeenCalledWith(
        "organizations",
        expect.objectContaining({
          filter: expect.objectContaining({
            "deleted_at@is": null,
          }),
        })
      );
    });

    it("should route opportunities to composed handler", async () => {
      const provider = createComposedDataProvider(mockBaseProvider);

      await provider.getList("opportunities", {
        pagination: { page: 1, perPage: 10 },
        sort: { field: "id", order: "ASC" },
        filter: {},
      });

      expect(mockBaseProvider.getList).toHaveBeenCalledWith(
        "opportunities",
        expect.objectContaining({
          filter: expect.objectContaining({
            "deleted_at@is": null,
          }),
        })
      );
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

    it("should route products to composed handler", async () => {
      const provider = createComposedDataProvider(mockBaseProvider);

      await provider.getList("products", {
        pagination: { page: 1, perPage: 10 },
        sort: { field: "name", order: "ASC" },
        filter: {},
      });

      expect(mockBaseProvider.getList).toHaveBeenCalledWith(
        "products",
        expect.objectContaining({
          filter: expect.objectContaining({
            "deleted_at@is": null,
          }),
        })
      );
    });
  });

  describe("resource routing - fallback to base provider", () => {
    it("should fall back to base provider for unknown resources", async () => {
      const provider = createComposedDataProvider(mockBaseProvider);

      await provider.getList("tags", {
        pagination: { page: 1, perPage: 10 },
        sort: { field: "id", order: "ASC" },
        filter: { status: "active" },
      });

      // Should pass through unchanged to base provider
      expect(mockBaseProvider.getList).toHaveBeenCalledWith("tags", {
        pagination: { page: 1, perPage: 10 },
        sort: { field: "id", order: "ASC" },
        filter: { status: "active" },
      });
    });

    it("should fall back for sales resource", async () => {
      const provider = createComposedDataProvider(mockBaseProvider);

      await provider.getOne("sales", { id: 1 });

      expect(mockBaseProvider.getOne).toHaveBeenCalledWith("sales", { id: 1 });
    });

    it("should fall back for junction tables without handlers", async () => {
      const provider = createComposedDataProvider(mockBaseProvider);

      await provider.getList("contact_organizations", {
        pagination: { page: 1, perPage: 10 },
        sort: { field: "id", order: "ASC" },
        filter: {},
      });

      expect(mockBaseProvider.getList).toHaveBeenCalledWith("contact_organizations", {
        pagination: { page: 1, perPage: 10 },
        sort: { field: "id", order: "ASC" },
        filter: {},
      });
    });
  });

  describe("all DataProvider methods route correctly", () => {
    it("should route getOne to handler for contacts", async () => {
      const provider = createComposedDataProvider(mockBaseProvider);

      await provider.getOne("contacts", { id: 1 });

      expect(mockBaseProvider.getOne).toHaveBeenCalledWith("contacts", { id: 1 });
    });

    it("should route getMany to handler for contacts", async () => {
      const provider = createComposedDataProvider(mockBaseProvider);

      await provider.getMany("contacts", { ids: [1, 2, 3] });

      expect(mockBaseProvider.getMany).toHaveBeenCalledWith("contacts", { ids: [1, 2, 3] });
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

    it("should route delete to handler for contacts", async () => {
      const provider = createComposedDataProvider(mockBaseProvider);

      await provider.delete("contacts", {
        id: 1,
        previousData: { id: 1, first_name: "John" },
      });

      // Composed handler performs soft delete via update
      expect(mockBaseProvider.update).toHaveBeenCalledWith(
        "contacts",
        expect.objectContaining({
          id: 1,
          data: expect.objectContaining({
            deleted_at: expect.any(String),
          }),
        })
      );
    });
  });

  describe("HANDLED_RESOURCES constant", () => {
    it("should export list of handled resources", () => {
      expect(HANDLED_RESOURCES).toContain("contacts");
      expect(HANDLED_RESOURCES).toContain("organizations");
      expect(HANDLED_RESOURCES).toContain("opportunities");
      expect(HANDLED_RESOURCES).toContain("activities");
      expect(HANDLED_RESOURCES).toContain("products");
    });

    it("should have exactly 5 handled resources", () => {
      expect(HANDLED_RESOURCES).toHaveLength(5);
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
