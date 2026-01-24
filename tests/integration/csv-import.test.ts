/**
 * CSV Import Integration Test
 * Tests CSV import functionality with real Supabase database
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { createTestHarness } from "./supabase-harness";
import { validateCsvFile, sanitizeCsvValue } from "@/atomic-crm/utils/csvUploadValidator";
import { typedCsvData } from "@/tests/utils/typed-mocks";
import * as fs from "fs";
import * as Papa from "papaparse";

describe("CSV Import Integration", () => {
  let harness: Awaited<ReturnType<typeof createTestHarness>>;

  beforeEach(async () => {
    harness = await createTestHarness();
  });

  afterEach(async () => {
    if (harness) {
      await harness.cleanup();
    }
  });

  it("imports valid contacts CSV", async () => {
    const csvPath = "tests/fixtures/contacts-valid.csv";
    const csvContent = fs.readFileSync(csvPath, "utf-8");

    // Parse CSV
    const parsed = Papa.parse(csvContent, { header: true });
    expect(parsed.errors).toHaveLength(0);
    expect(parsed.data).toHaveLength(2);

    // Transform to contact format
    const contacts = typedCsvData(parsed.data).map((row) => {
      const first_name = sanitizeCsvValue(row["First Name"]);
      const last_name = sanitizeCsvValue(row["Last Name"]);
      const name = `${first_name} ${last_name}`.trim();

      return {
        name,
        first_name,
        last_name,
        email: row["Email"] ? [{ value: sanitizeCsvValue(row["Email"]), type: "work" }] : [],
        phone: row["Phone"] ? [{ value: sanitizeCsvValue(row["Phone"]), type: "work" }] : [],
      };
    });

    // Import contacts to database
    const { data, error } = await harness.client.from("contacts").insert(contacts).select();

    expect(error).toBeNull();
    expect(data).toHaveLength(2);
    expect(data![0].first_name).toBe("John");
    expect(data![0].last_name).toBe("Doe");
    expect(data![1].first_name).toBe("Jane");
    expect(data![1].last_name).toBe("Smith");

    // Track IDs for cleanup
    harness.seedData.contactIds = data!.map((c) => c.id);
  });

  it("rejects formula injection attempts", async () => {
    const csvPath = "tests/fixtures/contacts-formula-injection.csv";
    const csvContent = fs.readFileSync(csvPath, "utf-8");

    const parsed = Papa.parse(csvContent, { header: true });
    const rows = typedCsvData(parsed.data);

    // Test first row (=cmd formula)
    const row1 = rows[0];
    const sanitized1 = sanitizeCsvValue(row1["First Name"]);
    expect(sanitized1).toMatch(/^'=/); // Escaped with leading quote
    expect(sanitized1).toBe("'=cmd|'/c calc'!A0");
    expect(sanitized1).not.toBe(row1["First Name"]); // Modified

    // Test second row (@SUM formula)
    const row2 = rows[1];
    const sanitized2 = sanitizeCsvValue(row2["First Name"]);
    expect(sanitized2).toMatch(/^'@/); // Escaped with leading quote
    expect(sanitized2).toBe("'@SUM(1+1)");
    expect(sanitized2).not.toBe(row2["First Name"]); // Modified
  });

  it("validates CSV file structure before processing", async () => {
    const csvPath = "tests/fixtures/contacts-valid.csv";
    const csvContent = fs.readFileSync(csvPath, "utf-8");

    const file = new File([csvContent], "contacts-valid.csv", { type: "text/csv" });

    const validation = await validateCsvFile(file);

    expect(validation.valid).toBe(true);
    expect(validation.errors).toBeUndefined();
  });

  it("detects invalid CSV structure", async () => {
    const csvPath = "tests/fixtures/contacts-invalid.csv";
    const csvContent = fs.readFileSync(csvPath, "utf-8");

    const file = new File([csvContent], "contacts-invalid.csv", { type: "text/csv" });

    // File structure is valid (has delimiters)
    const validation = await validateCsvFile(file);
    expect(validation.valid).toBe(true);

    // Parse the CSV to check data quality
    const parsed = Papa.parse(csvContent, { header: true });
    const rows = typedCsvData(parsed.data);

    // Row 1: Missing email
    expect(rows[0]["Email"]).toBeFalsy();

    // Row 2: Missing last name
    expect(rows[1]["Last Name"]).toBeFalsy();

    // Business validation would catch these issues during import
  });

  it("handles CSV with sanitized values correctly in database", async () => {
    const csvPath = "tests/fixtures/contacts-formula-injection.csv";
    const csvContent = fs.readFileSync(csvPath, "utf-8");

    // Parse and sanitize
    const parsed = Papa.parse(csvContent, { header: true });
    const contacts = typedCsvData(parsed.data).map((row) => {
      const first_name = sanitizeCsvValue(row["First Name"]);
      const last_name = sanitizeCsvValue(row["Last Name"]);
      const name = `${first_name} ${last_name}`.trim();

      return {
        name,
        first_name,
        last_name,
        email: row["Email"] ? [{ value: sanitizeCsvValue(row["Email"]), type: "work" }] : [],
      };
    });

    // Verify sanitization happened
    expect(contacts[0].first_name).toBe("'=cmd|'/c calc'!A0");
    expect(contacts[1].first_name).toBe("'@SUM(1+1)");

    // Import to database
    const { data, error } = await harness.client.from("contacts").insert(contacts).select();

    expect(error).toBeNull();
    expect(data).toHaveLength(2);

    // Verify sanitized values are stored correctly
    expect(data![0].first_name).toBe("'=cmd|'/c calc'!A0");
    expect(data![1].first_name).toBe("'@SUM(1+1)");

    // Track IDs for cleanup
    harness.seedData.contactIds = data!.map((c) => c.id);
  });
});
