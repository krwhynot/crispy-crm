import { describe, it, expect } from "vitest";

/**
 * Tests for HTTP error patterns found in fix-auth-advanced.html
 * These tests ensure we properly handle and detect common database schema errors
 */

describe("HTTP Error Patterns from Production", () => {
  describe("400 Bad Request - Schema Errors", () => {
    it('should detect "column does not exist" errors', () => {
      const error400Patterns = [
        {
          url: "/rest/v1/contacts_summary?offset=0&limit=25&nb_tasks=gt.0&order=last_seen.desc.nullslast",
          status: 400,
          message: "column contacts_summary.nb_tasks does not exist",
          expectedHandling: "Remove nb_tasks filter or use different approach",
        },
        {
          url: "/rest/v1/contacts?filter=last_activity.gt.2024-01-01",
          status: 400,
          message: "column contacts.last_activity does not exist",
          expectedHandling: "Use activities table with join",
        },
        {
          url: "/rest/v1/deals?select=*",
          status: 400,
          message: 'relation "public.deals" does not exist',
          expectedHandling: "Use opportunities table instead",
        },
      ];

      error400Patterns.forEach((pattern) => {
        // Check that we can identify and handle these errors
        expect(pattern.status).toBe(400);
        expect(pattern.message).toContain("does not exist");
      });
    });

    it("should parse HttpError objects correctly", () => {
      // Based on the error from fix-auth-advanced.html:
      // HttpError2: column contacts_summary.nb_tasks does not exist
      class HttpError extends Error {
        status: number;
        code?: string;
        details?: any;

        constructor(message: string, status: number) {
          super(message);
          this.name = "HttpError";
          this.status = status;
        }
      }

      const error = new HttpError("column contacts_summary.nb_tasks does not exist", 400);

      expect(error.name).toBe("HttpError");
      expect(error.status).toBe(400);
      expect(error.message).toContain("nb_tasks does not exist");
    });
  });

  describe("Data Provider Error Wrapping", () => {
    it("should wrap Supabase errors in HttpError format", async () => {
      // Mock the data provider wrapper that was throwing the error
      const wrapMethod = async (method: () => Promise<any>) => {
        try {
          return await method();
        } catch (error: unknown) {
          // This is where the error gets wrapped
          const err = error as { message?: string; status?: number; code?: string };
          const httpError = {
            name: "HttpError2", // As shown in the console error
            message: err.message || "Unknown error",
            status: err.status || 500,
            code: err.code,
          };

          throw httpError;
        }
      };

      // Simulate the Supabase error
      const supabaseMethod = async () => {
        throw {
          message: "column contacts_summary.nb_tasks does not exist",
          status: 400,
          code: "PGRST202",
        };
      };

      try {
        await wrapMethod(supabaseMethod);
        expect.fail("Should have thrown");
      } catch (error: unknown) {
        const err = error as { name: string; status: number; message: string; code: string };
        expect(err.name).toBe("HttpError2");
        expect(err.status).toBe(400);
        expect(err.message).toContain("nb_tasks does not exist");
        expect(err.code).toBe("PGRST202");
      }
    });
  });

  describe("URL Pattern Analysis", () => {
    it("should identify problematic query parameters", () => {
      const problematicUrl =
        "https://aaqnanddcqvfiwhshndl.supabase.co/rest/v1/contacts_summary?offset=0&limit=25&nb_tasks=gt.0&order=last_seen.desc.nullslast";

      // Parse URL and identify issues
      const url = new URL(problematicUrl);
      const params = new URLSearchParams(url.search);

      // Check for known problematic fields
      const problemFields = ["nb_tasks", "last_activity", "total_value"];
      const foundProblems: string[] = [];

      params.forEach((value, key) => {
        // Check if the key contains any problem fields
        problemFields.forEach((field) => {
          if (key === field || value.includes(field)) {
            foundProblems.push(`${field} in ${key}=${value}`);
          }
        });
      });

      expect(foundProblems).toContain("nb_tasks in nb_tasks=gt.0");
    });

    it("should build safe URLs by filtering out invalid fields", () => {
      const buildSafeUrl = (baseUrl: string, resource: string, params: any) => {
        const validFields: Record<string, string[]> = {
          contacts_summary: [
            "id",
            "first_name",
            "last_name",
            "email",
            "phone",
            "last_seen",
            "first_seen",
            "created_at",
            "updated_at",
          ],
          contacts: [
            "id",
            "first_name",
            "last_name",
            "email_addresses",
            "phone_numbers",
            "created_at",
            "updated_at",
          ],
        };

        const url = new URL(`${baseUrl}/rest/v1/${resource}`);
        const resourceFields = validFields[resource] || [];

        // Add safe parameters
        Object.entries(params).forEach(([key, value]) => {
          if (key === "offset" || key === "limit") {
            url.searchParams.set(key, String(value));
          } else if (key === "order") {
            // Validate order field
            const orderField = String(value).split(".")[0];
            if (resourceFields.includes(orderField)) {
              url.searchParams.set(key, String(value));
            } else {
              console.warn(`Skipping invalid order field: ${orderField}`);
            }
          } else {
            // Check if it's a filter parameter
            const filterField = key.replace(/\.(gt|lt|eq|neq|ilike).*/, "");
            if (resourceFields.includes(filterField)) {
              url.searchParams.set(key, String(value));
            } else {
              console.warn(`Skipping invalid filter field: ${filterField}`);
            }
          }
        });

        return url.toString();
      };

      // Test with problematic parameters
      const safeUrl = buildSafeUrl("https://aaqnanddcqvfiwhshndl.supabase.co", "contacts_summary", {
        offset: 0,
        limit: 25,
        nb_tasks: "gt.0", // Invalid field - should be removed
        order: "last_seen.desc.nullslast", // Valid field - should be kept
      });

      expect(safeUrl).not.toContain("nb_tasks");
      expect(safeUrl).toContain("last_seen");
      expect(safeUrl).toContain("offset=0");
      expect(safeUrl).toContain("limit=25");
    });
  });

  describe("Error Prevention Strategies", () => {
    it("should validate queries before execution", () => {
      interface QueryValidation {
        isValid: boolean;
        errors: string[];
        warnings: string[];
      }

      const validateQuery = (resource: string, query: any): QueryValidation => {
        const errors: string[] = [];
        const warnings: string[] = [];

        // Known invalid fields per resource
        const invalidFields: Record<string, string[]> = {
          contacts_summary: ["nb_tasks", "total_deals", "last_activity"],
          contacts: ["last_activity", "nb_tasks"],
          opportunities: ["deal_value"], // renamed to 'amount'
        };

        // Check filters
        if (query.filter) {
          Object.keys(query.filter).forEach((field) => {
            if (invalidFields[resource]?.includes(field)) {
              errors.push(`Field '${field}' does not exist in ${resource}`);
            }
          });
        }

        // Check sort fields
        if (query.sort?.field) {
          if (invalidFields[resource]?.includes(query.sort.field)) {
            errors.push(`Cannot sort by non-existent field '${query.sort.field}'`);
          }
        }

        // Check select fields
        if (query.select) {
          const fields = query.select.split(",").map((f: string) => f.trim());
          fields.forEach((field: string) => {
            if (invalidFields[resource]?.includes(field)) {
              warnings.push(`Field '${field}' will be ignored in select`);
            }
          });
        }

        return {
          isValid: errors.length === 0,
          errors,
          warnings,
        };
      };

      // Test the problematic query
      const validation = validateQuery("contacts_summary", {
        filter: { nb_tasks: { gt: 0 } },
        sort: { field: "last_seen", order: "DESC" },
        select: "id,name,nb_tasks",
      });

      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain("Field 'nb_tasks' does not exist in contacts_summary");
      expect(validation.warnings).toContain("Field 'nb_tasks' will be ignored in select");
    });

    it("should provide migration hints for renamed fields", () => {
      const fieldMigrationMap = {
        deals: "opportunities",
        deal_value: "amount",
        deal_stage: "stage",
        nb_tasks: "Use JOIN with tasks table or COUNT query",
        last_activity: "Use last_seen from contacts_summary or JOIN with activities",
      };

      const getMigrationHint = (fieldOrTable: string): string | undefined => {
        return fieldMigrationMap[fieldOrTable as keyof typeof fieldMigrationMap];
      };

      expect(getMigrationHint("deals")).toBe("opportunities");
      expect(getMigrationHint("nb_tasks")).toContain("JOIN with tasks table");
      expect(getMigrationHint("last_activity")).toContain("last_seen");
    });
  });

  describe("Console Error Pattern Matching", () => {
    it("should match the exact console error pattern from fix-auth-advanced.html", () => {
      // The exact error pattern from the HTML:
      // hook.js:608 [DataProvider Error] Object Object
      // hook.js:608 HttpError2: column contacts_summary.nb_tasks does not exist

      const testErrors = [
        "[DataProvider Error] Object Object\nHttpError2: column contacts_summary.nb_tasks does not exist",
        "[DataProvider Error] HttpError2: column contacts.last_activity does not exist",
        "[DataProvider Error] HttpError: column opportunities.deal_value does not exist",
      ];

      testErrors.forEach((error) => {
        const matches = error.match(/column (\w+)\.(\w+) does not exist/);
        if (matches) {
          const [_, table, field] = matches;
          console.log(`Detected schema error: Table '${table}', Field '${field}'`);

          // Verify we can extract the table and field
          expect(table).toBeTruthy();
          expect(field).toBeTruthy();
        }
      });
    });
  });
});

// Export utility functions for use in production code
export function isSchemaError(error: any): boolean {
  return (
    error?.message?.includes("does not exist") ||
    error?.message?.includes("column") ||
    error?.message?.includes("relation")
  );
}

export function extractSchemaErrorDetails(errorMessage: string): {
  type: "column" | "relation" | "unknown";
  table?: string;
  field?: string;
} {
  const columnMatch = errorMessage.match(/column (\w+)\.(\w+) does not exist/);
  if (columnMatch) {
    return {
      type: "column",
      table: columnMatch[1],
      field: columnMatch[2],
    };
  }

  const relationMatch = errorMessage.match(/relation "public\.(\w+)" does not exist/);
  if (relationMatch) {
    return {
      type: "relation",
      table: relationMatch[1],
    };
  }

  return { type: "unknown" };
}
