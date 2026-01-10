/**
 * Tests for contactsCallbacks
 *
 * TDD: These tests define the expected behavior for contacts-specific lifecycle callbacks
 * using React Admin's withLifecycleCallbacks pattern.
 *
 * Key behaviors:
 * 1. Soft delete on delete operation (set deleted_at instead of hard delete)
 * 2. Normalize JSONB array fields (email, phone, tags) on read
 * 3. Clean filters before getList
 * 4. Transform data for database compatibility on save
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import type { DataProvider, RaRecord } from "ra-core";
import {
  contactsCallbacks,
  transformQToIlikeSearch,
  CONTACTS_SEARCH_FIELDS,
} from "./contactsCallbacks";

// Mock supabase for RPC cascade delete tests
vi.mock("../supabase", () => ({
  supabase: {
    rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
  },
}));

// Mock storage cleanup utilities
vi.mock("../utils/storageCleanup", () => ({
  collectContactFilePaths: vi.fn().mockResolvedValue([]),
  deleteStorageFiles: vi.fn().mockResolvedValue(undefined),
}));

describe("contactsCallbacks", () => {
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
    it("should target the contacts resource", () => {
      expect(contactsCallbacks.resource).toBe("contacts");
    });
  });

  describe("beforeDelete - cascade soft delete via RPC", () => {
    it("should call archive_contact_with_relations RPC for cascade soft delete", async () => {
      // Import mocked supabase to verify RPC call
      const { supabase } = await import("../supabase");

      const params = {
        id: 1,
        previousData: { id: 1, first_name: "John" } as RaRecord,
      };

      const result = await contactsCallbacks.beforeDelete!(params, mockDataProvider);

      // Should call RPC for cascade soft delete (FIX [WF-C01])
      expect(supabase.rpc).toHaveBeenCalledWith("archive_contact_with_relations", {
        contact_id: 1,
      });

      // Should return modified params that prevent actual delete
      expect(result).toHaveProperty("meta");
      expect((result as any).meta.skipDelete).toBe(true);
    });

    it("should not call dataProvider.update (uses RPC instead)", async () => {
      const params = {
        id: 1,
        previousData: { id: 1, first_name: "John" } as RaRecord,
      };

      await contactsCallbacks.beforeDelete!(params, mockDataProvider);

      // Should NOT call dataProvider.update - uses RPC instead
      expect(mockDataProvider.update).not.toHaveBeenCalled();
    });
  });

  describe("afterRead - JSONB normalization", () => {
    it("should normalize email field to array", async () => {
      const record = {
        id: 1,
        first_name: "John",
        email: null, // Database might return null
      } as RaRecord;

      const result = await contactsCallbacks.afterRead!(record, mockDataProvider);

      expect(result.email).toEqual([]);
    });

    it("should preserve existing email array", async () => {
      const emailArray = [{ value: "john@example.com", type: "work" }];
      const record = {
        id: 1,
        first_name: "John",
        email: emailArray,
      } as RaRecord;

      const result = await contactsCallbacks.afterRead!(record, mockDataProvider);

      expect(result.email).toEqual(emailArray);
    });

    it("should normalize phone field to array", async () => {
      const record = {
        id: 1,
        first_name: "John",
        phone: undefined,
      } as RaRecord;

      const result = await contactsCallbacks.afterRead!(record, mockDataProvider);

      expect(result.phone).toEqual([]);
    });

    it("should normalize tags field to array", async () => {
      const record = {
        id: 1,
        first_name: "John",
        tags: null,
      } as RaRecord;

      const result = await contactsCallbacks.afterRead!(record, mockDataProvider);

      expect(result.tags).toEqual([]);
    });

    it("should handle record without JSONB fields", async () => {
      const record = {
        id: 1,
        first_name: "John",
        last_name: "Doe",
      } as RaRecord;

      const result = await contactsCallbacks.afterRead!(record, mockDataProvider);

      expect(result.id).toBe(1);
      expect(result.first_name).toBe("John");
      expect(result.last_name).toBe("Doe");
    });
  });

  describe("beforeGetList - filter cleaning", () => {
    it("should add soft delete filter by default", async () => {
      const params = {
        pagination: { page: 1, perPage: 10 },
        sort: { field: "id", order: "ASC" as const },
        filter: { status: "active" },
      };

      const result = await contactsCallbacks.beforeGetList!(params, mockDataProvider);

      expect(result.filter).toHaveProperty("deleted_at@is", null);
    });

    it("should not add soft delete filter when includeDeleted is true", async () => {
      const params = {
        pagination: { page: 1, perPage: 10 },
        sort: { field: "id", order: "ASC" as const },
        filter: { status: "active", includeDeleted: true },
      };

      const result = await contactsCallbacks.beforeGetList!(params, mockDataProvider);

      expect(result.filter).not.toHaveProperty("deleted_at@is");
    });

    it("should preserve existing filters", async () => {
      const params = {
        pagination: { page: 1, perPage: 10 },
        sort: { field: "id", order: "ASC" as const },
        filter: { status: "active", organization_id: 123 },
      };

      const result = await contactsCallbacks.beforeGetList!(params, mockDataProvider);

      expect(result.filter.status).toBe("active");
      expect(result.filter.organization_id).toBe(123);
    });
  });

  describe("beforeGetList - q filter to ILIKE search transformation", () => {
    it("should transform q filter into @or ILIKE search", async () => {
      const params = {
        pagination: { page: 1, perPage: 10 },
        sort: { field: "id", order: "ASC" as const },
        filter: { q: "john" },
      };

      const result = await contactsCallbacks.beforeGetList!(params, mockDataProvider);

      // q should be removed from filter
      expect(result.filter).not.toHaveProperty("q");

      // @or filter should be created with ILIKE conditions on text fields only
      expect(result.filter).toHaveProperty("@or");
      expect(result.filter["@or"]).toHaveProperty("name@ilike", "%john%");
      expect(result.filter["@or"]).toHaveProperty("first_name@ilike", "%john%");
      expect(result.filter["@or"]).toHaveProperty("last_name@ilike", "%john%");
      // email is a JSONB field and should NOT be included in text search
      expect(result.filter["@or"]).not.toHaveProperty("email@ilike");
    });

    it("should preserve other filters when q is transformed", async () => {
      const params = {
        pagination: { page: 1, perPage: 10 },
        sort: { field: "id", order: "ASC" as const },
        filter: { q: "smith", status: "active", organization_id: 456 },
      };

      const result = await contactsCallbacks.beforeGetList!(params, mockDataProvider);

      // Other filters preserved
      expect(result.filter.status).toBe("active");
      expect(result.filter.organization_id).toBe(456);

      // q transformed
      expect(result.filter).not.toHaveProperty("q");
      expect(result.filter["@or"]).toHaveProperty("name@ilike", "%smith%");
    });

    it("should add soft delete filter along with search transformation", async () => {
      const params = {
        pagination: { page: 1, perPage: 10 },
        sort: { field: "id", order: "ASC" as const },
        filter: { q: "doe" },
      };

      const result = await contactsCallbacks.beforeGetList!(params, mockDataProvider);

      // Both search and soft delete filters should be present
      expect(result.filter).toHaveProperty("@or");
      expect(result.filter).toHaveProperty("deleted_at@is", null);
    });

    it("should handle empty q filter gracefully", async () => {
      const params = {
        pagination: { page: 1, perPage: 10 },
        sort: { field: "id", order: "ASC" as const },
        filter: { q: "", status: "active" },
      };

      const result = await contactsCallbacks.beforeGetList!(params, mockDataProvider);

      // Empty q should not create @or filter
      expect(result.filter).not.toHaveProperty("@or");
      expect(result.filter.status).toBe("active");
    });

    it("should handle non-string q filter gracefully", async () => {
      const params = {
        pagination: { page: 1, perPage: 10 },
        sort: { field: "id", order: "ASC" as const },
        filter: { q: 123, status: "active" },
      };

      const result = await contactsCallbacks.beforeGetList!(params, mockDataProvider);

      // Non-string q should not create @or filter
      expect(result.filter).not.toHaveProperty("@or");
    });

    it("should search all configured fields", async () => {
      const params = {
        pagination: { page: 1, perPage: 10 },
        sort: { field: "id", order: "ASC" as const },
        filter: { q: "test" },
      };

      const result = await contactsCallbacks.beforeGetList!(params, mockDataProvider);

      // Verify all search fields are included
      const orFilter = result.filter["@or"];
      expect(Object.keys(orFilter)).toHaveLength(CONTACTS_SEARCH_FIELDS.length);

      for (const field of CONTACTS_SEARCH_FIELDS) {
        expect(orFilter).toHaveProperty(`${field}@ilike`, "%test%");
      }
    });
  });

  describe("transformQToIlikeSearch - unit tests", () => {
    it("should return params unchanged when no q filter", () => {
      const params = {
        pagination: { page: 1, perPage: 10 },
        sort: { field: "id", order: "ASC" as const },
        filter: { status: "active" },
      };

      const result = transformQToIlikeSearch(params);

      expect(result).toEqual(params);
    });

    it("should return params unchanged when filter is undefined", () => {
      const params = {
        pagination: { page: 1, perPage: 10 },
        sort: { field: "id", order: "ASC" as const },
        filter: undefined as any,
      };

      const result = transformQToIlikeSearch(params);

      expect(result.filter).toBeUndefined();
    });

    it("should wrap search term with wildcards", () => {
      const params = {
        pagination: { page: 1, perPage: 10 },
        sort: { field: "id", order: "ASC" as const },
        filter: { q: "john" },
      };

      const result = transformQToIlikeSearch(params);

      // Each field should have wildcards
      expect(result.filter["@or"]["name@ilike"]).toBe("%john%");
    });

    it("should handle special characters in search term", () => {
      const params = {
        pagination: { page: 1, perPage: 10 },
        sort: { field: "id", order: "ASC" as const },
        filter: { q: "O'Brien" },
      };

      const result = transformQToIlikeSearch(params);

      // Special characters should be preserved
      expect(result.filter["@or"]["name@ilike"]).toBe("%O'Brien%");
    });
  });

  describe("beforeSave - data transformation", () => {
    it("should strip computed fields before create", async () => {
      const data = {
        first_name: "John",
        last_name: "Doe",
        // Computed fields that shouldn't be sent to database
        full_name: "John Doe",
        organization_name: "Acme Corp",
      };

      const result = await contactsCallbacks.beforeSave!(data, mockDataProvider, "contacts");

      expect(result).not.toHaveProperty("full_name");
      expect(result).not.toHaveProperty("organization_name");
      expect(result.first_name).toBe("John");
      expect(result.last_name).toBe("Doe");
    });

    it("should preserve required fields", async () => {
      const data = {
        first_name: "John",
        last_name: "Doe",
        email: [{ value: "john@example.com", type: "work" }],
        phone: [{ value: "555-1234", type: "home" }],
        tags: [1, 2, 3],
      };

      const result = await contactsCallbacks.beforeSave!(data, mockDataProvider, "contacts");

      expect(result.first_name).toBe("John");
      expect(result.email).toEqual(data.email);
      expect(result.phone).toEqual(data.phone);
      expect(result.tags).toEqual(data.tags);
    });
  });
});
