/**
 * Tests for timelineHandler
 *
 * Tests the read-only handler for entity_timeline view:
 * 1. Requires entity filter (contact_id, organization_id, or opportunity_id)
 * 2. Supports entry_type filter for filtering by activity/task
 * 3. Respects sorting and pagination params
 * 4. Throws HttpError for write operations (view is read-only)
 *
 * Engineering Constitution: Read-only view tests focus on query building
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import type { DataProvider, GetListParams } from "react-admin";
import { HttpError } from "react-admin";

// Use vi.hoisted to define mock before vi.mock (hoisting issues)
const { mockFrom, mockQueryBuilder } = vi.hoisted(() => {
  const mockBuilder = {
    select: vi.fn(),
    eq: vi.fn(),
    or: vi.fn(),
    in: vi.fn(),
    gte: vi.fn(),
    lte: vi.fn(),
    order: vi.fn(),
    range: vi.fn(),
  };

  // Default: chain all methods to return builder
  mockBuilder.select.mockReturnValue(mockBuilder);
  mockBuilder.eq.mockReturnValue(mockBuilder);
  mockBuilder.or.mockReturnValue(mockBuilder);
  mockBuilder.in.mockReturnValue(mockBuilder);
  mockBuilder.gte.mockReturnValue(mockBuilder);
  mockBuilder.lte.mockReturnValue(mockBuilder);
  mockBuilder.order.mockReturnValue(mockBuilder);
  mockBuilder.range.mockResolvedValue({ data: [], error: null, count: 0 });

  return {
    mockFrom: vi.fn().mockReturnValue(mockBuilder),
    mockQueryBuilder: mockBuilder,
  };
});

// Mock supabase client
vi.mock("../../supabase", () => ({
  supabase: {
    from: mockFrom,
  },
}));

// Import handler after mocking
import { createTimelineHandler } from "../timelineHandler";

describe("createTimelineHandler", () => {
  let mockBaseProvider: DataProvider;
  let handler: DataProvider;

  beforeEach(() => {
    vi.clearAllMocks();

    // Restore mockFrom to return mockQueryBuilder (reset clears this)
    mockFrom.mockReturnValue(mockQueryBuilder);

    // Reset query builder mocks to default chain behavior
    mockQueryBuilder.select.mockReturnValue(mockQueryBuilder);
    mockQueryBuilder.eq.mockReturnValue(mockQueryBuilder);
    mockQueryBuilder.or.mockReturnValue(mockQueryBuilder);
    mockQueryBuilder.in.mockReturnValue(mockQueryBuilder);
    mockQueryBuilder.gte.mockReturnValue(mockQueryBuilder);
    mockQueryBuilder.lte.mockReturnValue(mockQueryBuilder);
    mockQueryBuilder.order.mockReturnValue(mockQueryBuilder);
    mockQueryBuilder.range.mockResolvedValue({ data: [], error: null, count: 0 });

    // Base provider is unused for timeline (read-only view)
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

    handler = createTimelineHandler(mockBaseProvider);
  });

  describe("getList() - entity filtering", () => {
    it("should filter by contact_id when provided", async () => {
      const params: GetListParams = {
        pagination: { page: 1, perPage: 25 },
        sort: { field: "entry_date", order: "DESC" },
        filter: { contact_id: 123 },
      };

      await handler.getList("entity_timeline", params);

      expect(mockFrom).toHaveBeenCalledWith("entity_timeline");
      expect(mockQueryBuilder.select).toHaveBeenCalledWith("*", { count: "exact" });
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith("contact_id", 123);
    });

    it("should filter by organization_id when provided", async () => {
      const params: GetListParams = {
        pagination: { page: 1, perPage: 25 },
        sort: { field: "entry_date", order: "DESC" },
        filter: { organization_id: 456 },
      };

      await handler.getList("entity_timeline", params);

      expect(mockFrom).toHaveBeenCalledWith("entity_timeline");
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith("organization_id", 456);
    });

    it("should filter by opportunity_id when provided", async () => {
      const params: GetListParams = {
        pagination: { page: 1, perPage: 25 },
        sort: { field: "entry_date", order: "DESC" },
        filter: { opportunity_id: 789 },
      };

      await handler.getList("entity_timeline", params);

      expect(mockFrom).toHaveBeenCalledWith("entity_timeline");
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith("opportunity_id", 789);
    });

    it("should use .or() when multiple entity filters are provided", async () => {
      const params: GetListParams = {
        pagination: { page: 1, perPage: 25 },
        sort: { field: "entry_date", order: "DESC" },
        filter: { contact_id: 123, organization_id: 456 },
      };

      await handler.getList("entity_timeline", params);

      // Multiple entity filters use .or() instead of multiple .eq() calls
      expect(mockQueryBuilder.or).toHaveBeenCalledWith("contact_id.eq.123,organization_id.eq.456");
      // .eq() should NOT be called for entity filters when using .or()
      expect(mockQueryBuilder.eq).not.toHaveBeenCalledWith("contact_id", 123);
      expect(mockQueryBuilder.eq).not.toHaveBeenCalledWith("organization_id", 456);
    });

    it("should support @or filter with multiple entities", async () => {
      const params: GetListParams = {
        pagination: { page: 1, perPage: 25 },
        sort: { field: "entry_date", order: "DESC" },
        filter: { "@or": { contact_id: 123, organization_id: 456 } },
      };

      await handler.getList("entity_timeline", params);

      // @or filter uses .or() method
      expect(mockQueryBuilder.or).toHaveBeenCalledWith("contact_id.eq.123,organization_id.eq.456");
    });
  });

  describe("getList() - entry_type filtering", () => {
    it("should filter by entry_type when provided with entity filter", async () => {
      const params: GetListParams = {
        pagination: { page: 1, perPage: 25 },
        sort: { field: "entry_date", order: "DESC" },
        filter: { contact_id: 123, entry_type: "activity" },
      };

      await handler.getList("entity_timeline", params);

      expect(mockQueryBuilder.eq).toHaveBeenCalledWith("contact_id", 123);
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith("entry_type", "activity");
    });

    it("should filter by entry_type 'task' when provided", async () => {
      const params: GetListParams = {
        pagination: { page: 1, perPage: 25 },
        sort: { field: "entry_date", order: "DESC" },
        filter: { organization_id: 456, entry_type: "task" },
      };

      await handler.getList("entity_timeline", params);

      expect(mockQueryBuilder.eq).toHaveBeenCalledWith("organization_id", 456);
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith("entry_type", "task");
    });
  });

  describe("getList() - type (interaction_type) filtering", () => {
    it("should filter by type array using .in() on subtype column", async () => {
      const params: GetListParams = {
        pagination: { page: 1, perPage: 25 },
        sort: { field: "entry_date", order: "DESC" },
        filter: { contact_id: 123, type: ["call", "email"] },
      };

      await handler.getList("entity_timeline", params);

      expect(mockQueryBuilder.in).toHaveBeenCalledWith("subtype", ["call", "email"]);
    });

    it("should handle single type value by wrapping in array", async () => {
      const params: GetListParams = {
        pagination: { page: 1, perPage: 25 },
        sort: { field: "entry_date", order: "DESC" },
        filter: { contact_id: 123, type: "call" },
      };

      await handler.getList("entity_timeline", params);

      expect(mockQueryBuilder.in).toHaveBeenCalledWith("subtype", ["call"]);
    });
  });

  describe("getList() - date range filtering", () => {
    it("should filter by activity_date_gte using .gte() on entry_date", async () => {
      const params: GetListParams = {
        pagination: { page: 1, perPage: 25 },
        sort: { field: "entry_date", order: "DESC" },
        filter: { contact_id: 123, activity_date_gte: "2025-01-01" },
      };

      await handler.getList("entity_timeline", params);

      expect(mockQueryBuilder.gte).toHaveBeenCalledWith("entry_date", "2025-01-01");
    });

    it("should filter by activity_date_lte using .lte() on entry_date", async () => {
      const params: GetListParams = {
        pagination: { page: 1, perPage: 25 },
        sort: { field: "entry_date", order: "DESC" },
        filter: { contact_id: 123, activity_date_lte: "2025-12-31" },
      };

      await handler.getList("entity_timeline", params);

      expect(mockQueryBuilder.lte).toHaveBeenCalledWith("entry_date", "2025-12-31");
    });

    it("should apply both date range filters when provided", async () => {
      const params: GetListParams = {
        pagination: { page: 1, perPage: 25 },
        sort: { field: "entry_date", order: "DESC" },
        filter: {
          contact_id: 123,
          activity_date_gte: "2025-01-01",
          activity_date_lte: "2025-12-31",
        },
      };

      await handler.getList("entity_timeline", params);

      expect(mockQueryBuilder.gte).toHaveBeenCalledWith("entry_date", "2025-01-01");
      expect(mockQueryBuilder.lte).toHaveBeenCalledWith("entry_date", "2025-12-31");
    });
  });

  describe("getList() - created_by filtering", () => {
    it("should filter by created_by array using .in()", async () => {
      const params: GetListParams = {
        pagination: { page: 1, perPage: 25 },
        sort: { field: "entry_date", order: "DESC" },
        filter: { contact_id: 123, created_by: [1, 2, 3] },
      };

      await handler.getList("entity_timeline", params);

      expect(mockQueryBuilder.in).toHaveBeenCalledWith("created_by", [1, 2, 3]);
    });

    it("should handle single created_by value by wrapping in array", async () => {
      const params: GetListParams = {
        pagination: { page: 1, perPage: 25 },
        sort: { field: "entry_date", order: "DESC" },
        filter: { contact_id: 123, created_by: 42 },
      };

      await handler.getList("entity_timeline", params);

      expect(mockQueryBuilder.in).toHaveBeenCalledWith("created_by", [42]);
    });
  });

  describe("getList() - subtype filtering (stage_change)", () => {
    it("should filter by subtype using .eq()", async () => {
      const params: GetListParams = {
        pagination: { page: 1, perPage: 25 },
        sort: { field: "entry_date", order: "DESC" },
        filter: { contact_id: 123, subtype: "stage_change" },
      };

      await handler.getList("entity_timeline", params);

      expect(mockQueryBuilder.eq).toHaveBeenCalledWith("subtype", "stage_change");
    });
  });

  describe("getList() - sorting", () => {
    it("should sort by entry_date DESC by default", async () => {
      const params: GetListParams = {
        pagination: { page: 1, perPage: 25 },
        sort: { field: "entry_date", order: "DESC" },
        filter: { contact_id: 123 },
      };

      await handler.getList("entity_timeline", params);

      expect(mockQueryBuilder.order).toHaveBeenCalledWith("entry_date", { ascending: false });
    });

    it("should sort ASC when sort.order is ASC", async () => {
      const params: GetListParams = {
        pagination: { page: 1, perPage: 25 },
        sort: { field: "entry_date", order: "ASC" },
        filter: { contact_id: 123 },
      };

      await handler.getList("entity_timeline", params);

      expect(mockQueryBuilder.order).toHaveBeenCalledWith("entry_date", { ascending: true });
    });

    it("should respect custom sort field", async () => {
      const params: GetListParams = {
        pagination: { page: 1, perPage: 25 },
        sort: { field: "created_at", order: "DESC" },
        filter: { contact_id: 123 },
      };

      await handler.getList("entity_timeline", params);

      expect(mockQueryBuilder.order).toHaveBeenCalledWith("created_at", { ascending: false });
    });

    it("should default to entry_date when sort.field is not provided", async () => {
      const params: GetListParams = {
        pagination: { page: 1, perPage: 25 },
        sort: { field: "", order: "DESC" },
        filter: { contact_id: 123 },
      };

      await handler.getList("entity_timeline", params);

      // Empty string is falsy, so defaults to "entry_date"
      expect(mockQueryBuilder.order).toHaveBeenCalledWith("entry_date", { ascending: false });
    });

    it("should apply secondary sort by id for pagination stability", async () => {
      const params: GetListParams = {
        pagination: { page: 1, perPage: 25 },
        sort: { field: "entry_date", order: "DESC" },
        filter: { contact_id: 123 },
      };

      await handler.getList("entity_timeline", params);

      // Primary sort: entry_date DESC
      expect(mockQueryBuilder.order).toHaveBeenCalledWith("entry_date", { ascending: false });
      // Secondary sort: id DESC (tie-breaker for stable pagination)
      expect(mockQueryBuilder.order).toHaveBeenCalledWith("id", { ascending: false });
    });
  });

  describe("getList() - pagination", () => {
    it("should calculate correct range for page 1", async () => {
      const params: GetListParams = {
        pagination: { page: 1, perPage: 25 },
        sort: { field: "entry_date", order: "DESC" },
        filter: { contact_id: 123 },
      };

      await handler.getList("entity_timeline", params);

      // Page 1, perPage 25 → range(0, 24)
      expect(mockQueryBuilder.range).toHaveBeenCalledWith(0, 24);
    });

    it("should calculate correct range for page 2", async () => {
      const params: GetListParams = {
        pagination: { page: 2, perPage: 25 },
        sort: { field: "entry_date", order: "DESC" },
        filter: { contact_id: 123 },
      };

      await handler.getList("entity_timeline", params);

      // Page 2, perPage 25 → range(25, 49)
      expect(mockQueryBuilder.range).toHaveBeenCalledWith(25, 49);
    });

    it("should calculate correct range for custom perPage", async () => {
      const params: GetListParams = {
        pagination: { page: 1, perPage: 10 },
        sort: { field: "entry_date", order: "DESC" },
        filter: { contact_id: 123 },
      };

      await handler.getList("entity_timeline", params);

      // Page 1, perPage 10 → range(0, 9)
      expect(mockQueryBuilder.range).toHaveBeenCalledWith(0, 9);
    });

    it("should use default pagination when not provided", async () => {
      const params: GetListParams = {
        pagination: undefined as unknown as { page: number; perPage: number },
        sort: { field: "entry_date", order: "DESC" },
        filter: { contact_id: 123 },
      };

      await handler.getList("entity_timeline", params);

      // Default: page 1, perPage 25 → range(0, 24)
      expect(mockQueryBuilder.range).toHaveBeenCalledWith(0, 24);
    });
  });

  describe("getList() - response handling", () => {
    it("should return data and total from Supabase response", async () => {
      const mockData = [
        {
          id: 1,
          entry_type: "activity",
          subtype: "call",
          title: "Phone call",
          entry_date: "2025-01-01T10:00:00Z",
          contact_id: 123,
          created_at: "2025-01-01T10:00:00Z",
        },
        {
          id: 2,
          entry_type: "task",
          subtype: "follow_up",
          title: "Follow up task",
          entry_date: "2025-01-02T10:00:00Z",
          contact_id: 123,
          created_at: "2025-01-02T10:00:00Z",
        },
      ];

      mockQueryBuilder.range.mockResolvedValueOnce({
        data: mockData,
        error: null,
        count: 2,
      });

      const params: GetListParams = {
        pagination: { page: 1, perPage: 25 },
        sort: { field: "entry_date", order: "DESC" },
        filter: { contact_id: 123 },
      };

      const result = await handler.getList("entity_timeline", params);

      expect(result.data).toEqual(mockData);
      expect(result.total).toBe(2);
    });

    it("should return empty array and zero total when no data", async () => {
      mockQueryBuilder.range.mockResolvedValueOnce({
        data: null,
        error: null,
        count: 0,
      });

      const params: GetListParams = {
        pagination: { page: 1, perPage: 25 },
        sort: { field: "entry_date", order: "DESC" },
        filter: { contact_id: 123 },
      };

      const result = await handler.getList("entity_timeline", params);

      expect(result.data).toEqual([]);
      expect(result.total).toBe(0);
    });

    it("should throw HttpError 500 when Supabase returns error", async () => {
      // Mock error response for both assertions (each await creates a new call)
      mockQueryBuilder.range
        .mockResolvedValueOnce({
          data: null,
          error: { message: "Database connection failed" },
          count: null,
        })
        .mockResolvedValueOnce({
          data: null,
          error: { message: "Database connection failed" },
          count: null,
        });

      const params: GetListParams = {
        pagination: { page: 1, perPage: 25 },
        sort: { field: "entry_date", order: "DESC" },
        filter: { contact_id: 123 },
      };

      await expect(handler.getList("entity_timeline", params)).rejects.toThrow(HttpError);
      await expect(handler.getList("entity_timeline", params)).rejects.toThrow(
        "Database connection failed"
      );
    });
  });

  describe("getList() - fail-closed guard (no entity filter)", () => {
    it("should throw HttpError 400 when no entity filter is provided", async () => {
      const params: GetListParams = {
        pagination: { page: 1, perPage: 25 },
        sort: { field: "entry_date", order: "DESC" },
        filter: {},
      };

      await expect(handler.getList("entity_timeline", params)).rejects.toThrow(HttpError);
      await expect(handler.getList("entity_timeline", params)).rejects.toThrow(
        "Timeline requires contact_id, organization_id, or opportunity_id filter"
      );
    });

    it("should throw HttpError 400 when only entry_type filter is provided (no entity)", async () => {
      const params: GetListParams = {
        pagination: { page: 1, perPage: 25 },
        sort: { field: "entry_date", order: "DESC" },
        filter: { entry_type: "activity" },
      };

      await expect(handler.getList("entity_timeline", params)).rejects.toThrow(HttpError);
      await expect(handler.getList("entity_timeline", params)).rejects.toThrow(
        "Timeline requires contact_id, organization_id, or opportunity_id filter"
      );
    });
  });

  describe("read-only enforcement", () => {
    it("should throw HttpError 400 for getOne", async () => {
      await expect(handler.getOne("entity_timeline", { id: 1 })).rejects.toThrow(HttpError);
      await expect(handler.getOne("entity_timeline", { id: 1 })).rejects.toThrow(
        "Timeline entries cannot be fetched individually"
      );
    });

    it("should throw HttpError 400 for getMany", async () => {
      await expect(handler.getMany("entity_timeline", { ids: [1, 2] })).rejects.toThrow(HttpError);
      await expect(handler.getMany("entity_timeline", { ids: [1, 2] })).rejects.toThrow(
        "Timeline does not support getMany"
      );
    });

    it("should throw HttpError 400 for getManyReference", async () => {
      await expect(
        handler.getManyReference("entity_timeline", {
          target: "contact_id",
          id: 1,
          pagination: { page: 1, perPage: 10 },
          sort: { field: "id", order: "ASC" },
          filter: {},
        })
      ).rejects.toThrow(HttpError);
    });

    it("should throw HttpError 400 for create", async () => {
      await expect(handler.create("entity_timeline", { data: { title: "Test" } })).rejects.toThrow(
        HttpError
      );
      await expect(handler.create("entity_timeline", { data: { title: "Test" } })).rejects.toThrow(
        "Timeline is read-only. Create activities or tasks directly."
      );
    });

    it("should throw HttpError 400 for update", async () => {
      await expect(
        handler.update("entity_timeline", {
          id: 1,
          data: { title: "Updated" },
          previousData: { id: 1, title: "Original" },
        })
      ).rejects.toThrow(HttpError);
      await expect(
        handler.update("entity_timeline", {
          id: 1,
          data: { title: "Updated" },
          previousData: { id: 1, title: "Original" },
        })
      ).rejects.toThrow("Timeline is read-only. Update activities or tasks directly.");
    });

    it("should throw HttpError 400 for updateMany", async () => {
      await expect(
        handler.updateMany("entity_timeline", { ids: [1, 2], data: { title: "Updated" } })
      ).rejects.toThrow(HttpError);
      await expect(
        handler.updateMany("entity_timeline", { ids: [1, 2], data: { title: "Updated" } })
      ).rejects.toThrow("Timeline is read-only.");
    });

    it("should throw HttpError 400 for delete", async () => {
      await expect(
        handler.delete("entity_timeline", { id: 1, previousData: { id: 1 } })
      ).rejects.toThrow(HttpError);
      await expect(
        handler.delete("entity_timeline", { id: 1, previousData: { id: 1 } })
      ).rejects.toThrow("Timeline is read-only. Delete activities or tasks directly.");
    });

    it("should throw HttpError 400 for deleteMany", async () => {
      await expect(handler.deleteMany("entity_timeline", { ids: [1, 2] })).rejects.toThrow(
        HttpError
      );
      await expect(handler.deleteMany("entity_timeline", { ids: [1, 2] })).rejects.toThrow(
        "Timeline is read-only."
      );
    });
  });

  describe("base provider isolation", () => {
    it("should not call base provider for any operations", async () => {
      const params: GetListParams = {
        pagination: { page: 1, perPage: 25 },
        sort: { field: "entry_date", order: "DESC" },
        filter: { contact_id: 123 },
      };

      await handler.getList("entity_timeline", params);

      // Base provider should never be called - timeline queries Supabase directly
      expect(mockBaseProvider.getList).not.toHaveBeenCalled();
      expect(mockBaseProvider.getOne).not.toHaveBeenCalled();
      expect(mockBaseProvider.getMany).not.toHaveBeenCalled();
      expect(mockBaseProvider.getManyReference).not.toHaveBeenCalled();
      expect(mockBaseProvider.create).not.toHaveBeenCalled();
      expect(mockBaseProvider.update).not.toHaveBeenCalled();
      expect(mockBaseProvider.delete).not.toHaveBeenCalled();
    });
  });
});
