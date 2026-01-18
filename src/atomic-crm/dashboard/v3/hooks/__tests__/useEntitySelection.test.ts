import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useEntitySelection } from "../useEntitySelection";
import type { Contact, Organization, Opportunity } from "../useEntityData";

describe("useEntitySelection", () => {
  const mockSetValue = vi.fn();
  const mockGetValues = vi.fn();
  const mockNotify = vi.fn();

  const mockStores: {
    contacts: Contact[];
    organizations: Organization[];
    opportunities: Opportunity[];
  } = {
    contacts: [
      { id: 1, name: "John", organization_id: 1, company_name: "Acme" },
      { id: 2, name: "Jane", organization_id: 2, company_name: "Tech" },
      { id: 3, name: "Bob", organization_id: undefined, company_name: undefined },
    ],
    organizations: [
      { id: 1, name: "Acme" },
      { id: 2, name: "Tech" },
    ],
    opportunities: [
      { id: 1, name: "Deal 1", customer_organization_id: 1, stage: "new_lead" },
      { id: 2, name: "Deal 2", customer_organization_id: 2, stage: "new_lead" },
      { id: 3, name: "Deal 3", customer_organization_id: undefined, stage: "new_lead" },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockGetValues.mockReturnValue(undefined);
  });

  const renderEntitySelectionHook = () => {
    return renderHook(() =>
      useEntitySelection({
        setValue: mockSetValue,
        getValues: mockGetValues,
        entityStores: mockStores,
        notify: mockNotify,
      })
    );
  };

  describe("handleContactSelect", () => {
    it("auto-fills organizationId when contact has organization_id", () => {
      const { result } = renderEntitySelectionHook();
      const contactWithOrg = mockStores.contacts[0]; // John with org_id 1

      act(() => {
        result.current.handleContactSelect(contactWithOrg);
      });

      expect(mockSetValue).toHaveBeenCalledWith("organizationId", 1);
    });

    it("does not set organizationId when contact has no organization_id", () => {
      const { result } = renderEntitySelectionHook();
      const contactWithoutOrg = mockStores.contacts[2]; // Bob with no org_id

      act(() => {
        result.current.handleContactSelect(contactWithoutOrg);
      });

      expect(mockSetValue).not.toHaveBeenCalled();
    });
  });

  describe("handleContactClear", () => {
    it("clears organizationId", () => {
      const { result } = renderEntitySelectionHook();

      act(() => {
        result.current.handleContactClear();
      });

      expect(mockSetValue).toHaveBeenCalledWith("organizationId", undefined);
    });

    it("clears opportunityId", () => {
      const { result } = renderEntitySelectionHook();

      act(() => {
        result.current.handleContactClear();
      });

      expect(mockSetValue).toHaveBeenCalledWith("opportunityId", undefined);
    });
  });

  describe("handleOrganizationSelect", () => {
    it("clears contactId when contact belongs to different org", () => {
      mockGetValues.mockImplementation((field: string) => {
        if (field === "contactId") return 1; // John belongs to org 1
        if (field === "opportunityId") return undefined;
        return undefined;
      });

      const { result } = renderEntitySelectionHook();
      const differentOrg = mockStores.organizations[1]; // Tech (id: 2)

      act(() => {
        result.current.handleOrganizationSelect(differentOrg);
      });

      expect(mockSetValue).toHaveBeenCalledWith("contactId", undefined);
    });

    it("calls notify when contact is cleared", () => {
      mockGetValues.mockImplementation((field: string) => {
        if (field === "contactId") return 1; // John belongs to org 1
        if (field === "opportunityId") return undefined;
        return undefined;
      });

      const { result } = renderEntitySelectionHook();
      const differentOrg = mockStores.organizations[1]; // Tech (id: 2)

      act(() => {
        result.current.handleOrganizationSelect(differentOrg);
      });

      expect(mockNotify).toHaveBeenCalledWith(
        "Contact cleared - doesn't belong to selected organization",
        { type: "info" }
      );
    });

    it("clears opportunityId when opp belongs to different org", () => {
      mockGetValues.mockImplementation((field: string) => {
        if (field === "contactId") return undefined;
        if (field === "opportunityId") return 1; // Deal 1 belongs to org 1
        return undefined;
      });

      const { result } = renderEntitySelectionHook();
      const differentOrg = mockStores.organizations[1]; // Tech (id: 2)

      act(() => {
        result.current.handleOrganizationSelect(differentOrg);
      });

      expect(mockSetValue).toHaveBeenCalledWith("opportunityId", undefined);
    });

    it("keeps contactId when contact belongs to same org", () => {
      mockGetValues.mockImplementation((field: string) => {
        if (field === "contactId") return 1; // John belongs to org 1
        if (field === "opportunityId") return undefined;
        return undefined;
      });

      const { result } = renderEntitySelectionHook();
      const sameOrg = mockStores.organizations[0]; // Acme (id: 1)

      act(() => {
        result.current.handleOrganizationSelect(sameOrg);
      });

      expect(mockSetValue).not.toHaveBeenCalledWith("contactId", undefined);
    });

    it("keeps opportunityId when opp belongs to same org", () => {
      mockGetValues.mockImplementation((field: string) => {
        if (field === "contactId") return undefined;
        if (field === "opportunityId") return 1; // Deal 1 belongs to org 1
        return undefined;
      });

      const { result } = renderEntitySelectionHook();
      const sameOrg = mockStores.organizations[0]; // Acme (id: 1)

      act(() => {
        result.current.handleOrganizationSelect(sameOrg);
      });

      expect(mockSetValue).not.toHaveBeenCalledWith("opportunityId", undefined);
    });

    it("does not call notify when no contact is selected", () => {
      mockGetValues.mockReturnValue(undefined);

      const { result } = renderEntitySelectionHook();
      const org = mockStores.organizations[0];

      act(() => {
        result.current.handleOrganizationSelect(org);
      });

      expect(mockNotify).not.toHaveBeenCalled();
    });
  });

  describe("handleOrganizationClear", () => {
    it("clears opportunityId when opp belonged to cleared org", () => {
      mockGetValues.mockImplementation((field: string) => {
        if (field === "opportunityId") return 1; // Deal 1 belongs to org 1
        if (field === "organizationId") return 1; // Currently selected org is 1
        return undefined;
      });

      const { result } = renderEntitySelectionHook();

      act(() => {
        result.current.handleOrganizationClear();
      });

      expect(mockSetValue).toHaveBeenCalledWith("opportunityId", undefined);
    });

    it("keeps opportunityId when opp did not belong to cleared org", () => {
      mockGetValues.mockImplementation((field: string) => {
        if (field === "opportunityId") return 2; // Deal 2 belongs to org 2
        if (field === "organizationId") return 1; // Currently selected org is 1
        return undefined;
      });

      const { result } = renderEntitySelectionHook();

      act(() => {
        result.current.handleOrganizationClear();
      });

      expect(mockSetValue).not.toHaveBeenCalled();
    });

    it("does not clear opportunityId when no org was selected", () => {
      mockGetValues.mockImplementation((field: string) => {
        if (field === "opportunityId") return 1;
        if (field === "organizationId") return undefined;
        return undefined;
      });

      const { result } = renderEntitySelectionHook();

      act(() => {
        result.current.handleOrganizationClear();
      });

      expect(mockSetValue).not.toHaveBeenCalled();
    });

    it("does not clear opportunityId when no opp was selected", () => {
      mockGetValues.mockImplementation((field: string) => {
        if (field === "opportunityId") return undefined;
        if (field === "organizationId") return 1;
        return undefined;
      });

      const { result } = renderEntitySelectionHook();

      act(() => {
        result.current.handleOrganizationClear();
      });

      expect(mockSetValue).not.toHaveBeenCalled();
    });
  });

  describe("edge cases", () => {
    it("handles contact not found in entity store gracefully", () => {
      mockGetValues.mockImplementation((field: string) => {
        if (field === "contactId") return 999; // Non-existent contact
        if (field === "opportunityId") return undefined;
        return undefined;
      });

      const { result } = renderEntitySelectionHook();
      const org = mockStores.organizations[0];

      act(() => {
        result.current.handleOrganizationSelect(org);
      });

      // Should not crash and should not clear contactId (contact not found)
      expect(mockSetValue).not.toHaveBeenCalledWith("contactId", undefined);
      expect(mockNotify).not.toHaveBeenCalled();
    });

    it("handles opportunity not found in entity store gracefully", () => {
      mockGetValues.mockImplementation((field: string) => {
        if (field === "contactId") return undefined;
        if (field === "opportunityId") return 999; // Non-existent opportunity
        return undefined;
      });

      const { result } = renderEntitySelectionHook();
      const org = mockStores.organizations[0];

      act(() => {
        result.current.handleOrganizationSelect(org);
      });

      // Should not crash and should not clear opportunityId (opp not found)
      expect(mockSetValue).not.toHaveBeenCalledWith("opportunityId", undefined);
    });

    it("works without notify callback", () => {
      const { result } = renderHook(() =>
        useEntitySelection({
          setValue: mockSetValue,
          getValues: mockGetValues,
          entityStores: mockStores,
        })
      );

      mockGetValues.mockImplementation((field: string) => {
        if (field === "contactId") return 1;
        if (field === "opportunityId") return undefined;
        return undefined;
      });

      const differentOrg = mockStores.organizations[1];

      // Should not crash even without notify
      act(() => {
        result.current.handleOrganizationSelect(differentOrg);
      });

      expect(mockSetValue).toHaveBeenCalledWith("contactId", undefined);
    });
  });
});
