/**
 * Tests for .max() constraints on ui-props validation schemas
 * Focus: DoS prevention via unbounded record keys
 */

import { describe, it, expect } from "vitest";
import { tabComponentPropsSchema } from "../ui-props";
import { z } from "zod";

describe("UI Props .max() Constraints", () => {
  describe("tabComponentPropsSchema - record keys", () => {
    it("should accept record with keys at max length (50 chars)", () => {
      const validProps = {
        record: {
          ["a".repeat(50)]: "value",
        },
        mode: "view" as const,
        isActiveTab: true,
      };
      expect(() => tabComponentPropsSchema.parse(validProps)).not.toThrow();
    });

    it("should reject record with key over max length (51 chars)", () => {
      const invalidProps = {
        record: {
          ["a".repeat(51)]: "value",
        },
        mode: "view" as const,
        isActiveTab: true,
      };
      expect(() => tabComponentPropsSchema.parse(invalidProps)).toThrow(z.ZodError);
    });
  });
});
