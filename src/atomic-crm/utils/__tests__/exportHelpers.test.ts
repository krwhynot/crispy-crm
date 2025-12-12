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
      { value: "work@test.com", type: "work" as const },
      { value: "home@test.com", type: "home" as const },
    ];

    it("extracts email by type", () => {
      expect(extractEmailByType(emails, "work")).toBe("work@test.com");
      expect(extractEmailByType(emails, "home")).toBe("home@test.com");
    });

    it("returns undefined for missing type", () => {
      expect(extractEmailByType(emails, "other")).toBeUndefined();
    });

    it("handles undefined array", () => {
      expect(extractEmailByType(undefined, "work")).toBeUndefined();
    });

    it("handles empty array", () => {
      expect(extractEmailByType([], "work")).toBeUndefined();
    });
  });

  describe("extractPhoneByType", () => {
    const phones = [
      { value: "555-1234", type: "work" as const },
      { value: "555-5678", type: "home" as const },
    ];

    it("extracts phone by type", () => {
      expect(extractPhoneByType(phones, "work")).toBe("555-1234");
      expect(extractPhoneByType(phones, "home")).toBe("555-5678");
    });

    it("returns undefined for missing type", () => {
      expect(extractPhoneByType(phones, "other")).toBeUndefined();
    });

    it("handles undefined array", () => {
      expect(extractPhoneByType(undefined, "work")).toBeUndefined();
    });
  });

  describe("flattenEmailsForExport", () => {
    it("flattens emails to separate keys", () => {
      const emails = [
        { value: "work@test.com", type: "work" as const },
        { value: "home@test.com", type: "home" as const },
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
      const phones = [{ value: "555-1234", type: "work" as const }];
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
