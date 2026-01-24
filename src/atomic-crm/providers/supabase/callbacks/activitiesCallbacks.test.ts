/**
 * Tests for activitiesCallbacks
 *
 * TDD: These tests define the expected behavior for activities-specific lifecycle callbacks.
 * Activities have relatively simple logic:
 * 1. Soft delete (deleted_at timestamp)
 * 2. Filter cleaning with soft delete exclusion
 * 3. Computed field stripping (contact_name, organization_name from joins)
 */

import { describe, it, expect, vi, beforeEach, type Mock } from "vitest";
import type { DataProvider, RaRecord } from "ra-core";
import type { DeleteParamsWithMeta } from "@/tests/utils/typed-mocks";
import { activitiesCallbacks, COMPUTED_FIELDS } from "./activitiesCallbacks";

describe("activitiesCallbacks", () => {
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
    it("should target the activities resource", () => {
      expect(activitiesCallbacks.resource).toBe("activities");
    });
  });

  describe("beforeDelete - soft delete", () => {
    it("should perform soft delete via update instead of hard delete", async () => {
      const params = {
        id: 1,
        previousData: { id: 1, type: "Call", date: "2024-01-15" } as RaRecord,
      };

      const result = await activitiesCallbacks.beforeDelete!(params, mockDataProvider);

      // Should call update with deleted_at
      expect(mockDataProvider.update).toHaveBeenCalledWith("activities", {
        id: 1,
        data: expect.objectContaining({
          deleted_at: expect.any(String),
        }),
        previousData: params.previousData,
      });

      // Should return modified params to skip actual delete
      expect(result).toHaveProperty("meta");
      const resultWithMeta = result as DeleteParamsWithMeta;
      expect(resultWithMeta.meta?.skipDelete).toBe(true);
    });

    it("should set deleted_at to ISO timestamp", async () => {
      const params = {
        id: 1,
        previousData: { id: 1 } as RaRecord,
      };

      await activitiesCallbacks.beforeDelete!(params, mockDataProvider);

      const updateMock = mockDataProvider.update as Mock;
      const updateCall = updateMock.mock.calls[0];
      const deletedAt = updateCall[1].data.deleted_at;

      // Should be valid ISO string
      expect(new Date(deletedAt).toISOString()).toBe(deletedAt);
    });
  });

  describe("beforeGetList - filter cleaning", () => {
    it("should add soft delete filter by default", async () => {
      const params = {
        pagination: { page: 1, perPage: 10 },
        sort: { field: "date", order: "DESC" as const },
        filter: { type: "Call" },
      };

      const result = await activitiesCallbacks.beforeGetList!(params, mockDataProvider);

      expect(result.filter).toHaveProperty("deleted_at@is", null);
    });

    it("should not add soft delete filter when includeDeleted is true", async () => {
      const params = {
        pagination: { page: 1, perPage: 10 },
        sort: { field: "date", order: "DESC" as const },
        filter: { type: "Call", includeDeleted: true },
      };

      const result = await activitiesCallbacks.beforeGetList!(params, mockDataProvider);

      expect(result.filter).not.toHaveProperty("deleted_at@is");
      // Should strip the includeDeleted flag
      expect(result.filter).not.toHaveProperty("includeDeleted");
    });

    it("should preserve existing filters", async () => {
      const params = {
        pagination: { page: 1, perPage: 10 },
        sort: { field: "date", order: "DESC" as const },
        filter: { type: "Call", opportunity_id: 123, contact_id: 456 },
      };

      const result = await activitiesCallbacks.beforeGetList!(params, mockDataProvider);

      expect(result.filter.type).toBe("Call");
      expect(result.filter.opportunity_id).toBe(123);
      expect(result.filter.contact_id).toBe(456);
    });

    it("should handle empty filter", async () => {
      const params = {
        pagination: { page: 1, perPage: 10 },
        sort: { field: "date", order: "DESC" as const },
        filter: {},
      };

      const result = await activitiesCallbacks.beforeGetList!(params, mockDataProvider);

      expect(result.filter).toHaveProperty("deleted_at@is", null);
    });
  });

  describe("beforeSave - data transformation", () => {
    it("should strip computed fields before save", async () => {
      const data = {
        type: "Call",
        date: "2024-01-15",
        notes: "Discussed pricing",
        opportunity_id: 123,
        // Computed fields from joins/views
        contact_name: "John Doe",
        organization_name: "Acme Corp",
        opportunity_name: "Big Deal",
      };

      const result = await activitiesCallbacks.beforeSave!(data, mockDataProvider, "activities");

      expect(result).not.toHaveProperty("contact_name");
      expect(result).not.toHaveProperty("organization_name");
      expect(result).not.toHaveProperty("opportunity_name");
      expect(result.type).toBe("Call");
      expect(result.notes).toBe("Discussed pricing");
    });

    it("should preserve all activity-specific fields", async () => {
      const data = {
        type: "Meeting",
        date: "2024-01-15T10:00:00Z",
        notes: "Quarterly review",
        opportunity_id: 123,
        contact_id: 456,
        duration_minutes: 60,
        outcome: "positive",
      };

      const result = await activitiesCallbacks.beforeSave!(data, mockDataProvider, "activities");

      expect(result.type).toBe("Meeting");
      expect(result.date).toBe("2024-01-15T10:00:00Z");
      expect(result.opportunity_id).toBe(123);
      expect(result.contact_id).toBe(456);
      expect(result.duration_minutes).toBe(60);
      expect(result.outcome).toBe("positive");
    });

    it("should handle data with no computed fields", async () => {
      const data = {
        type: "Email",
        date: "2024-01-15",
        notes: "Follow-up",
      };

      const result = await activitiesCallbacks.beforeSave!(data, mockDataProvider, "activities");

      expect(result).toEqual(data);
    });
  });

  describe("computed fields constant", () => {
    it("should export COMPUTED_FIELDS for reference", () => {
      expect(COMPUTED_FIELDS).toContain("contact_name");
      expect(COMPUTED_FIELDS).toContain("organization_name");
      expect(COMPUTED_FIELDS).toContain("opportunity_name");
    });
  });

  describe("beforeSave - sample status preservation", () => {
    it("should add type=sample when sample_status is provided but type is missing", async () => {
      // This handles partial updates where only sample_status is changed
      const data = {
        id: 1,
        sample_status: "received",
        // type is NOT provided - simulating partial update
      };

      const result = await activitiesCallbacks.beforeSave!(data, mockDataProvider, "activities");

      expect(result.type).toBe("sample");
      expect(result.sample_status).toBe("received");
    });

    it("should preserve existing type when sample_status is provided", async () => {
      // When both type and sample_status are provided, preserve the type
      const data = {
        id: 1,
        type: "sample",
        sample_status: "feedback_pending",
      };

      const result = await activitiesCallbacks.beforeSave!(data, mockDataProvider, "activities");

      expect(result.type).toBe("sample");
      expect(result.sample_status).toBe("feedback_pending");
    });

    it("should not modify type when sample_status is not provided", async () => {
      // Regular activity update without sample_status
      const data = {
        id: 1,
        type: "call",
        subject: "Updated subject",
      };

      const result = await activitiesCallbacks.beforeSave!(data, mockDataProvider, "activities");

      expect(result.type).toBe("call");
      expect(result).not.toHaveProperty("sample_status");
    });

    it("should handle sample_status set to null explicitly", async () => {
      // When clearing sample_status (e.g., changing from sample to non-sample type)
      // type should NOT be auto-set to sample because null !== undefined
      const data = {
        id: 1,
        sample_status: null,
        type: "call",
      };

      const result = await activitiesCallbacks.beforeSave!(data, mockDataProvider, "activities");

      expect(result.type).toBe("call");
      expect(result.sample_status).toBeNull();
    });
  });
});
