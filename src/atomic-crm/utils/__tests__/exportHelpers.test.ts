/**
 * @vitest-environment node
 */
import { describe, it, expect } from "vitest";
import {
  extractEmailByType,
  extractPhoneByType,
  flattenEmailsForExport,
  flattenPhonesForExport,
} from "../exportHelpers";

describe("exportHelpers", () => {
  describe("extractEmailByType", () => {
    const emails = [
      { email: "work@test.com", type: "Work" as const },
      { email: "home@test.com", type: "Home" as const },
    ];

    it("extracts email by type", () => {
      expect(extractEmailByType(emails, "Work")).toBe("work@test.com");
      expect(extractEmailByType(emails, "Home")).toBe("home@test.com");
    });

    it("returns undefined for missing type", () => {
      expect(extractEmailByType(emails, "Other")).toBeUndefined();
    });

    it("handles undefined array", () => {
      expect(extractEmailByType(undefined, "Work")).toBeUndefined();
    });

    it("handles empty array", () => {
      expect(extractEmailByType([], "Work")).toBeUndefined();
    });
  });

  describe("extractPhoneByType", () => {
    const phones = [
      { number: "555-1234", type: "Work" as const },
      { number: "555-5678", type: "Home" as const },
    ];

    it("extracts phone by type", () => {
      expect(extractPhoneByType(phones, "Work")).toBe("555-1234");
      expect(extractPhoneByType(phones, "Home")).toBe("555-5678");
    });

    it("returns undefined for missing type", () => {
      expect(extractPhoneByType(phones, "Other")).toBeUndefined();
    });

    it("handles undefined array", () => {
      expect(extractPhoneByType(undefined, "Work")).toBeUndefined();
    });
  });

  describe("flattenEmailsForExport", () => {
    it("flattens emails to separate keys", () => {
      const emails = [
        { email: "work@test.com", type: "Work" as const },
        { email: "home@test.com", type: "Home" as const },
      ];
      const result = flattenEmailsForExport(emails);
      expect(result.email_work).toBe("work@test.com");
      expect(result.email_home).toBe("home@test.com");
      expect(result.email_other).toBeUndefined();
    });

    it("handles undefined", () => {
      const result = flattenEmailsForExport(undefined);
      expect(result.email_work).toBeUndefined();
      expect(result.email_home).toBeUndefined();
      expect(result.email_other).toBeUndefined();
    });
  });

  describe("flattenPhonesForExport", () => {
    it("flattens phones to separate keys", () => {
      const phones = [{ number: "555-1234", type: "Work" as const }];
      const result = flattenPhonesForExport(phones);
      expect(result.phone_work).toBe("555-1234");
      expect(result.phone_home).toBeUndefined();
    });

    it("handles undefined", () => {
      const result = flattenPhonesForExport(undefined);
      expect(result.phone_work).toBeUndefined();
    });
  });
});
