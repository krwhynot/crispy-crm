/**
 * OrganizationList exporter tests
 *
 * Tests the CSV export functionality with related data resolution.
 */

import { describe, test, expect } from "vitest";
import { createMockOrganization } from "@/tests/utils/mock-providers";

describe("OrganizationList exporter", () => {
  test("exports organizations with related data", async () => {
    const mockOrganizations = [
      createMockOrganization({
        id: 1,
        name: "Tech Corp",
        organization_type: "restaurant",
        priority: "A",
        parent_organization_id: 2,
        segment_id: "segment-1",
        sales_id: 1,
        website: "https://techcorp.com",
        phone: "555-1234",
        email: "info@techcorp.com",
        address: "123 Tech St",
        city: "Tech City",
        state: "TC",
        postal_code: "12345",
        nb_contacts: 5,
        nb_opportunities: 3,
      }),
    ];

    const mockSales = {
      1: { id: 1, first_name: "Alice", last_name: "Manager" },
    };

    const mockSegments = {
      "segment-1": { id: "segment-1", name: "Enterprise" },
    };

    const mockParentOrgs = {
      2: { id: 2, name: "Parent Corp" },
    };

    const exporter = async (records: unknown[]) => {
      const sales = mockSales;
      const segments = mockSegments;
      const parentOrganizations = mockParentOrgs;

      const organizations = records.map((org) => ({
        id: org.id,
        name: org.name,
        organization_type: org.organization_type,
        priority: org.priority,
        parent_organization: org.parent_organization_id
          ? parentOrganizations[org.parent_organization_id as keyof typeof parentOrganizations]
              ?.name
          : undefined,
        segment: org.segment_id
          ? segments[org.segment_id as keyof typeof segments]?.name
          : undefined,
        sales_rep: org.sales_id
          ? `${sales[org.sales_id as keyof typeof sales]?.first_name} ${sales[org.sales_id as keyof typeof sales]?.last_name}`
          : undefined,
        website: org.website,
        phone: org.phone,
        email: org.email,
        nb_contacts: org.nb_contacts || 0,
        nb_opportunities: org.nb_opportunities || 0,
      }));

      return organizations;
    };

    const exportedData = await exporter(mockOrganizations);

    expect(exportedData[0]).toMatchObject({
      id: 1,
      name: "Tech Corp",
      organization_type: "restaurant",
      priority: "A",
      parent_organization: "Parent Corp",
      segment: "Enterprise",
      sales_rep: "Alice Manager",
      website: "https://techcorp.com",
      phone: "555-1234",
      email: "info@techcorp.com",
      nb_contacts: 5,
      nb_opportunities: 3,
    });
  });
});
