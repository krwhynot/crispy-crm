/**
 * Unit tests for organization CSV import business logic
 * Target: >70% coverage
 */

import { describe, it, expect } from "vitest";
import {
  detectDuplicateOrganizations,
  applyDataQualityTransformations,
  validateTransformedOrganizations,
  type OrganizationImportSchema,
} from "./organizationImport.logic";

describe("detectDuplicateOrganizations", () => {
  it("should detect duplicate organizations by name (case-insensitive)", () => {
    const orgs: OrganizationImportSchema[] = [
      { name: "Acme Corp" },
      { name: "Tech Solutions" },
      { name: "ACME CORP" }, // Duplicate (case-insensitive)
      { name: "Tech Solutions" }, // Duplicate (exact match)
    ];

    const result = detectDuplicateOrganizations(orgs, "name");

    expect(result.duplicates.length).toBe(2); // Two duplicate groups
    expect(result.totalDuplicates).toBe(2); // 2 actual duplicate entries (excluding first occurrences)

    // Check Acme Corp group
    const acmeGroup = result.duplicates.find((d) => d.name.toLowerCase().includes("acme"));
    expect(acmeGroup).toBeDefined();
    expect(acmeGroup?.count).toBe(2);
    expect(acmeGroup?.indices).toContain(0);
    expect(acmeGroup?.indices).toContain(2);

    // Check Tech Solutions group
    const techGroup = result.duplicates.find((d) => d.name.includes("Tech Solutions"));
    expect(techGroup).toBeDefined();
    expect(techGroup?.count).toBe(2);
    expect(techGroup?.indices).toContain(1);
    expect(techGroup?.indices).toContain(3);
  });

  it("should handle trimming in duplicate detection", () => {
    const orgs: OrganizationImportSchema[] = [
      { name: "  Acme Corp  " },
      { name: "Acme Corp" },
      { name: "ACME CORP   " },
    ];

    const result = detectDuplicateOrganizations(orgs, "name");

    expect(result.duplicates.length).toBe(1);
    expect(result.duplicates[0].count).toBe(3);
  });

  it("should return empty result when no duplicates exist", () => {
    const orgs: OrganizationImportSchema[] = [
      { name: "Unique Company 1" },
      { name: "Unique Company 2" },
      { name: "Unique Company 3" },
    ];

    const result = detectDuplicateOrganizations(orgs, "name");

    expect(result.duplicates.length).toBe(0);
    expect(result.totalDuplicates).toBe(0);
  });

  it("should skip organizations without names", () => {
    const orgs: OrganizationImportSchema[] = [
      { name: "Valid Company" },
      { name: "" }, // Empty name
      { name: "Valid Company" }, // Duplicate
      { name: undefined as unknown as string }, // Missing name
    ];

    const result = detectDuplicateOrganizations(orgs, "name");

    expect(result.duplicates.length).toBe(1);
    expect(result.duplicates[0].count).toBe(2);
    expect(result.duplicates[0].indices).toEqual([0, 2]);
  });

  it("should sort duplicates by count (descending)", () => {
    const orgs: OrganizationImportSchema[] = [
      { name: "Two Dupes" },
      { name: "Three Dupes" },
      { name: "Two Dupes" },
      { name: "Three Dupes" },
      { name: "Three Dupes" },
    ];

    const result = detectDuplicateOrganizations(orgs, "name");

    expect(result.duplicates.length).toBe(2);
    expect(result.duplicates[0].count).toBe(3); // Three Dupes first
    expect(result.duplicates[1].count).toBe(2); // Two Dupes second
  });

  it("should handle large groups of duplicates", () => {
    const orgs: OrganizationImportSchema[] = Array(100).fill({ name: "Same Name" });

    const result = detectDuplicateOrganizations(orgs, "name");

    expect(result.duplicates.length).toBe(1);
    expect(result.duplicates[0].count).toBe(100);
    expect(result.totalDuplicates).toBe(99); // 100 occurrences = 99 duplicates (excluding first)
  });

  it("should throw error for unsupported strategy", () => {
    const orgs: OrganizationImportSchema[] = [{ name: "Test" }];

    expect(() => {
      detectDuplicateOrganizations(orgs, "email" as unknown as "name");
    }).toThrow("Unsupported duplicate detection strategy: email");
  });
});

describe("applyDataQualityTransformations", () => {
  it("should pass through organizations unchanged (placeholder)", () => {
    const orgs: OrganizationImportSchema[] = [
      { name: "Company A", phone: "555-1234" },
      { name: "Company B", phone: "555-5678" },
    ];

    const result = applyDataQualityTransformations(orgs, {});

    expect(result.transformedOrganizations.length).toBe(2);
    expect(result.transformedOrganizations[0]).toEqual(orgs[0]);
    expect(result.transformedOrganizations[1]).toEqual(orgs[1]);
    expect(result.transformationCount).toBe(0);
  });

  it("should not mutate original organizations array", () => {
    const orgs: OrganizationImportSchema[] = [{ name: "Original Company" }];

    const result = applyDataQualityTransformations(orgs, {});

    // Modify transformed result
    result.transformedOrganizations[0].name = "Modified Company";

    // Original should be unchanged
    expect(orgs[0].name).toBe("Original Company");
  });

  it("should provide wasTransformed function", () => {
    const orgs: OrganizationImportSchema[] = [{ name: "Company A" }, { name: "Company B" }];

    const result = applyDataQualityTransformations(orgs, {});

    // Currently no transformations happen
    expect(result.wasTransformed(0)).toBe(false);
    expect(result.wasTransformed(1)).toBe(false);
  });

  it("should handle empty array", () => {
    const result = applyDataQualityTransformations([], {});

    expect(result.transformedOrganizations).toEqual([]);
    expect(result.transformationCount).toBe(0);
  });
});

describe("validateTransformedOrganizations", () => {
  it("should validate all successful organizations", () => {
    const orgs: OrganizationImportSchema[] = [
      { name: "Valid Company 1" },
      { name: "Valid Company 2" },
      { name: "Valid Company 3" },
    ];

    const result = validateTransformedOrganizations(orgs);

    expect(result.successful.length).toBe(3);
    expect(result.failed.length).toBe(0);
    expect(result.successful[0].originalIndex).toBe(0);
    expect(result.successful[1].originalIndex).toBe(1);
    expect(result.successful[2].originalIndex).toBe(2);
  });

  it("should separate successful and failed validations", () => {
    const orgs: OrganizationImportSchema[] = [
      { name: "Valid Company" },
      { name: "" }, // Invalid - empty name
      { name: "Another Valid Company" },
      { name: undefined as unknown as string }, // Invalid - missing name
    ];

    const result = validateTransformedOrganizations(orgs);

    expect(result.successful.length).toBe(2);
    expect(result.failed.length).toBe(2);

    // Check successful indices
    expect(result.successful[0].originalIndex).toBe(0);
    expect(result.successful[1].originalIndex).toBe(2);

    // Check failed indices
    expect(result.failed[0].originalIndex).toBe(1);
    expect(result.failed[1].originalIndex).toBe(3);
  });

  it("should include error details for failed validations", () => {
    const orgs: OrganizationImportSchema[] = [
      { name: "" }, // Invalid
    ];

    const result = validateTransformedOrganizations(orgs);

    expect(result.failed.length).toBe(1);
    expect(result.failed[0].errors.length).toBeGreaterThan(0);
    expect(result.failed[0].errors[0]).toHaveProperty("field");
    expect(result.failed[0].errors[0]).toHaveProperty("message");
    expect(result.failed[0].errors.some((err) => err.field === "name")).toBe(true);
  });

  it("should preserve original data in failed validations", () => {
    const orgs: OrganizationImportSchema[] = [
      { name: "", priority: "A" as unknown as OrganizationImportSchema["priority"] },
    ];

    const result = validateTransformedOrganizations(orgs);

    expect(result.failed[0].data).toEqual(orgs[0]);
  });

  it("should handle empty array", () => {
    const result = validateTransformedOrganizations([]);

    expect(result.successful.length).toBe(0);
    expect(result.failed.length).toBe(0);
  });

  it("should include originalIndex in successful records", () => {
    const orgs: OrganizationImportSchema[] = [{ name: "Company A" }, { name: "Company B" }];

    const result = validateTransformedOrganizations(orgs);

    expect(result.successful[0]).toHaveProperty("originalIndex", 0);
    expect(result.successful[1]).toHaveProperty("originalIndex", 1);
  });

  it("should handle all failed validations", () => {
    const orgs: OrganizationImportSchema[] = [
      { name: "" },
      { name: undefined as any },
      { name: "" },
    ];

    const result = validateTransformedOrganizations(orgs);

    expect(result.successful.length).toBe(0);
    expect(result.failed.length).toBe(3);
  });

  it("should validate complex organization records", () => {
    const orgs: OrganizationImportSchema[] = [
      {
        name: "Complex Org",
        priority: "A",
        phone: "555-123-4567",
        address: "123 Main St",
        city: "New York",
        state: "NY",
        postal_code: "10001",
        linkedin_url: "https://www.linkedin.com/company/complex-org",
        website: "https://www.complex.com",
        organization_type: "customer",
        description: "A complex organization record",
      },
    ];

    const result = validateTransformedOrganizations(orgs);

    expect(result.successful.length).toBe(1);
    expect(result.failed.length).toBe(0);
    expect(result.successful[0].name).toBe("Complex Org");
  });
});

describe("Integration: Full import workflow", () => {
  it("should handle complete CSV import workflow", () => {
    // Step 1: Raw CSV data (after sanitization)
    const rawOrgs: OrganizationImportSchema[] = [
      { name: "Company A", priority: "A" },
      { name: "Company B", priority: "B" },
      { name: "company a" }, // Duplicate
    ];

    // Step 2: Detect duplicates
    const duplicateReport = detectDuplicateOrganizations(rawOrgs, "name");
    expect(duplicateReport.duplicates.length).toBe(1);
    expect(duplicateReport.duplicates[0].count).toBe(2);

    // Step 3: Apply transformations
    const transformResult = applyDataQualityTransformations(rawOrgs, {});
    expect(transformResult.transformedOrganizations.length).toBe(3);

    // Step 4: Validate transformed organizations
    const validationResult = validateTransformedOrganizations(
      transformResult.transformedOrganizations
    );

    expect(validationResult.successful.length).toBe(3);
    expect(validationResult.failed.length).toBe(0);
  });

  it("should handle workflow with validation failures", () => {
    const rawOrgs: OrganizationImportSchema[] = [
      { name: "Valid Company" },
      { name: "" }, // Will fail validation
      { name: "Another Valid" },
    ];

    const transformResult = applyDataQualityTransformations(rawOrgs, {});
    const validationResult = validateTransformedOrganizations(
      transformResult.transformedOrganizations
    );

    expect(validationResult.successful.length).toBe(2);
    expect(validationResult.failed.length).toBe(1);
    expect(validationResult.failed[0].originalIndex).toBe(1);
  });
});
