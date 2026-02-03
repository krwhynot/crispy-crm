import { describe, it, expect, beforeEach, vi } from "vitest";
import { SegmentsService } from "../segments.service";
import {
  PLAYBOOK_CATEGORIES,
  PLAYBOOK_CATEGORY_IDS,
  PLAYBOOK_CATEGORY_CHOICES,
} from "../../validation/segments";
import {
  OPERATOR_SEGMENT_IDS,
  OPERATOR_PARENT_SEGMENTS,
  OPERATOR_CHILD_SEGMENTS,
} from "../../validation/operatorSegments";
import type { ExtendedDataProvider } from "../../providers/supabase/extensions/types";
import { createMockDataProvider } from "@/tests/utils/mock-providers";

describe("SegmentsService", () => {
  let service: SegmentsService;
  let mockDataProvider: ExtendedDataProvider;

  beforeEach(() => {
    const baseProvider = createMockDataProvider();
    mockDataProvider = {
      ...baseProvider,
      rpc: vi.fn(),
    } as ExtendedDataProvider;

    service = new SegmentsService(mockDataProvider);
  });

  describe("getSegmentByName", () => {
    it("should return segment for valid Playbook category (exact match)", () => {
      const result = service.getSegmentByName("Major Broadline");

      expect(result).toBeDefined();
      expect(result?.name).toBe("Major Broadline");
      expect(result?.id).toBe(PLAYBOOK_CATEGORY_IDS["Major Broadline"]);
    });

    it("should return segment for valid category (case-insensitive)", () => {
      const result = service.getSegmentByName("major broadline");

      expect(result).toBeDefined();
      expect(result?.name).toBe("Major Broadline");
    });

    it("should return undefined for invalid category", () => {
      const result = service.getSegmentByName("Invalid Category");

      expect(result).toBeUndefined();
    });

    it("should trim whitespace from input", () => {
      const result = service.getSegmentByName("  University  ");

      expect(result).toBeDefined();
      expect(result?.name).toBe("University");
    });

    it("should handle all 9 Playbook categories", () => {
      PLAYBOOK_CATEGORIES.forEach((category) => {
        const result = service.getSegmentByName(category);
        expect(result).toBeDefined();
        expect(result?.name).toBe(category);
        expect(result?.id).toBe(PLAYBOOK_CATEGORY_IDS[category]);
      });
    });
  });

  describe("getSegmentById", () => {
    it("should return segment for valid UUID", () => {
      const id = PLAYBOOK_CATEGORY_IDS["GPO"];
      const result = service.getSegmentById(id);

      expect(result).toBeDefined();
      expect(result?.id).toBe(id);
      expect(result?.name).toBe("GPO");
    });

    it("should return undefined for invalid UUID", () => {
      const result = service.getSegmentById("00000000-0000-0000-0000-000000000000");

      expect(result).toBeUndefined();
    });

    it("should handle all 9 category IDs", () => {
      Object.entries(PLAYBOOK_CATEGORY_IDS).forEach(([name, id]) => {
        const result = service.getSegmentById(id);
        expect(result).toBeDefined();
        expect(result?.id).toBe(id);
        expect(result?.name).toBe(name);
      });
    });

    it("should resolve operator parent segment IDs", () => {
      for (const name of OPERATOR_PARENT_SEGMENTS) {
        const id = OPERATOR_SEGMENT_IDS[name];
        const result = service.getSegmentById(id);
        expect(result).toBeDefined();
        expect(result?.id).toBe(id);
        expect(result?.name).toBe(name);
      }
    });

    it("should resolve operator child segment IDs", () => {
      for (const name of OPERATOR_CHILD_SEGMENTS) {
        const id = OPERATOR_SEGMENT_IDS[name];
        const result = service.getSegmentById(id);
        expect(result).toBeDefined();
        expect(result?.id).toBe(id);
        expect(result?.name).toBe(name);
      }
    });

    it("should return undefined for truly unknown IDs", () => {
      const result = service.getSegmentById("99999999-9999-4999-8999-000000000001");
      expect(result).toBeUndefined();
    });
  });

  describe("getAllCategories", () => {
    it("should return all Playbook categories", () => {
      const result = service.getAllCategories();

      expect(result).toHaveLength(PLAYBOOK_CATEGORY_CHOICES.length);
      expect(result).toEqual(PLAYBOOK_CATEGORY_CHOICES);
    });

    it("should include expected categories", () => {
      const result = service.getAllCategories();
      const names = result.map((c) => c.name);

      expect(names).toContain("Major Broadline");
      expect(names).toContain("Specialty/Regional");
      expect(names).toContain("Management Company");
      expect(names).toContain("GPO");
      expect(names).toContain("University");
      expect(names).toContain("Restaurant Group");
      expect(names).toContain("Chain Restaurant");
      expect(names).toContain("Hotel & Aviation");
      expect(names).toContain("Unknown");
    });
  });

  describe("isValidCategory", () => {
    it("should return true for valid category", () => {
      expect(service.isValidCategory("Major Broadline")).toBe(true);
      expect(service.isValidCategory("Unknown")).toBe(true);
    });

    it("should return false for invalid category", () => {
      expect(service.isValidCategory("Not A Category")).toBe(false);
      expect(service.isValidCategory("")).toBe(false);
    });
  });

  describe("getDefaultCategory", () => {
    it("should return Unknown category", () => {
      const result = service.getDefaultCategory();

      expect(result.name).toBe("Unknown");
      expect(result.id).toBe(PLAYBOOK_CATEGORY_IDS["Unknown"]);
    });
  });

  describe("getOrCreateSegment (legacy)", () => {
    it("should return segment for valid category", async () => {
      const result = await service.getOrCreateSegment("Hotel & Aviation");

      expect(result.name).toBe("Hotel & Aviation");
      expect(result.id).toBe(PLAYBOOK_CATEGORY_IDS["Hotel & Aviation"]);
    });

    it("should return Unknown for invalid category (no creation)", async () => {
      const result = await service.getOrCreateSegment("Invalid Category");

      expect(result.name).toBe("Unknown");
      expect(result.id).toBe(PLAYBOOK_CATEGORY_IDS["Unknown"]);
    });

    it("should handle case-insensitive lookup", async () => {
      const result = await service.getOrCreateSegment("restaurant group");

      expect(result.name).toBe("Restaurant Group");
    });

    it("should NOT call dataProvider.rpc (no dynamic creation)", async () => {
      await service.getOrCreateSegment("University");

      expect(mockDataProvider.rpc).not.toHaveBeenCalled();
    });
  });

  describe("Playbook Category Constants", () => {
    it("should have matching categories count", () => {
      expect(PLAYBOOK_CATEGORIES.length).toBeGreaterThanOrEqual(9);
    });

    it("should have matching IDs for all categories", () => {
      expect(Object.keys(PLAYBOOK_CATEGORY_IDS)).toHaveLength(PLAYBOOK_CATEGORIES.length);

      PLAYBOOK_CATEGORIES.forEach((cat) => {
        expect(PLAYBOOK_CATEGORY_IDS[cat]).toBeDefined();
        expect(PLAYBOOK_CATEGORY_IDS[cat]).toMatch(/^22222222-2222-4222-8222-0000000000\d{2}$/);
      });
    });

    it("should have choices for UI with id and name", () => {
      PLAYBOOK_CATEGORY_CHOICES.forEach((choice) => {
        expect(choice.id).toBeDefined();
        expect(choice.name).toBeDefined();
        expect(typeof choice.id).toBe("string");
        expect(typeof choice.name).toBe("string");
      });
    });
  });
});
