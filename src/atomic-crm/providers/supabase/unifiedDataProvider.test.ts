/**
 * Tests for unified data provider validation integration
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { unifiedDataProvider } from "./unifiedDataProvider";

// Mock the base supabase provider
vi.mock("ra-supabase-core", () => ({
  supabaseDataProvider: () => ({
    getList: vi.fn().mockResolvedValue({ data: [], total: 0 }),
    getOne: vi.fn().mockResolvedValue({ data: { id: 1 } }),
    getMany: vi.fn().mockResolvedValue({ data: [] }),
    getManyReference: vi.fn().mockResolvedValue({ data: [], total: 0 }),
    create: vi.fn().mockResolvedValue({ data: { id: 1 } }),
    update: vi.fn().mockResolvedValue({ data: { id: 1 } }),
    updateMany: vi.fn().mockResolvedValue({ data: [] }),
    delete: vi.fn().mockResolvedValue({ data: { id: 1 } }),
    deleteMany: vi.fn().mockResolvedValue({ data: [] }),
  }),
}));

// Mock the supabase client
vi.mock("./supabase", () => ({
  supabase: {
    auth: {
      getUser: vi.fn(),
    },
  },
}));

// Mock validation functions
vi.mock("../../validation/opportunities", () => ({
  validateOpportunityForm: vi.fn().mockImplementation(async (data) => {
    if (!data.name) {
      throw {
        message: "Validation failed",
        errors: { name: "Opportunity name is required" },
      };
    }
  }),
  validateCreateOpportunity: vi.fn().mockImplementation(async (data) => {
    if (!data.name) {
      throw {
        message: "Validation failed",
        errors: { name: "Opportunity name is required" },
      };
    }
  }),
  validateUpdateOpportunity: vi.fn().mockImplementation(async (data) => {
    if (data.name === "") {
      throw {
        message: "Validation failed",
        errors: { name: "Opportunity name cannot be empty" },
      };
    }
  }),
}));

vi.mock("../../validation/organizations", () => ({
  validateOrganizationForSubmission: vi
    .fn()
    .mockImplementation(async (data) => {
      if (!data.name) {
        throw {
          message: "Validation failed",
          errors: { name: "Organization name is required" },
        };
      }
    }),
}));

vi.mock("../../validation/contacts", () => ({
  validateContactForm: vi.fn().mockImplementation(async (data) => {
    if (!data.first_name && !data.last_name) {
      throw {
        message: "Validation failed",
        errors: {
          first_name: "At least first or last name is required",
          last_name: "At least first or last name is required",
        },
      };
    }
  }),
  validateCreateContact: vi.fn().mockImplementation(async (data) => {
    if (!data.first_name && !data.last_name) {
      throw {
        message: "Validation failed",
        errors: {
          first_name: "At least first or last name is required",
          last_name: "At least first or last name is required",
        },
      };
    }
  }),
  validateUpdateContact: vi.fn().mockImplementation(async (data) => {
    // Update validation is more permissive
    return;
  }),
  validateContactOrganization: vi.fn().mockImplementation(async (data) => {
    // Mock for contact organization validation
    return;
  }),
}));

vi.mock("../../validation/tags", () => ({
  validateCreateTag: vi.fn().mockImplementation((data) => {
    if (!data.name) {
      throw new Error("Tag name is required");
    }
    return data;
  }),
  validateUpdateTag: vi.fn().mockImplementation((data) => {
    if (!data.id) {
      throw new Error("Tag ID is required for update");
    }
    return data;
  }),
}));

// Mock notes validation functions
vi.mock("../../validation/notes", () => ({
  validateCreateContactNote: vi.fn().mockImplementation((data) => {
    // Mock validation logic if needed
    return data;
  }),
  validateUpdateContactNote: vi.fn().mockImplementation((data) => {
    return data;
  }),
  validateCreateOpportunityNote: vi.fn().mockImplementation((data) => {
    return data;
  }),
  validateUpdateOpportunityNote: vi.fn().mockImplementation((data) => {
    return data;
  }),
  validateContactNoteForSubmission: vi.fn().mockImplementation((data) => {
    return data;
  }),
  validateOpportunityNoteForSubmission: vi.fn().mockImplementation((data) => {
    return data;
  }),
}));

// Mock products validation functions
vi.mock("../../validation/products", () => ({
  validateProductForm: vi.fn().mockImplementation(async (data) => {
    // Mock validation logic if needed
    return;
  }),
  validateOpportunityProduct: vi.fn().mockImplementation(async (data) => {
    return;
  }),
}));

// Mock sales validation functions
vi.mock("../../validation/sales", () => ({
  validateSalesForm: vi.fn().mockImplementation(async (data) => {
    return;
  }),
  validateCreateSales: vi.fn().mockImplementation(async (data) => {
    return;
  }),
  validateUpdateSales: vi.fn().mockImplementation(async (data) => {
    return;
  }),
}));

// Mock activities validation functions
vi.mock("../../validation/activities", () => ({
  validateActivitiesForm: vi.fn().mockImplementation(async (data) => {
    return;
  }),
  validateCreateActivities: vi.fn().mockImplementation(async (data) => {
    return;
  }),
  validateUpdateActivities: vi.fn().mockImplementation(async (data) => {
    return;
  }),
  validateEngagementsForm: vi.fn().mockImplementation(async (data) => {
    return;
  }),
  validateCreateEngagements: vi.fn().mockImplementation(async (data) => {
    return;
  }),
  validateUpdateEngagements: vi.fn().mockImplementation(async (data) => {
    return;
  }),
  validateInteractionsForm: vi.fn().mockImplementation(async (data) => {
    return;
  }),
  validateCreateInteractions: vi.fn().mockImplementation(async (data) => {
    return;
  }),
  validateUpdateInteractions: vi.fn().mockImplementation(async (data) => {
    return;
  }),
}));

// Mock segments validation functions
vi.mock("../../validation/segments", () => ({
  validateCreateSegment: vi.fn().mockImplementation((data) => {
    return data;
  }),
  validateUpdateSegment: vi.fn().mockImplementation((data) => {
    return data;
  }),
  validateSegmentForSubmission: vi.fn().mockImplementation((data) => {
    return data;
  }),
}));

// Mock tasks validation functions
vi.mock("../../validation/tasks", () => ({
  validateCreateTask: vi.fn().mockImplementation((data) => {
    return data;
  }),
  validateUpdateTask: vi.fn().mockImplementation((data) => {
    return data;
  }),
  validateTaskWithReminder: vi.fn().mockImplementation((data) => {
    return data;
  }),
  validateTaskForSubmission: vi.fn().mockImplementation((data, isUpdate = false) => {
    return data;
  }),
}));

// Mock services with factory functions
vi.mock("../../services", () => ({
  SalesService: vi.fn().mockImplementation(() => ({
    salesCreate: vi.fn(),
    salesUpdate: vi.fn(),
    updatePassword: vi.fn(),
  })),
  OpportunitiesService: vi.fn().mockImplementation(() => ({
    unarchiveOpportunity: vi.fn(),
  })),
  ActivitiesService: vi.fn().mockImplementation(() => ({
    getActivityLog: vi.fn(),
  })),
  JunctionsService: vi.fn().mockImplementation(() => ({
    getContactOrganizations: vi.fn(),
    addContactToOrganization: vi.fn(),
    removeContactFromOrganization: vi.fn(),
    setPrimaryOrganization: vi.fn(),
    getOpportunityParticipants: vi.fn(),
    addOpportunityParticipant: vi.fn(),
    removeOpportunityParticipant: vi.fn(),
    getOpportunityContacts: vi.fn(),
    addOpportunityContact: vi.fn(),
    removeOpportunityContact: vi.fn(),
  })),
}));

// Mock utils
vi.mock("../../utils/storage.utils", () => ({
  uploadToBucket: vi.fn(),
}));

vi.mock("../../utils/avatar.utils", () => ({
  processContactAvatar: vi.fn().mockImplementation((data) => data),
  processOrganizationLogo: vi.fn().mockImplementation((data) => data),
}));

describe("UnifiedDataProvider Validation Integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Create operations", () => {
    it("should validate opportunities on create", async () => {
      // Attempt to create an opportunity without required fields
      await expect(
        unifiedDataProvider.create("opportunities", {
          data: { amount: 100 },
        }),
      ).rejects.toMatchObject({
        message: "Validation failed",
        errors: { name: "Opportunity name is required" },
      });
    });

    it("should validate organizations on create", async () => {
      // Organizations have validation that requires a name
      await expect(
        unifiedDataProvider.create("organizations", {
          data: { website: "https://example.com" },
        }),
      ).rejects.toMatchObject({
        message: "Validation failed",
        errors: { name: "Organization name is required" },
      });
    });

    it("should validate contacts on create", async () => {
      // Attempt to create a contact without required fields
      await expect(
        unifiedDataProvider.create("contacts", {
          data: { email: "test@example.com" },
        }),
      ).rejects.toMatchObject({
        message: "Validation failed",
        errors: {
          first_name: "At least first or last name is required",
          last_name: "At least first or last name is required",
        },
      });
    });

    it("should pass validation with valid data", async () => {
      const result = await unifiedDataProvider.create("opportunities", {
        data: {
          name: "Test Opportunity",
          amount: 100,
        },
      });

      expect(result.data).toEqual({ id: 1 });
    });
  });

  describe("Update operations", () => {
    it("should validate opportunities on update", async () => {
      // Clear name which should fail validation
      await expect(
        unifiedDataProvider.update("opportunities", {
          id: 1,
          data: { name: "" },
          previousData: { id: 1, name: "Old Name" },
        }),
      ).rejects.toMatchObject({
        message: "Validation failed",
      });
    });

    it("should validate tags on update", async () => {
      // Update a tag with valid data should work
      const result = await unifiedDataProvider.update("tags", {
        id: 1,
        data: { id: 1, name: "Updated Tag" },
        previousData: { id: 1, name: "Old Tag" },
      });

      expect(result.data).toEqual({ id: 1 });
    });
  });

  describe("Registry", () => {
    it("should have validation registered for key resources", async () => {
      const { resourceUsesValidation } = await import("./unifiedDataProvider");

      expect(resourceUsesValidation("opportunities")).toBe(true);
      expect(resourceUsesValidation("organizations")).toBe(true);
      expect(resourceUsesValidation("contacts")).toBe(true);
      expect(resourceUsesValidation("tags")).toBe(true);
      // Note: companies is an alias that maps to organizations, so no separate entry
    });

    it("should correctly identify resources with validation", async () => {
      const { resourceUsesValidation } = await import("./unifiedDataProvider");

      expect(resourceUsesValidation("opportunities")).toBe(true);
      expect(resourceUsesValidation("organizations")).toBe(true);
      expect(resourceUsesValidation("contacts")).toBe(true);
      expect(resourceUsesValidation("tags")).toBe(true);
      expect(resourceUsesValidation("unknown")).toBe(false);
    });
  });

  describe("Service Layer Integration", () => {
    it("should delegate sales creation to SalesService", async () => {
      // This test validates that the unified provider includes custom service methods
      // The actual implementation is tested in the service-specific tests
      expect(typeof unifiedDataProvider.salesCreate).toBe('function');
      expect(typeof unifiedDataProvider.salesUpdate).toBe('function');
      expect(typeof unifiedDataProvider.updatePassword).toBe('function');
    });

    it("should include opportunity service methods", () => {
      expect(typeof unifiedDataProvider.unarchiveOpportunity).toBe('function');
    });

    it("should include activity service methods", () => {
      expect(typeof unifiedDataProvider.getActivityLog).toBe('function');
    });

    it("should include junction table service methods", () => {
      expect(typeof unifiedDataProvider.getContactOrganizations).toBe('function');
      expect(typeof unifiedDataProvider.addContactToOrganization).toBe('function');
      expect(typeof unifiedDataProvider.removeContactFromOrganization).toBe('function');
      expect(typeof unifiedDataProvider.setPrimaryOrganization).toBe('function');
      expect(typeof unifiedDataProvider.getOpportunityParticipants).toBe('function');
      expect(typeof unifiedDataProvider.addOpportunityParticipant).toBe('function');
      expect(typeof unifiedDataProvider.removeOpportunityParticipant).toBe('function');
      expect(typeof unifiedDataProvider.getOpportunityContacts).toBe('function');
      expect(typeof unifiedDataProvider.addOpportunityContact).toBe('function');
      expect(typeof unifiedDataProvider.removeOpportunityContact).toBe('function');
    });
  });

  describe("Transformer Integration", () => {
    it("should identify resources with transformers", async () => {
      const { resourceUsesTransformers } = await import("./unifiedDataProvider");

      expect(resourceUsesTransformers("contactNotes")).toBe(true);
      expect(resourceUsesTransformers("opportunityNotes")).toBe(true);
      expect(resourceUsesTransformers("sales")).toBe(true);
      expect(resourceUsesTransformers("contacts")).toBe(true);
      expect(resourceUsesTransformers("organizations")).toBe(true);
      expect(resourceUsesTransformers("tags")).toBe(false);  // tags don't have transformers
      expect(resourceUsesTransformers("unknown")).toBe(false);
    });

    it("should have transformer pipeline configured", async () => {
      // The transformer pipeline is configured in the unified provider
      // Individual transformer functionality is tested in their own unit tests
      const { resourceUsesTransformers } = await import('./unifiedDataProvider');
      expect(typeof resourceUsesTransformers).toBe('function');
    });
  });
});
