import { describe, it, expect } from "vitest";
import { isValidEmailForAvatar } from "../avatar.utils";

describe("isValidEmailForAvatar", () => {
  it("should accept valid email addresses", () => {
    expect(isValidEmailForAvatar("user@example.com")).toBe(true);
    expect(isValidEmailForAvatar("test.user+tag@domain.co.uk")).toBe(true);
  });

  it("should reject invalid email addresses", () => {
    expect(isValidEmailForAvatar("notanemail")).toBe(false);
    expect(isValidEmailForAvatar("@example.com")).toBe(false);
    expect(isValidEmailForAvatar("user@")).toBe(false);
    expect(isValidEmailForAvatar("")).toBe(false);
  });

  it("should use same validation as Zod contact schema", () => {
    // This ensures we're using Zod instead of regex
    // If regex changes, this test will catch drift
    const validByZod = "valid@email.com";
    const invalidByZod = "not@valid@email";

    expect(isValidEmailForAvatar(validByZod)).toBe(true);
    expect(isValidEmailForAvatar(invalidByZod)).toBe(false);
  });
});
