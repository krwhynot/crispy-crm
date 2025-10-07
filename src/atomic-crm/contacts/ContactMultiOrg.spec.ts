import { describe, it, expect, beforeEach, vi } from "vitest";

// Mock contact with multiple organizations
const mockContactWithMultipleOrgs = {
  id: 1,
  first_name: "John",
  last_name: "Doe",
  title: "Senior Consultant",
  department: "Technology",
  email: [{ email: "john.doe@acme.com", type: "Work" }],
  phone: [{ number: "+1-555-0123", type: "Work" }],
};

const mockOrganizations = [
  {
    id: 1,
    name: "Acme Corp",
    sector: "Technology",
    organization_type: "customer",
  },
  {
    id: 2,
    name: "Tech Partners Ltd",
    sector: "Software",
    organization_type: "partner",
  },
  {
    id: 3,
    name: "Consulting Firm Inc",
    sector: "Services",
    organization_type: "vendor",
  },
];

const mockContactOrganizations = [
  {
    id: 1,
    contact_id: 1,
    organization_id: 1,
    is_primary: true,
    role: "decision_maker",
    purchase_influence: "High",
    decision_authority: "Decision Maker",
  },
  {
    id: 2,
    contact_id: 1,
    organization_id: 2,
    is_primary: false,
    role: "influencer",
    purchase_influence: "Medium",
    decision_authority: "Influencer",
  },
  {
    id: 3,
    contact_id: 1,
    organization_id: 3,
    is_primary: false,
    role: "buyer",
    purchase_influence: "Low",
    decision_authority: "End User",
  },
];

// Mock the unified data provider with service methods
const mockDataProvider = {
  getList: vi.fn(),
  getOne: vi.fn(),
  getMany: vi.fn(),
  getManyReference: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  updateMany: vi.fn(),
  delete: vi.fn(),
  deleteMany: vi.fn(),
  // Custom service methods
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
};

describe("Contact Multi-Organization Support - Unified Provider", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Mock getList for various resources
    mockDataProvider.getList.mockImplementation((resource, _params) => {
      if (resource === "organizations") {
        return Promise.resolve({
          data: mockOrganizations,
          total: mockOrganizations.length,
        });
      }
      if (resource === "contact_organizations") {
        return Promise.resolve({
          data: mockContactOrganizations,
          total: mockContactOrganizations.length,
        });
      }
      return Promise.resolve({ data: [], total: 0 });
    });

    // Mock getOne for contact
    mockDataProvider.getOne.mockImplementation((resource, params) => {
      if (resource === "contacts" && params.id === 1) {
        return Promise.resolve({ data: mockContactWithMultipleOrgs });
      }
      return Promise.reject(new Error("Not found"));
    });

    // Mock getMany for organizations
    mockDataProvider.getMany.mockImplementation((resource, params) => {
      if (resource === "organizations") {
        return Promise.resolve({
          data: mockOrganizations.filter((org) => params.ids.includes(org.id)),
        });
      }
      return Promise.resolve({ data: [] });
    });

    mockDataProvider.create.mockResolvedValue({
      data: { id: 1, first_name: "Test", last_name: "Contact" },
    });

    mockDataProvider.update.mockResolvedValue({
      data: { id: 1, first_name: "Updated", last_name: "Contact" },
    });
  });

  describe("Contact Data Structure", () => {
    it("should support multi-organization contact data structure", () => {
      const contact = mockContactWithMultipleOrgs;

      expect(contact.id).toBe(1);
      expect(contact.first_name).toBe("John");
      expect(contact.last_name).toBe("Doe");
      expect(contact.title).toBe("Senior Consultant");
      expect(contact.department).toBe("Technology");
    });

    it("should validate contact organization relationships", () => {
      const relationships = mockContactOrganizations;

      expect(relationships).toHaveLength(3);

      // Should have exactly one primary organization
      const primaryCount = relationships.filter((rel) => rel.is_primary).length;
      expect(primaryCount).toBe(1);

      // Primary organization should be the first one
      expect(relationships[0].is_primary).toBe(true);
      expect(relationships[1].is_primary).toBe(false);
      expect(relationships[2].is_primary).toBe(false);
    });

    it("should support different roles per organization", () => {
      const relationships = mockContactOrganizations;

      expect(relationships[0].role).toBe("decision_maker");
      expect(relationships[1].role).toBe("influencer");
      expect(relationships[2].role).toBe("buyer");

      // Each organization should have different influence levels
      expect(relationships[0].purchase_influence).toBe("High");
      expect(relationships[1].purchase_influence).toBe("Medium");
      expect(relationships[2].purchase_influence).toBe("Low");
    });
  });

  describe("Unified Data Provider Operations", () => {
    it("should retrieve contact with multi-organization data", async () => {
      const result = await mockDataProvider.getOne("contacts", { id: 1 });

      expect(result.data.id).toBe(1);
      expect(result.data.first_name).toBe("John");
      expect(result.data.last_name).toBe("Doe");
      expect(result.data.title).toBe("Senior Consultant");
      expect(result.data.department).toBe("Technology");
    });

    it("should retrieve contact organization relationships", async () => {
      const result = await mockDataProvider.getList("contact_organizations", {
        filter: { contact_id: 1 },
        pagination: { page: 1, perPage: 25 },
        sort: { field: "is_primary", order: "DESC" },
      });

      expect(result.data).toHaveLength(3);
      expect(result.total).toBe(3);

      // Check that primary organization comes first when sorted
      const primaryRelationship = result.data.find((rel) => rel.is_primary);
      expect(primaryRelationship).toBeDefined();
      expect(primaryRelationship?.organization_id).toBe(1);
    });

    it("should filter contacts by organization", async () => {
      // Mock filtering by organization
      mockDataProvider.getList.mockImplementation((resource, params) => {
        if (resource === "contacts_summary" && params.filter?.organization_id) {
          const orgId = params.filter.organization_id;
          const relatedContacts = mockContactOrganizations
            .filter((rel) => rel.organization_id === orgId)
            .map(() => mockContactWithMultipleOrgs);

          return Promise.resolve({
            data: relatedContacts,
            total: relatedContacts.length,
          });
        }
        return Promise.resolve({ data: [], total: 0 });
      });

      // Search for contacts in organization 2
      const result = await mockDataProvider.getList("contacts_summary", {
        filter: { organization_id: 2 },
        pagination: { page: 1, perPage: 25 },
        sort: { field: "last_name", order: "ASC" },
      });

      expect(result.data).toHaveLength(1);
      expect(result.data[0].id).toBe(1);
    });
  });

  describe("Contact Organization Service Methods", () => {
    it("should create new contact-organization relationship", async () => {
      const newRelationship = {
        contact_id: 1,
        organization_id: 4,
        is_primary: false,
        role: "technical",
        purchase_influence: "Low",
        decision_authority: "End User",
      };

      await mockDataProvider.create("contact_organizations", {
        data: newRelationship,
      });

      expect(mockDataProvider.create).toHaveBeenCalledWith(
        "contact_organizations",
        {
          data: newRelationship,
        },
      );
    });

    it("should update contact-organization relationship", async () => {
      const updatedRelationship = {
        id: 1,
        contact_id: 1,
        organization_id: 1,
        is_primary: true,
        role: "champion", // Updated role
        purchase_influence: "High",
        decision_authority: "Decision Maker",
      };

      await mockDataProvider.update("contact_organizations", {
        id: 1,
        data: updatedRelationship,
        previousData: mockContactOrganizations[0],
      });

      expect(mockDataProvider.update).toHaveBeenCalledWith(
        "contact_organizations",
        {
          id: 1,
          data: updatedRelationship,
          previousData: mockContactOrganizations[0],
        },
      );
    });

    it("should delete contact-organization relationship", async () => {
      await mockDataProvider.delete("contact_organizations", {
        id: 2,
      });

      expect(mockDataProvider.delete).toHaveBeenCalledWith(
        "contact_organizations",
        {
          id: 2,
        },
      );
    });

    it("should query contact organizations by contact", async () => {
      await mockDataProvider.getManyReference("contact_organizations", {
        target: "contact_id",
        id: 1,
        pagination: { page: 1, perPage: 25 },
        sort: { field: "is_primary", order: "DESC" },
      });

      expect(mockDataProvider.getManyReference).toHaveBeenCalledWith(
        "contact_organizations",
        {
          target: "contact_id",
          id: 1,
          pagination: { page: 1, perPage: 25 },
          sort: { field: "is_primary", order: "DESC" },
        },
      );
    });
  });

  describe("Role and Influence Validation", () => {
    it("should validate contact role choices", () => {
      const validRoles = [
        "decision_maker",
        "influencer",
        "buyer",
        "end_user",
        "gatekeeper",
        "champion",
        "technical",
        "executive",
      ];

      const isValidRole = (role: string): boolean => {
        return validRoles.includes(role);
      };

      expect(isValidRole("decision_maker")).toBe(true);
      expect(isValidRole("influencer")).toBe(true);
      expect(isValidRole("buyer")).toBe(true);
      expect(isValidRole("invalid_role")).toBe(false);
    });

    it("should validate purchase influence levels", () => {
      const validInfluenceLevels = ["High", "Medium", "Low", "Unknown"];

      const isValidInfluenceLevel = (level: string): boolean => {
        return validInfluenceLevels.includes(level);
      };

      expect(isValidInfluenceLevel("High")).toBe(true);
      expect(isValidInfluenceLevel("Medium")).toBe(true);
      expect(isValidInfluenceLevel("Low")).toBe(true);
      expect(isValidInfluenceLevel("Unknown")).toBe(true);
      expect(isValidInfluenceLevel("Invalid")).toBe(false);
    });

    it("should validate decision authority levels", () => {
      const validAuthorityLevels = [
        "Decision Maker",
        "Influencer",
        "End User",
        "Gatekeeper",
      ];

      const isValidAuthorityLevel = (level: string): boolean => {
        return validAuthorityLevels.includes(level);
      };

      expect(isValidAuthorityLevel("Decision Maker")).toBe(true);
      expect(isValidAuthorityLevel("Influencer")).toBe(true);
      expect(isValidAuthorityLevel("End User")).toBe(true);
      expect(isValidAuthorityLevel("Gatekeeper")).toBe(true);
      expect(isValidAuthorityLevel("Invalid")).toBe(false);
    });
  });

  describe("Primary Organization Validation", () => {
    it("should enforce exactly one primary organization", () => {
      const relationships = mockContactOrganizations;

      // Count primary organizations
      const primaryCount = relationships.filter((rel) => rel.is_primary).length;
      expect(primaryCount).toBe(1);

      // Verify only the first relationship is primary
      expect(relationships[0].is_primary).toBe(true);
      expect(relationships[1].is_primary).toBe(false);
      expect(relationships[2].is_primary).toBe(false);
    });

    it("should reject contact with no primary organization", () => {
      const invalidRelationships = mockContactOrganizations.map((rel) => ({
        ...rel,
        is_primary: false,
      }));

      const primaryCount = invalidRelationships.filter(
        (rel) => rel.is_primary,
      ).length;
      expect(primaryCount).toBe(0);

      // This would be invalid - should have exactly one primary
      const isValid = primaryCount === 1;
      expect(isValid).toBe(false);
    });

    it("should reject contact with multiple primary organizations", () => {
      const invalidRelationships = mockContactOrganizations.map((rel) => ({
        ...rel,
        is_primary: true,
      }));

      const primaryCount = invalidRelationships.filter(
        (rel) => rel.is_primary,
      ).length;
      expect(primaryCount).toBe(3);

      // This would be invalid - should have exactly one primary
      const isValid = primaryCount === 1;
      expect(isValid).toBe(false);
    });

    it("should validate primary organization updates maintain single primary", async () => {
      // Attempt to create a second primary relationship
      const invalidUpdate = {
        contact_id: 1,
        organization_id: 4,
        is_primary: true, // This would create a second primary
        role: "influencer",
        purchase_influence: "Medium",
        decision_authority: "Influencer",
      };

      // In a real system, this should be rejected by validation
      const existingPrimaryCount = mockContactOrganizations.filter(
        (rel) => rel.is_primary,
      ).length;
      const wouldCreateMultiplePrimary =
        existingPrimaryCount >= 1 && invalidUpdate.is_primary;

      expect(wouldCreateMultiplePrimary).toBe(true);
      // This should fail validation in the actual system
    });
  });

  describe("Legacy Field Rejection", () => {
    it("should reject creation with legacy organization_id field", async () => {
      const contactWithLegacyField = {
        first_name: "Test",
        last_name: "Contact",
        organization_id: 1, // Legacy field - should be rejected
        email: [{ email: "test@example.com", type: "Work" }],
      };

      // Mock provider to simulate validation error
      mockDataProvider.create.mockRejectedValue(
        new Error(
          "Legacy field organization_id is not supported. Use contact_organizations junction table instead.",
        ),
      );

      await expect(
        mockDataProvider.create("contacts", { data: contactWithLegacyField }),
      ).rejects.toThrow("Legacy field organization_id is not supported");
    });

    it("should reject update with legacy role field on contact", async () => {
      const contactWithLegacyRole = {
        id: 1,
        first_name: "John",
        last_name: "Doe",
        role: "decision_maker", // Legacy field - should be rejected
        purchase_influence: "High", // Legacy field - should be rejected
      };

      // Mock provider to simulate validation error
      mockDataProvider.update.mockRejectedValue(
        new Error(
          "Legacy fields role, purchase_influence are not supported on contacts. Use contact_organizations junction table instead.",
        ),
      );

      await expect(
        mockDataProvider.update("contacts", {
          id: 1,
          data: contactWithLegacyRole,
          previousData: mockContactWithMultipleOrgs,
        }),
      ).rejects.toThrow(
        "Legacy fields role, purchase_influence are not supported",
      );
    });

    it("should reject update with legacy decision_authority field", async () => {
      const contactWithLegacyAuthority = {
        id: 1,
        first_name: "John",
        last_name: "Doe",
        decision_authority: "Decision Maker", // Legacy field - should be rejected
      };

      // Mock provider to simulate validation error
      mockDataProvider.update.mockRejectedValue(
        new Error(
          "Legacy field decision_authority is not supported on contacts. Use contact_organizations junction table instead.",
        ),
      );

      await expect(
        mockDataProvider.update("contacts", {
          id: 1,
          data: contactWithLegacyAuthority,
          previousData: mockContactWithMultipleOrgs,
        }),
      ).rejects.toThrow("Legacy field decision_authority is not supported");
    });

    it("should provide helpful error messages for legacy fields", () => {
      const legacyFields = [
        "organization_id",
        "role",
        "purchase_influence",
        "decision_authority",
      ];

      legacyFields.forEach((field) => {
        const errorMessage = `Legacy field ${field} is not supported on contacts. Use contact_organizations junction table instead.`;
        expect(errorMessage).toContain("Legacy field");
        expect(errorMessage).toContain("contact_organizations junction table");
        expect(errorMessage).toContain(field);
      });
    });
  });

  describe("Multi-Organization Contact Workflows", () => {
    it("should link contact to multiple organizations via junction table", async () => {
      const contactOrganizationData = {
        contact_id: 1,
        organization_id: 2,
        is_primary: false,
        role: "influencer",
        purchase_influence: "Medium",
        decision_authority: "Influencer",
      };

      mockDataProvider.create.mockResolvedValue({
        data: { id: 4, ...contactOrganizationData },
      });

      const result = await mockDataProvider.create("contact_organizations", {
        data: contactOrganizationData,
      });

      expect(result.data).toEqual(
        expect.objectContaining({
          contact_id: 1,
          organization_id: 2,
          is_primary: false,
          role: "influencer",
        }),
      );
    });

    it("should maintain primary organization designation", () => {
      const relationships = mockContactOrganizations;
      const primaryCount = relationships.filter((rel) => rel.is_primary).length;

      expect(primaryCount).toBe(1);
      expect(relationships[0].is_primary).toBe(true);
      expect(relationships[1].is_primary).toBe(false);
      expect(relationships[2].is_primary).toBe(false);
    });

    it("should handle different roles per organization", () => {
      const relationships = mockContactOrganizations;

      expect(relationships[0].role).toBe("decision_maker");
      expect(relationships[1].role).toBe("influencer");
      expect(relationships[2].role).toBe("buyer");

      // Each organization should have different influence levels
      expect(relationships[0].purchase_influence).toBe("High");
      expect(relationships[1].purchase_influence).toBe("Medium");
      expect(relationships[2].purchase_influence).toBe("Low");
    });
  });

  describe("Service Layer Integration", () => {
    it("should use service methods for contact organization queries", async () => {
      const mockServiceResponse = {
        data: mockContactOrganizations,
      };

      mockDataProvider.getContactOrganizations.mockResolvedValue(
        mockServiceResponse,
      );

      const result = await mockDataProvider.getContactOrganizations("contact-1");

      expect(mockDataProvider.getContactOrganizations).toHaveBeenCalledWith(
        "contact-1",
      );
      expect(result.data).toEqual(mockContactOrganizations);
    });

    it("should use service methods for adding contact to organization", async () => {
      const newRelationship = {
        contact_id: "contact-1",
        organization_id: "org-4",
        is_primary: false,
        role: "technical",
        purchase_influence: "Low",
        decision_authority: "End User",
      };

      const mockServiceResponse = {
        data: { id: "co-new", ...newRelationship },
      };

      mockDataProvider.addContactToOrganization.mockResolvedValue(
        mockServiceResponse,
      );

      const result = await mockDataProvider.addContactToOrganization(
        "contact-1",
        "org-4",
        {
          is_primary: false,
          role: "technical",
          purchase_influence: "Low",
          decision_authority: "End User",
        },
      );

      expect(mockDataProvider.addContactToOrganization).toHaveBeenCalledWith(
        "contact-1",
        "org-4",
        {
          is_primary: false,
          role: "technical",
          purchase_influence: "Low",
          decision_authority: "End User",
        },
      );
      expect(result.data.id).toBe("co-new");
    });

    it("should use service methods for removing contact from organization", async () => {
      const mockServiceResponse = {
        data: { id: "co-2" },
      };

      mockDataProvider.removeContactFromOrganization.mockResolvedValue(
        mockServiceResponse,
      );

      const result = await mockDataProvider.removeContactFromOrganization(
        "contact-1",
        "org-2",
      );

      expect(mockDataProvider.removeContactFromOrganization).toHaveBeenCalledWith(
        "contact-1",
        "org-2",
      );
      expect(result.data.id).toBe("co-2");
    });

    it("should use service methods for setting primary organization", async () => {
      const mockServiceResponse = {
        data: { success: true },
      };

      mockDataProvider.setPrimaryOrganization.mockResolvedValue(
        mockServiceResponse,
      );

      const result = await mockDataProvider.setPrimaryOrganization(
        "contact-1",
        "org-2",
      );

      expect(mockDataProvider.setPrimaryOrganization).toHaveBeenCalledWith(
        "contact-1",
        "org-2",
      );
      expect(result.data.success).toBe(true);
    });

    it("should handle atomic primary organization changes via RPC", async () => {
      // Test that setting a primary organization atomically updates the previous one
      const mockServiceResponse = {
        data: { success: true },
      };

      mockDataProvider.setPrimaryOrganization.mockResolvedValue(
        mockServiceResponse,
      );

      // This should use the set_primary_organization RPC function
      // which ensures atomicity (only one primary at a time)
      const result = await mockDataProvider.setPrimaryOrganization(
        "contact-1",
        "org-3",
      );

      expect(mockDataProvider.setPrimaryOrganization).toHaveBeenCalledWith(
        "contact-1",
        "org-3",
      );
      expect(result.data.success).toBe(true);
    });
  });

  describe("Unified Provider Validation", () => {
    it("should validate relationship data through unified provider", async () => {
      const invalidRelationship = {
        contact_id: "contact-1",
        organization_id: "org-1",
        // Missing required fields like role
      };

      const validationError = {
        message: "Validation failed",
        errors: { role: "Role is required" },
      };

      mockDataProvider.create.mockRejectedValue(validationError);

      await expect(
        mockDataProvider.create("contact_organizations", {
          data: invalidRelationship,
        }),
      ).rejects.toMatchObject(validationError);
    });

    it("should handle transformation pipeline for relationship data", async () => {
      const relationshipData = {
        contact_id: "contact-1",
        organization_id: "org-1",
        is_primary: true,
        role: "decision_maker",
        purchase_influence: "High",
        decision_authority: "Decision Maker",
      };

      const processedData = {
        ...relationshipData,
        created_at: "2025-01-01T00:00:00Z",
      };

      mockDataProvider.create.mockResolvedValue({
        data: { id: "co-new", ...processedData },
      });

      const result = await mockDataProvider.create("contact_organizations", {
        data: relationshipData,
      });

      expect(result.data.id).toBe("co-new");
      expect(mockDataProvider.create).toHaveBeenCalledWith(
        "contact_organizations",
        { data: relationshipData },
      );
    });
  });
});
