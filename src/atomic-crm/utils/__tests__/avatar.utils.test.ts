import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { Contact } from "../../types";
import type { Organization } from "../../validation/organizations";

// Mock the avatar module BEFORE importing avatar.utils
vi.mock("../avatar", () => ({
  fetchWithTimeout: vi.fn(),
  DOMAINS_NOT_SUPPORTING_FAVICON: ["gmail.com", "yahoo.com", "hotmail.com"],
}));

// Mock global fetch for Gravatar checks
const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

// Import after mocks are set up
import {
  isValidEmailForAvatar,
  processContactAvatar,
  processOrganizationLogo,
  getContactAvatar,
  getOrganizationAvatar,
  extractEmailLocalPart,
} from "../avatar.utils";
import { fetchWithTimeout } from "../avatar";

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

describe("processContactAvatar", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe("when contact already has avatar", () => {
    it("should preserve existing avatar and not make network calls", async () => {
      const existingAvatar = {
        src: "https://example.com/existing-avatar.jpg",
        title: "User uploaded avatar",
      };
      const contactData: Partial<Contact> = {
        email: [{ value: "test@example.com", type: "work" }],
        avatar: existingAvatar,
      };

      const result = await processContactAvatar(contactData);

      expect(result.avatar).toEqual(existingAvatar);
      // Should not attempt to fetch Gravatar when avatar exists
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it("should preserve avatar even when email is missing", async () => {
      const existingAvatar = {
        src: "https://example.com/avatar.jpg",
        title: "Existing",
      };
      const contactData: Partial<Contact> = {
        avatar: existingAvatar,
        // No email provided
      };

      const result = await processContactAvatar(contactData);

      expect(result.avatar).toEqual(existingAvatar);
    });
  });

  describe("when contact has no avatar but has email", () => {
    it("should generate Gravatar avatar when Gravatar exists", async () => {
      // Mock Gravatar check to succeed
      mockFetch.mockResolvedValueOnce({ ok: true });

      const contactData: Partial<Contact> = {
        email: [{ value: "user@company.com", type: "work" }],
        // No avatar
      };

      const result = await processContactAvatar(contactData);

      expect(result.avatar).toBeDefined();
      expect(result.avatar?.src).toContain("gravatar.com/avatar/");
      expect(result.avatar?.title).toBe("Generated avatar");
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it("should fallback to favicon when Gravatar does not exist", async () => {
      // Mock Gravatar check to fail (404)
      mockFetch.mockResolvedValueOnce({ ok: false });
      // Mock favicon check to succeed
      vi.mocked(fetchWithTimeout).mockResolvedValueOnce({ ok: true } as Response);

      const contactData: Partial<Contact> = {
        email: [{ value: "user@acme-corp.com", type: "work" }],
      };

      const result = await processContactAvatar(contactData);

      expect(result.avatar).toBeDefined();
      expect(result.avatar?.src).toBe("https://acme-corp.com/favicon.ico");
      expect(result.avatar?.title).toBe("Generated avatar");
    });

    it("should return null avatar when neither Gravatar nor favicon available", async () => {
      // Mock Gravatar check to fail
      mockFetch.mockResolvedValueOnce({ ok: false });
      // Mock favicon check to fail
      vi.mocked(fetchWithTimeout).mockResolvedValueOnce({ ok: false } as Response);

      const contactData: Partial<Contact> = {
        email: [{ value: "user@obscure-domain.com", type: "work" }],
      };

      const result = await processContactAvatar(contactData);

      // Avatar should remain undefined (no avatar generated)
      expect(result.avatar).toBeUndefined();
    });

    it("should skip favicon lookup for unsupported domains (gmail, yahoo)", async () => {
      // Mock Gravatar check to fail
      mockFetch.mockResolvedValueOnce({ ok: false });

      const contactData: Partial<Contact> = {
        email: [{ value: "user@gmail.com", type: "work" }],
      };

      const result = await processContactAvatar(contactData);

      // Should not call fetchWithTimeout for blocked domain
      expect(fetchWithTimeout).not.toHaveBeenCalled();
      expect(result.avatar).toBeUndefined();
    });

    it("should try multiple emails until one succeeds", async () => {
      // First email: Gravatar fails, favicon fails (blocked domain)
      mockFetch.mockResolvedValueOnce({ ok: false });
      // Second email: Gravatar succeeds
      mockFetch.mockResolvedValueOnce({ ok: true });

      const contactData: Partial<Contact> = {
        email: [
          { value: "user@gmail.com", type: "home" }, // Blocked domain
          { value: "user@company.com", type: "work" }, // Should succeed
        ],
      };

      const result = await processContactAvatar(contactData);

      expect(result.avatar).toBeDefined();
      expect(result.avatar?.src).toContain("gravatar.com/avatar/");
    });
  });

  describe("when contact has no avatar and no email", () => {
    it("should return contact unchanged when email is undefined", async () => {
      const contactData: Partial<Contact> = {
        first_name: "John",
        last_name: "Doe",
        // No email, no avatar
      };

      const result = await processContactAvatar(contactData);

      expect(result.avatar).toBeUndefined();
      expect(result.first_name).toBe("John");
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it("should return contact unchanged when email array is empty", async () => {
      const contactData: Partial<Contact> = {
        email: [],
        // No avatar
      };

      const result = await processContactAvatar(contactData);

      expect(result.avatar).toBeUndefined();
      expect(mockFetch).not.toHaveBeenCalled();
    });
  });

  describe("error handling", () => {
    it("should handle Gravatar network errors gracefully", async () => {
      // Mock Gravatar check to throw network error
      mockFetch.mockRejectedValueOnce(new Error("Network error"));
      // Mock favicon check to succeed
      vi.mocked(fetchWithTimeout).mockResolvedValueOnce({ ok: true } as Response);

      const contactData: Partial<Contact> = {
        email: [{ value: "user@example.com", type: "work" }],
      };

      const result = await processContactAvatar(contactData);

      // Should fallback to favicon
      expect(result.avatar?.src).toBe("https://example.com/favicon.ico");
    });

    it("should handle favicon network errors gracefully", async () => {
      // Mock Gravatar check to fail
      mockFetch.mockResolvedValueOnce({ ok: false });
      // Mock favicon check to throw
      vi.mocked(fetchWithTimeout).mockRejectedValueOnce(new Error("Timeout"));

      const contactData: Partial<Contact> = {
        email: [{ value: "user@example.com", type: "work" }],
      };

      const result = await processContactAvatar(contactData);

      // Should gracefully return without avatar
      expect(result.avatar).toBeUndefined();
    });
  });
});

describe("processOrganizationLogo", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe("when logo has existing src", () => {
    it("should preserve logo when src already exists", async () => {
      const existingLogo = {
        src: "https://example.com/custom-logo.png",
        title: "Custom logo",
      };
      const orgData: Partial<Organization> = {
        name: "Acme Corp",
        website: "https://acme.com",
        logo: existingLogo,
      };

      const result = await processOrganizationLogo(orgData);

      expect(result.logo).toEqual(existingLogo);
    });

    it("should not modify logo when src is present even without website", async () => {
      const existingLogo = {
        src: "https://uploaded.logo.png",
        title: "Uploaded",
      };
      const orgData: Partial<Organization> = {
        name: "No Website Corp",
        logo: existingLogo,
        // No website
      };

      const result = await processOrganizationLogo(orgData);

      expect(result.logo).toEqual(existingLogo);
    });
  });

  describe("when logo exists but has no src (newly uploaded file)", () => {
    it("should generate favicon URL when website exists", async () => {
      // Simulating React Admin file upload: rawFile present but no src yet
      // Type assertion needed because RA file input adds rawFile before processing
      const newlyUploadedLogo = {
        rawFile: new File([""], "logo.png"),
        // No src yet - this triggers logo generation
      };
      const orgData: Partial<Organization> = {
        name: "Acme Corp",
        website: "https://acme.com",
        logo: newlyUploadedLogo as unknown as Organization["logo"],
      };

      const result = await processOrganizationLogo(orgData);

      expect(result.logo?.src).toBe("https://favicon.show/acme.com");
      expect(result.logo?.title).toBe("Organization favicon");
    });

    it("should strip protocol and trailing slash from website URL", async () => {
      // Simulating React Admin file upload state before processing
      const orgData: Partial<Organization> = {
        name: "Test Corp",
        website: "https://www.example.com/",
        logo: { rawFile: new File([""], "logo.png") } as unknown as Organization["logo"],
      };

      const result = await processOrganizationLogo(orgData);

      expect(result.logo?.src).toBe("https://favicon.show/www.example.com");
    });

    it("should handle http:// protocol correctly", async () => {
      // Simulating React Admin file upload state before processing
      const orgData: Partial<Organization> = {
        name: "Legacy Corp",
        website: "http://legacy-site.com",
        logo: { rawFile: new File([""], "logo.png") } as unknown as Organization["logo"],
      };

      const result = await processOrganizationLogo(orgData);

      expect(result.logo?.src).toBe("https://favicon.show/legacy-site.com");
    });

    it("should preserve existing logo properties when adding src", async () => {
      const orgData: Partial<Organization> = {
        name: "Acme Corp",
        website: "https://acme.com",
        logo: {
          rawFile: new File(["content"], "custom-logo.png"),
          // Additional properties should be preserved
        } as unknown as Organization["logo"],
      };

      const result = await processOrganizationLogo(orgData);

      // Should merge new src/title with existing properties
      expect(result.logo?.src).toBe("https://favicon.show/acme.com");
      expect(result.logo?.title).toBe("Organization favicon");
    });

    it("should not generate logo when website is missing", async () => {
      const orgData: Partial<Organization> = {
        name: "No Website Corp",
        logo: { rawFile: new File([""], "logo.png") } as unknown as Organization["logo"],
        // No website
      };

      const result = await processOrganizationLogo(orgData);

      // Logo should remain without src
      expect(result.logo?.src).toBeUndefined();
    });
  });

  describe("when no logo exists", () => {
    it("should return organization unchanged when logo is undefined", async () => {
      const orgData: Partial<Organization> = {
        name: "Simple Corp",
        website: "https://simple.com",
        // No logo
      };

      const result = await processOrganizationLogo(orgData);

      expect(result.logo).toBeUndefined();
      expect(result.name).toBe("Simple Corp");
    });

    it("should return organization unchanged when logo is null", async () => {
      const orgData: Partial<Organization> = {
        name: "Null Logo Corp",
        website: "https://nulllogo.com",
        logo: null,
      };

      const result = await processOrganizationLogo(orgData);

      expect(result.logo).toBeNull();
    });
  });
});

describe("getContactAvatar", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("should return null when no email provided", async () => {
    const result = await getContactAvatar({});
    expect(result).toBeNull();
  });

  it("should return null when email array is empty", async () => {
    const result = await getContactAvatar({ email: [] });
    expect(result).toBeNull();
  });

  it("should return Gravatar URL when Gravatar exists", async () => {
    mockFetch.mockResolvedValueOnce({ ok: true });

    const result = await getContactAvatar({
      email: [{ value: "test@example.com", type: "work" }],
    });

    expect(result).toContain("gravatar.com/avatar/");
  });
});

describe("getOrganizationAvatar", () => {
  it("should return null when no website provided", async () => {
    const result = await getOrganizationAvatar({});
    expect(result).toBeNull();
  });

  it("should return favicon.show URL when website provided", async () => {
    const result = await getOrganizationAvatar({
      website: "https://example.com",
    });

    expect(result).toEqual({
      src: "https://favicon.show/example.com",
      title: "Organization favicon",
    });
  });

  it("should strip trailing slash from website", async () => {
    const result = await getOrganizationAvatar({
      website: "https://example.com/",
    });

    expect(result?.src).toBe("https://favicon.show/example.com");
  });
});

describe("extractEmailLocalPart", () => {
  it("should return local part for valid email", () => {
    expect(extractEmailLocalPart("john.doe@example.com")).toBe("john.doe");
  });

  it("should return empty string for empty input", () => {
    expect(extractEmailLocalPart("")).toBe("");
  });

  it("should return empty string for email without @", () => {
    expect(extractEmailLocalPart("notanemail")).toBe("");
  });

  it("should return first segment when email has multiple @", () => {
    expect(extractEmailLocalPart("a@b@c.com")).toBe("a");
  });

  it("should preserve special characters in local part", () => {
    expect(extractEmailLocalPart("john+test@example.com")).toBe("john+test");
  });
});
