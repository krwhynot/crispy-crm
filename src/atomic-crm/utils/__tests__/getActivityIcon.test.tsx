/**
 * getActivityIcon Tests
 * Tests for activity type to icon mapping utility
 *
 * Test Coverage:
 * - All activity types (Call, Email, Meeting, Note)
 * - Unknown/unmapped activity types
 * - Case insensitivity
 * - Default fallback behavior
 */

import { describe, it, expect } from "vitest";
import { Phone, Mail, Users, FileText } from "lucide-react";
import { getActivityIcon } from "../getActivityIcon";

describe("getActivityIcon", () => {
  describe("known activity types", () => {
    it("should return Phone icon for 'Call'", () => {
      expect(getActivityIcon("Call")).toBe(Phone);
    });

    it("should return Mail icon for 'Email'", () => {
      expect(getActivityIcon("Email")).toBe(Mail);
    });

    it("should return Users icon for 'Meeting'", () => {
      expect(getActivityIcon("Meeting")).toBe(Users);
    });

    it("should return FileText icon for 'Note'", () => {
      expect(getActivityIcon("Note")).toBe(FileText);
    });
  });

  describe("case insensitivity", () => {
    it("should handle lowercase 'call'", () => {
      expect(getActivityIcon("call")).toBe(Phone);
    });

    it("should handle uppercase 'EMAIL'", () => {
      expect(getActivityIcon("EMAIL")).toBe(Mail);
    });

    it("should handle mixed case 'MeEtInG'", () => {
      expect(getActivityIcon("MeEtInG")).toBe(Users);
    });

    it("should handle mixed case 'nOtE'", () => {
      expect(getActivityIcon("nOtE")).toBe(FileText);
    });
  });

  describe("unknown activity types", () => {
    it("should return FileText icon for unknown type", () => {
      expect(getActivityIcon("Unknown")).toBe(FileText);
    });

    it("should return FileText icon for empty string", () => {
      expect(getActivityIcon("")).toBe(FileText);
    });

    it("should return FileText icon for random string", () => {
      expect(getActivityIcon("RandomActivityType")).toBe(FileText);
    });

    it("should return FileText icon for 'Follow-up'", () => {
      expect(getActivityIcon("Follow-up")).toBe(FileText);
    });

    it("should return FileText icon for 'Task'", () => {
      expect(getActivityIcon("Task")).toBe(FileText);
    });
  });

  describe("edge cases", () => {
    it("should handle activity types with leading/trailing whitespace", () => {
      expect(getActivityIcon("  Call  ")).toBe(Phone);
      expect(getActivityIcon(" Email ")).toBe(Mail);
    });

    it("should handle null-like strings", () => {
      expect(getActivityIcon("null")).toBe(FileText);
      expect(getActivityIcon("undefined")).toBe(FileText);
    });
  });

  describe("icon component validation", () => {
    it("should return valid Lucide icon components", () => {
      const icons = [
        getActivityIcon("Call"),
        getActivityIcon("Email"),
        getActivityIcon("Meeting"),
        getActivityIcon("Note"),
        getActivityIcon("Unknown"),
      ];

      // All should be React ForwardRef components (Lucide icons)
      icons.forEach((Icon) => {
        expect(typeof Icon).toBe("object");
        expect(Icon).toHaveProperty("$$typeof");
      });
    });

    it("should return correct icon components for each type", () => {
      expect(getActivityIcon("Call")).toBe(Phone);
      expect(getActivityIcon("Email")).toBe(Mail);
      expect(getActivityIcon("Meeting")).toBe(Users);
      expect(getActivityIcon("Note")).toBe(FileText);
      expect(getActivityIcon("Unknown")).toBe(FileText);
    });
  });
});
