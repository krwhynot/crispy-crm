import { describe, it, expect } from "vitest";
import {
  INTERACTION_TYPE_OPTIONS,
  QUICK_ADD_INTERACTION_TYPES,
  SAMPLE_STATUS_OPTIONS,
} from "../constants";

describe("Activity Constants - Quick Add Filtering", () => {
  describe("QUICK_ADD_INTERACTION_TYPES", () => {
    it("should exclude Sample type (requires sample_status, follow_up_required, follow_up_date)", () => {
      const typeValues = QUICK_ADD_INTERACTION_TYPES.map((opt) => opt.value);
      expect(typeValues).not.toContain("sample");
    });

    it("should exclude Administrative type (task type, not quick activity)", () => {
      const typeValues = QUICK_ADD_INTERACTION_TYPES.map((opt) => opt.value);
      expect(typeValues).not.toContain("administrative");
    });

    it("should exclude Other type (task type, not quick activity)", () => {
      const typeValues = QUICK_ADD_INTERACTION_TYPES.map((opt) => opt.value);
      expect(typeValues).not.toContain("other");
    });

    it("should include standard interaction types suitable for quick add", () => {
      const typeValues = QUICK_ADD_INTERACTION_TYPES.map((opt) => opt.value);

      expect(typeValues).toContain("call");
      expect(typeValues).toContain("email");
      expect(typeValues).toContain("meeting");
      expect(typeValues).toContain("demo");
      expect(typeValues).toContain("proposal");
      expect(typeValues).toContain("follow_up");
      expect(typeValues).toContain("trade_show");
      expect(typeValues).toContain("site_visit");
      expect(typeValues).toContain("contract_review");
      expect(typeValues).toContain("check_in");
      expect(typeValues).toContain("social");
      expect(typeValues).toContain("note");
    });

    it("should have exactly 12 types (15 total - 3 excluded)", () => {
      expect(QUICK_ADD_INTERACTION_TYPES).toHaveLength(12);
    });

    it("should maintain same structure as INTERACTION_TYPE_OPTIONS (value/label)", () => {
      QUICK_ADD_INTERACTION_TYPES.forEach((option) => {
        expect(option).toHaveProperty("value");
        expect(option).toHaveProperty("label");
        expect(typeof option.value).toBe("string");
        expect(typeof option.label).toBe("string");
      });
    });

    it("should be a subset of INTERACTION_TYPE_OPTIONS", () => {
      const allTypeValues = INTERACTION_TYPE_OPTIONS.map((opt) => opt.value);
      const quickAddValues = QUICK_ADD_INTERACTION_TYPES.map((opt) => opt.value);

      quickAddValues.forEach((value) => {
        expect(allTypeValues).toContain(value);
      });
    });
  });

  describe("INTERACTION_TYPE_OPTIONS (full list)", () => {
    it("should have all 15 interaction types including Sample, Administrative, Other", () => {
      expect(INTERACTION_TYPE_OPTIONS).toHaveLength(15);

      const typeValues = INTERACTION_TYPE_OPTIONS.map((opt) => opt.value);
      expect(typeValues).toContain("sample");
      expect(typeValues).toContain("administrative");
      expect(typeValues).toContain("other");
    });
  });

  describe("SAMPLE_STATUS_OPTIONS", () => {
    it("should have 4 sample status options", () => {
      expect(SAMPLE_STATUS_OPTIONS).toHaveLength(4);
    });

    it("should include sent, received, feedback_pending, feedback_received", () => {
      const statusValues = SAMPLE_STATUS_OPTIONS.map((opt) => opt.value);
      expect(statusValues).toContain("sent");
      expect(statusValues).toContain("received");
      expect(statusValues).toContain("feedback_pending");
      expect(statusValues).toContain("feedback_received");
    });
  });
});
