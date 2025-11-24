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
import { contactsCallbacks } from "./contactsCallbacks";

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

  describe("beforeDelete - soft delete", () => {
    it("should convert delete to soft delete by setting deleted_at", async () => {
      const params = {
        id: 1,
        previousData: { id: 1, first_name: "John" } as RaRecord,
      };

      const result = await contactsCallbacks.beforeDelete!(params, mockDataProvider);

      // Should call update instead of delete
      expect(mockDataProvider.update).toHaveBeenCalledWith("contacts", {
        id: 1,
        data: { deleted_at: expect.any(String) },
        previousData: params.previousData,
      });

      // Should return modified params that prevent actual delete
      expect(result).toHaveProperty("meta");
      expect((result as any).meta.skipDelete).toBe(true);
    });

    it("should set deleted_at to ISO timestamp", async () => {
      const params = {
        id: 1,
        previousData: { id: 1, first_name: "John" } as RaRecord,
      };

      await contactsCallbacks.beforeDelete!(params, mockDataProvider);

      const updateCall = (mockDataProvider.update as any).mock.calls[0];
      const deletedAt = updateCall[1].data.deleted_at;

      // Should be a valid ISO timestamp
      expect(new Date(deletedAt).toISOString()).toBe(deletedAt);
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
      const emailArray = [{ email: "john@example.com", type: "Work" }];
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
        email: [{ email: "john@example.com", type: "Work" }],
        phone: [{ phone: "555-1234", type: "Mobile" }],
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
