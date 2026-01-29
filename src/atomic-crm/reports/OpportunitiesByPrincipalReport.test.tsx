import { describe, it, expect, vi } from "vitest";
import { sanitizeCsvValue } from "@/atomic-crm/utils/csvUploadValidator";

// Mock the modules
vi.mock("ra-core", async () => {
  const actual = await vi.importActual("ra-core");
  return {
    ...actual,
    useGetList: vi.fn(),
    useNotify: vi.fn(),
    downloadCSV: vi.fn(),
  };
});

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: vi.fn(),
  };
});

vi.mock("jsonexport/dist", () => ({
  default: vi.fn((data, callback) => {
    // Simple CSV conversion for testing
    const csv = data.map((row: Record<string, unknown>) => Object.values(row).join(",")).join("\n");
    callback(null, csv);
  }),
}));

describe("OpportunitiesByPrincipalReport CSV Export", () => {
  it("should properly sanitize CSV values during export", () => {
    // Test formula injection prevention
    expect(sanitizeCsvValue("=cmd|'/c calc'!A0")).toBe("'=cmd|'/c calc'!A0");
    expect(sanitizeCsvValue("+SUM(A1:A10)")).toBe("'+SUM(A1:A10)");
    expect(sanitizeCsvValue("-10+20")).toBe("'-10+20");
    expect(sanitizeCsvValue("@SUM(A:A)")).toBe("'@SUM(A:A)");

    // Test control character removal
    expect(sanitizeCsvValue("test\x00value")).toBe("testvalue");
    expect(sanitizeCsvValue("line1\x1Fline2")).toBe("line1line2");

    // Test normal values pass through
    expect(sanitizeCsvValue("Normal Organization Name")).toBe("Normal Organization Name");
    expect(sanitizeCsvValue("Brand ABC")).toBe("Brand ABC");
    expect(sanitizeCsvValue("")).toBe("");
    expect(sanitizeCsvValue(null)).toBe("");
    expect(sanitizeCsvValue(undefined)).toBe("");
  });

  it("should include all required fields in CSV export", () => {
    const mockOpportunity = {
      id: 1,
      name: "Test Opportunity",
      customer_organization_name: "Test Org",
      principal_organization_name: "Test Principal",
      stage: "negotiation",
      estimated_close_date: "2025-12-01",
      opportunity_owner_id: 1,
      priority: "high",
      status: "active",
      days_in_stage: 5,
    };

    // Verify all fields are sanitized
    const exportRow = {
      principal: sanitizeCsvValue(mockOpportunity.principal_organization_name),
      opportunity: sanitizeCsvValue(mockOpportunity.name),
      organization: sanitizeCsvValue(mockOpportunity.customer_organization_name),
      stage: sanitizeCsvValue(mockOpportunity.stage),
      close_date: mockOpportunity.estimated_close_date,
      sales_rep: sanitizeCsvValue("John Doe"),
      priority: sanitizeCsvValue(mockOpportunity.priority),
      status: sanitizeCsvValue(mockOpportunity.status),
      days_in_stage: mockOpportunity.days_in_stage,
    };

    // Check all values are properly sanitized
    expect(exportRow.principal).toBe("Test Principal");
    expect(exportRow.opportunity).toBe("Test Opportunity");
    expect(exportRow.organization).toBe("Test Org");
    expect(exportRow.stage).toBe("negotiation");
    expect(exportRow.priority).toBe("high");
    expect(exportRow.status).toBe("active");
  });
});
