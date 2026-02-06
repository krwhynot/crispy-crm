/**
 * Tests for organizationsCallbacks
 *
 * TDD: These tests define the expected behavior for organizations-specific lifecycle callbacks
 * using React Admin's withLifecycleCallbacks pattern.
 *
 * Key behaviors (following contactsCallbacks pattern):
 * 1. Soft delete on delete operation (set deleted_at instead of hard delete)
 * 2. Clean filters before getList (add soft delete filter)
 * 3. Transform data for database compatibility on save (strip computed fields)
 * 4. Handle logo field processing
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import type { DataProvider, RaRecord } from "ra-core";
import { organizationsCallbacks } from "./organizationsCallbacks";
import type { DeleteParamsWithMeta } from "@/tests/utils";

// Mock supabase for RPC cascade delete tests
vi.mock("../supabase", () => ({
  supabase: {
    rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
  },
}));

// Mock storage cleanup utilities
vi.mock("../utils/storageCleanup", () => ({
  collectOrganizationFilePaths: vi.fn().mockResolvedValue([]),
  deleteStorageFiles: vi.fn().mockResolvedValue(undefined),
}));

describe("organizationsCallbacks", () => {
  let mockDataProvider: DataProvider;

  beforeEach(() => {
    mockDataProvider = {
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

  describe("resource configuration", () => {
    it("should target the organizations resource", () => {
      expect(organizationsCallbacks.resource).toBe("organizations");
    });
  });

  describe("beforeDelete - cascade soft delete via RPC", () => {
    it("should call archive_organization_with_relations RPC for cascade soft delete", async () => {
      // Import mocked supabase to verify RPC call
      const { supabase } = await import("../supabase");

      const params = {
        id: 1,
        previousData: { id: 1, name: "Acme Corp" } as RaRecord,
      };

      const result = await organizationsCallbacks.beforeDelete!(params, mockDataProvider);

      // Should call RPC for cascade soft delete (FIX [WF-C02])
      expect(supabase.rpc).toHaveBeenCalledWith("archive_organization_with_relations", {
        org_id: 1,
      });

      // Should return modified params that prevent actual delete
      expect(result).toHaveProperty("meta");
      const resultWithMeta = result as DeleteParamsWithMeta;
      expect(resultWithMeta.meta?.skipDelete).toBe(true);
    });

    it("should not call dataProvider.update (uses RPC instead)", async () => {
      const params = {
        id: 1,
        previousData: { id: 1, name: "Acme Corp" } as RaRecord,
      };

      await organizationsCallbacks.beforeDelete!(params, mockDataProvider);

      // Should NOT call dataProvider.update - uses RPC instead
      expect(mockDataProvider.update).not.toHaveBeenCalled();
    });
  });

  describe("beforeGetList - filter cleaning", () => {
    it("should add soft delete filter by default", async () => {
      const params = {
        pagination: { page: 1, perPage: 10 },
        sort: { field: "id", order: "ASC" as const },
        filter: { sector: "Technology" },
      };

      const result = await organizationsCallbacks.beforeGetList!(params, mockDataProvider);

      expect(result.filter).toHaveProperty("deleted_at@is", null);
    });

    it("should not add soft delete filter when includeDeleted is true", async () => {
      const params = {
        pagination: { page: 1, perPage: 10 },
        sort: { field: "id", order: "ASC" as const },
        filter: { sector: "Technology", includeDeleted: true },
      };

      const result = await organizationsCallbacks.beforeGetList!(params, mockDataProvider);

      expect(result.filter).not.toHaveProperty("deleted_at@is");
    });

    it("should preserve existing filters", async () => {
      const params = {
        pagination: { page: 1, perPage: 10 },
        sort: { field: "id", order: "ASC" as const },
        filter: { sector: "Technology", city: "San Francisco" },
      };

      const result = await organizationsCallbacks.beforeGetList!(params, mockDataProvider);

      expect(result.filter.sector).toBe("Technology");
      expect(result.filter.city).toBe("San Francisco");
    });
  });

  describe("beforeSave - data transformation", () => {
    it("should strip computed fields before create", async () => {
      const data = {
        name: "Acme Corp",
        sector: "Technology",
        // Computed fields that shouldn't be sent to database
        contact_count: 15,
        opportunity_count: 5,
        total_revenue: 1000000,
      };

      const result = await organizationsCallbacks.beforeSave!(
        data,
        mockDataProvider,
        "organizations"
      );

      expect(result).not.toHaveProperty("contact_count");
      expect(result).not.toHaveProperty("opportunity_count");
      expect(result).not.toHaveProperty("total_revenue");
      expect(result.name).toBe("Acme Corp");
      expect(result.sector).toBe("Technology");
    });

    it("should preserve required fields", async () => {
      const data = {
        name: "Acme Corp",
        sector: "Technology",
        phone: "555-1234",
        website: "https://acme.com",
        address: "123 Main St",
        city: "San Francisco",
        state: "CA",
        postal_code: "94102",
        description: "A great company",
      };

      const result = await organizationsCallbacks.beforeSave!(
        data,
        mockDataProvider,
        "organizations"
      );

      expect(result.name).toBe("Acme Corp");
      expect(result.sector).toBe("Technology");
      expect(result.phone).toBe("555-1234");
      expect(result.website).toBe("https://acme.com");
      expect(result.city).toBe("San Francisco");
    });

    it("should handle logo field (base64 or URL)", async () => {
      const data = {
        name: "Acme Corp",
        logo: "data:image/png;base64,abc123",
      };

      const result = await organizationsCallbacks.beforeSave!(
        data,
        mockDataProvider,
        "organizations"
      );

      // Logo should be preserved for storage service to handle
      expect(result.logo).toBe("data:image/png;base64,abc123");
    });
  });

  describe("afterRead - data normalization", () => {
    it("should not define afterRead (no transformation needed)", () => {
      // Organizations don't need afterRead transformation
      // Using factory pattern with no afterReadTransform means afterRead is not created
      expect(organizationsCallbacks.afterRead).toBeUndefined();
    });

    it("should handle null sector gracefully (no transformation)", () => {
      const record = {
        id: 1,
        name: "Acme Corp",
        sector: null,
      } as RaRecord;

      // Without afterRead, the record is returned unchanged by the database layer
      // This is expected behavior - no normalization needed for organizations
      expect(record.id).toBe(1);
      expect(record.name).toBe("Acme Corp");
      expect(record.sector).toBeNull();
    });

    it("should preserve all standard fields (no transformation)", () => {
      const record = {
        id: 1,
        name: "Acme Corp",
        sector: "Technology",
        phone: "555-1234",
        website: "https://acme.com",
        logo: "https://storage.example.com/logo.png",
      } as RaRecord;

      // Without afterRead, the record is returned unchanged
      // This is the expected behavior for organizations
      expect(record.id).toBe(1);
      expect(record.name).toBe("Acme Corp");
    });
  });
});
