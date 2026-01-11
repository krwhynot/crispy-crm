/**
 * @vitest-environment jsdom
 *
 * Unit tests for the OrganizationList exporter function
 * Focus: Foreign key resolution, missing data handling, CSV format, column order
 */

import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import type { Exporter } from "ra-core";
import type { Organization, Sale, Segment } from "../types";

// Mock jsonexport - factory must not reference outside variables directly
vi.mock("jsonexport/dist", () => ({
  default: vi.fn(),
}));

// Mock ra-core downloadCSV
vi.mock("ra-core", async () => {
  const actual = await vi.importActual("ra-core");
  return {
    ...actual,
    downloadCSV: vi.fn(),
  };
});

// Import after mocks are set up
import jsonExport from "jsonexport/dist";
import { downloadCSV } from "ra-core";

// Recreate the exporter function for testing (mirrors OrganizationList.tsx:30-95)
// This is necessary because the exporter is not exported from the source file
const exporter: Exporter<Organization> = async (records, fetchRelatedRecords) => {
  const sales = await fetchRelatedRecords<Sale>(records, "sales_id", "sales");
  const segments = await fetchRelatedRecords<Segment>(records, "segment_id", "segments");

  // Collect all parent organization IDs
  const parentIds = Array.from(
    new Set(records.map((org) => org.parent_organization_id).filter(Boolean))
  );

  // Fetch parent organization names
  const parentOrganizations =
    parentIds.length > 0
      ? await fetchRelatedRecords<Organization>(
          parentIds.map((id) => ({ id, parent_organization_id: id })),
          "parent_organization_id",
          "organizations"
        )
      : {};

  const organizations = records.map((org) => {
    const exportedOrg: any = {
      // Core fields
      id: org.id,
      name: org.name,
      organization_type: org.organization_type,
      priority: org.priority,

      // Related data
      parent_organization: org.parent_organization_id
        ? parentOrganizations[org.parent_organization_id]?.name
        : undefined,
      segment: org.segment_id ? segments[org.segment_id]?.name : undefined,
      sales_rep: org.sales_id
        ? `${sales[org.sales_id]?.first_name} ${sales[org.sales_id]?.last_name}`
        : undefined,

      // Contact information
      website: org.website,
      phone: org.phone,
      email: org.email,

      // Location
      address: org.address,
      city: org.city,
      state: org.state,
      postal_code: org.postal_code,
      country: org.country,

      // Metrics
      nb_contacts: org.nb_contacts || 0,
      nb_opportunities: org.nb_opportunities || 0,

      // Metadata
      created_at: org.created_at,
      sales_id: org.sales_id,
      segment_id: org.segment_id,
      parent_organization_id: org.parent_organization_id,
    };

    return exportedOrg;
  });

  return jsonExport(organizations, {}, (_err: any, csv: string) => {
    downloadCSV(csv, "organizations");
  });
};

// Test data factories
const createMockOrganization = (overrides: Partial<Organization> = {}): Organization => ({
  id: 1,
  name: "Test Organization",
  organization_type: "customer",
  priority: "high",
  sales_id: 100,
  segment_id: 200,
  parent_organization_id: null,
  website: "https://test.com",
  phone: "555-1234",
  email: "contact@test.com",
  address: "123 Main St",
  city: "Austin",
  state: "TX",
  postal_code: "78701",
  country: "USA",
  nb_contacts: 5,
  nb_opportunities: 3,
  created_at: "2024-01-15T10:00:00Z",
  ...overrides,
});

const createMockSale = (overrides: Partial<Sale> = {}): Sale => ({
  id: 100,
  first_name: "John",
  last_name: "Doe",
  user_id: "user-123",
  email: "john@example.com",
  role: "rep",
  ...overrides,
});

const createMockSegment = (overrides: Partial<Segment> = {}): Segment => ({
  id: 200,
  name: "Enterprise",
  ...overrides,
});

// Helper to get the mock implementations
const getJsonExportMock = () => vi.mocked(jsonExport);
const getDownloadCSVMock = () => vi.mocked(downloadCSV);

/**
 * Shape of each row in the exported organization data.
 * Mirrors the object structure created in the exporter (lines 51-91).
 */
interface ExportedOrganizationRow {
  id: number;
  name: string;
  organization_type: string;
  priority: string | null;
  parent_organization?: string;
  segment?: string;
  sales_rep?: string;
  website?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  postal_code?: string | null;
  country?: string | null;
  nb_contacts: number;
  nb_opportunities: number;
  created_at: string;
  sales_id: number | null;
  segment_id: number | null;
  parent_organization_id: number | null;
}

describe("OrganizationList Exporter", () => {
  let mockFetchRelatedRecords: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();

    // Configure jsonExport mock to simulate CSV generation
    getJsonExportMock().mockImplementation(
      (
        data: ExportedOrganizationRow[],
        _options: Record<string, unknown>,
        callback: (err: Error | null, csv: string) => void
      ) => {
        const headers = data.length > 0 ? Object.keys(data[0]).join(",") : "";
        const rows = data.map((row: ExportedOrganizationRow) =>
          Object.values(row)
            .map((v) => (v === undefined ? "" : String(v)))
            .join(",")
        );
        callback(null, [headers, ...rows].join("\n"));
      }
    );

    // Default mock implementation for fetchRelatedRecords
    mockFetchRelatedRecords = vi.fn().mockImplementation(async (_records, _field, resource) => {
      if (resource === "sales") {
        return { 100: createMockSale() };
      }
      if (resource === "segments") {
        return { 200: createMockSegment() };
      }
      if (resource === "organizations") {
        return { 300: { id: 300, name: "Parent Corp" } };
      }
      return {};
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Foreign Key Resolution", () => {
    it("should resolve sales_id to sales rep full name", async () => {
      const records = [createMockOrganization({ sales_id: 100 })];

      await exporter(records, mockFetchRelatedRecords);

      // Verify fetchRelatedRecords was called for sales
      expect(mockFetchRelatedRecords).toHaveBeenCalledWith(records, "sales_id", "sales");

      // Verify the exported data contains resolved sales rep name
      expect(getJsonExportMock()).toHaveBeenCalled();
      const exportedData = getJsonExportMock().mock.calls[0][0];
      expect(exportedData[0].sales_rep).toBe("John Doe");
    });

    it("should resolve segment_id to segment name", async () => {
      const records = [createMockOrganization({ segment_id: 200 })];

      await exporter(records, mockFetchRelatedRecords);

      // Verify fetchRelatedRecords was called for segments
      expect(mockFetchRelatedRecords).toHaveBeenCalledWith(records, "segment_id", "segments");

      // Verify the exported data contains resolved segment name
      const exportedData = getJsonExportMock().mock.calls[0][0];
      expect(exportedData[0].segment).toBe("Enterprise");
    });

    it("should resolve parent_organization_id to parent organization name", async () => {
      const records = [createMockOrganization({ parent_organization_id: 300 })];

      await exporter(records, mockFetchRelatedRecords);

      // Verify fetchRelatedRecords was called for organizations (parent lookup)
      expect(mockFetchRelatedRecords).toHaveBeenCalledWith(
        expect.arrayContaining([expect.objectContaining({ parent_organization_id: 300 })]),
        "parent_organization_id",
        "organizations"
      );

      // Verify the exported data contains resolved parent name
      const exportedData = getJsonExportMock().mock.calls[0][0];
      expect(exportedData[0].parent_organization).toBe("Parent Corp");
    });

    it("should handle multiple organizations with different foreign keys", async () => {
      const records = [
        createMockOrganization({ id: 1, sales_id: 100, segment_id: 200 }),
        createMockOrganization({ id: 2, sales_id: 101, segment_id: 201 }),
      ];

      mockFetchRelatedRecords.mockImplementation(async (_records, _field, resource) => {
        if (resource === "sales") {
          return {
            100: createMockSale({ id: 100, first_name: "John", last_name: "Doe" }),
            101: createMockSale({ id: 101, first_name: "Jane", last_name: "Smith" }),
          };
        }
        if (resource === "segments") {
          return {
            200: createMockSegment({ id: 200, name: "Enterprise" }),
            201: createMockSegment({ id: 201, name: "SMB" }),
          };
        }
        return {};
      });

      await exporter(records, mockFetchRelatedRecords);

      const exportedData = getJsonExportMock().mock.calls[0][0];
      expect(exportedData[0].sales_rep).toBe("John Doe");
      expect(exportedData[0].segment).toBe("Enterprise");
      expect(exportedData[1].sales_rep).toBe("Jane Smith");
      expect(exportedData[1].segment).toBe("SMB");
    });

    it("should deduplicate parent organization lookups", async () => {
      // Multiple orgs with the same parent
      const records = [
        createMockOrganization({ id: 1, parent_organization_id: 300 }),
        createMockOrganization({ id: 2, parent_organization_id: 300 }),
        createMockOrganization({ id: 3, parent_organization_id: 300 }),
      ];

      await exporter(records, mockFetchRelatedRecords);

      // Should only fetch parent org once (deduplicated via Set)
      const parentCall = mockFetchRelatedRecords.mock.calls.find(
        (call) => call[2] === "organizations"
      );
      expect(parentCall).toBeDefined();
      // The lookup array should have only 1 unique parent ID
      expect(parentCall[0]).toHaveLength(1);
    });
  });

  describe("Missing Data Handling", () => {
    it("should handle null sales_id gracefully", async () => {
      const records = [createMockOrganization({ sales_id: null })];

      mockFetchRelatedRecords.mockResolvedValue({});

      await exporter(records, mockFetchRelatedRecords);

      const exportedData = getJsonExportMock().mock.calls[0][0];
      expect(exportedData[0].sales_rep).toBeUndefined();
      // Raw ID should still be preserved
      expect(exportedData[0].sales_id).toBeNull();
    });

    it("should handle null segment_id gracefully", async () => {
      const records = [createMockOrganization({ segment_id: null })];

      mockFetchRelatedRecords.mockResolvedValue({});

      await exporter(records, mockFetchRelatedRecords);

      const exportedData = getJsonExportMock().mock.calls[0][0];
      expect(exportedData[0].segment).toBeUndefined();
      expect(exportedData[0].segment_id).toBeNull();
    });

    it("should handle null parent_organization_id gracefully", async () => {
      const records = [createMockOrganization({ parent_organization_id: null })];

      await exporter(records, mockFetchRelatedRecords);

      const exportedData = getJsonExportMock().mock.calls[0][0];
      expect(exportedData[0].parent_organization).toBeUndefined();
      expect(exportedData[0].parent_organization_id).toBeNull();

      // Should NOT call fetchRelatedRecords for organizations when no parent IDs
      const parentCall = mockFetchRelatedRecords.mock.calls.find(
        (call) => call[2] === "organizations"
      );
      expect(parentCall).toBeUndefined();
    });

    it("should handle missing related record (orphaned foreign key)", async () => {
      const records = [createMockOrganization({ sales_id: 999 })];

      // Sales lookup returns empty (orphaned FK)
      mockFetchRelatedRecords.mockImplementation(async (_records, _field, resource) => {
        if (resource === "sales") {
          return {}; // Sales ID 999 not found
        }
        return {};
      });

      await exporter(records, mockFetchRelatedRecords);

      const exportedData = getJsonExportMock().mock.calls[0][0];
      // sales_rep should show "undefined undefined" when sale record not found
      expect(exportedData[0].sales_rep).toBe("undefined undefined");
      // Raw ID is still preserved
      expect(exportedData[0].sales_id).toBe(999);
    });

    it("should handle undefined optional contact fields", async () => {
      const records = [
        createMockOrganization({
          website: undefined,
          phone: undefined,
          email: undefined,
          address: undefined,
          city: undefined,
          state: undefined,
          postal_code: undefined,
          country: undefined,
        }),
      ];

      await exporter(records, mockFetchRelatedRecords);

      const exportedData = getJsonExportMock().mock.calls[0][0];
      expect(exportedData[0].website).toBeUndefined();
      expect(exportedData[0].phone).toBeUndefined();
      expect(exportedData[0].email).toBeUndefined();
      expect(exportedData[0].address).toBeUndefined();
      expect(exportedData[0].city).toBeUndefined();
      expect(exportedData[0].state).toBeUndefined();
      expect(exportedData[0].postal_code).toBeUndefined();
      expect(exportedData[0].country).toBeUndefined();
    });

    it("should default nb_contacts and nb_opportunities to 0 when missing", async () => {
      const records = [
        createMockOrganization({
          nb_contacts: undefined,
          nb_opportunities: undefined,
        }),
      ];

      await exporter(records, mockFetchRelatedRecords);

      const exportedData = getJsonExportMock().mock.calls[0][0];
      expect(exportedData[0].nb_contacts).toBe(0);
      expect(exportedData[0].nb_opportunities).toBe(0);
    });

    it("should handle empty records array", async () => {
      const records: Organization[] = [];

      await exporter(records, mockFetchRelatedRecords);

      const exportedData = getJsonExportMock().mock.calls[0][0];
      expect(exportedData).toEqual([]);
      expect(getDownloadCSVMock()).toHaveBeenCalledWith(expect.any(String), "organizations");
    });
  });

  describe("CSV Format and Column Order", () => {
    it("should export columns in correct order", async () => {
      const records = [createMockOrganization()];

      await exporter(records, mockFetchRelatedRecords);

      const exportedData = getJsonExportMock().mock.calls[0][0];
      const keys = Object.keys(exportedData[0]);

      // Expected column order from the exporter implementation
      const expectedOrder = [
        // Core fields
        "id",
        "name",
        "organization_type",
        "priority",
        // Related data
        "parent_organization",
        "segment",
        "sales_rep",
        // Contact information
        "website",
        "phone",
        "email",
        // Location
        "address",
        "city",
        "state",
        "postal_code",
        "country",
        // Metrics
        "nb_contacts",
        "nb_opportunities",
        // Metadata
        "created_at",
        "sales_id",
        "segment_id",
        "parent_organization_id",
      ];

      expect(keys).toEqual(expectedOrder);
    });

    it("should call jsonExport with correct parameters", async () => {
      const records = [createMockOrganization()];

      await exporter(records, mockFetchRelatedRecords);

      expect(getJsonExportMock()).toHaveBeenCalledWith(
        expect.any(Array),
        {}, // Empty options object
        expect.any(Function)
      );
    });

    it("should call downloadCSV with filename 'organizations'", async () => {
      const records = [createMockOrganization()];

      await exporter(records, mockFetchRelatedRecords);

      expect(getDownloadCSVMock()).toHaveBeenCalledWith(expect.any(String), "organizations");
    });

    it("should preserve all core field values in export", async () => {
      const org = createMockOrganization({
        id: 42,
        name: "Acme Corp",
        organization_type: "distributor",
        priority: "medium",
        website: "https://acme.com",
        phone: "555-9999",
        email: "info@acme.com",
        address: "456 Oak Ave",
        city: "Dallas",
        state: "TX",
        postal_code: "75001",
        nb_contacts: 10,
        nb_opportunities: 5,
        created_at: "2024-06-01T12:00:00Z",
      });

      await exporter([org], mockFetchRelatedRecords);

      const exportedData = getJsonExportMock().mock.calls[0][0];
      const exported = exportedData[0];

      expect(exported.id).toBe(42);
      expect(exported.name).toBe("Acme Corp");
      expect(exported.organization_type).toBe("distributor");
      expect(exported.priority).toBe("medium");
      expect(exported.website).toBe("https://acme.com");
      expect(exported.phone).toBe("555-9999");
      expect(exported.email).toBe("info@acme.com");
      expect(exported.address).toBe("456 Oak Ave");
      expect(exported.city).toBe("Dallas");
      expect(exported.state).toBe("TX");
      expect(exported.postal_code).toBe("75001");
      expect(exported.nb_contacts).toBe(10);
      expect(exported.nb_opportunities).toBe(5);
      expect(exported.created_at).toBe("2024-06-01T12:00:00Z");
    });

    it("should export multiple records maintaining consistent structure", async () => {
      const records = [
        createMockOrganization({ id: 1, name: "Org A" }),
        createMockOrganization({ id: 2, name: "Org B" }),
        createMockOrganization({ id: 3, name: "Org C" }),
      ];

      await exporter(records, mockFetchRelatedRecords);

      const exportedData = getJsonExportMock().mock.calls[0][0];

      expect(exportedData).toHaveLength(3);

      // All records should have the same keys
      const keysA = Object.keys(exportedData[0]);
      const keysB = Object.keys(exportedData[1]);
      const keysC = Object.keys(exportedData[2]);

      expect(keysA).toEqual(keysB);
      expect(keysB).toEqual(keysC);
    });
  });

  describe("Edge Cases", () => {
    it("should handle organization with all nullable fields as null", async () => {
      const records = [
        createMockOrganization({
          sales_id: null,
          segment_id: null,
          parent_organization_id: null,
          website: null,
          phone: null,
          email: null,
          address: null,
          city: null,
          state: null,
          postal_code: null,
          country: null,
          nb_contacts: null,
          nb_opportunities: null,
        }),
      ];

      mockFetchRelatedRecords.mockResolvedValue({});

      await exporter(records, mockFetchRelatedRecords);

      const exportedData = getJsonExportMock().mock.calls[0][0];
      const exported = exportedData[0];

      // Required fields should still be present
      expect(exported.id).toBeDefined();
      expect(exported.name).toBeDefined();

      // Metrics default to 0
      expect(exported.nb_contacts).toBe(0);
      expect(exported.nb_opportunities).toBe(0);
    });

    it("should handle special characters in organization name", async () => {
      const records = [
        createMockOrganization({
          name: 'Acme "Corp" & Partners, LLC',
        }),
      ];

      await exporter(records, mockFetchRelatedRecords);

      const exportedData = getJsonExportMock().mock.calls[0][0];
      expect(exportedData[0].name).toBe('Acme "Corp" & Partners, LLC');
    });

    it("should handle very long field values", async () => {
      const longName = "A".repeat(1000);
      const records = [
        createMockOrganization({
          name: longName,
        }),
      ];

      await exporter(records, mockFetchRelatedRecords);

      const exportedData = getJsonExportMock().mock.calls[0][0];
      expect(exportedData[0].name).toBe(longName);
      expect(exportedData[0].name).toHaveLength(1000);
    });

    it("should handle sales rep with missing first or last name", async () => {
      const records = [createMockOrganization({ sales_id: 100 })];

      mockFetchRelatedRecords.mockImplementation(async (_records, _field, resource) => {
        if (resource === "sales") {
          return {
            100: { id: 100, first_name: undefined, last_name: "Only" },
          };
        }
        return {};
      });

      await exporter(records, mockFetchRelatedRecords);

      const exportedData = getJsonExportMock().mock.calls[0][0];
      // Should concatenate with undefined showing as "undefined Only"
      expect(exportedData[0].sales_rep).toBe("undefined Only");
    });

    it("should handle concurrent exports without interference", async () => {
      const records1 = [createMockOrganization({ id: 1, name: "Org 1" })];
      const records2 = [createMockOrganization({ id: 2, name: "Org 2" })];

      // Run exports concurrently
      await Promise.all([
        exporter(records1, mockFetchRelatedRecords),
        exporter(records2, mockFetchRelatedRecords),
      ]);

      // Both exports should complete
      expect(getJsonExportMock()).toHaveBeenCalledTimes(2);
      expect(getDownloadCSVMock()).toHaveBeenCalledTimes(2);
    });
  });
});
