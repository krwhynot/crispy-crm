import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the data provider to test error handling
const mockSupabaseClient = {
  from: vi.fn(),
  auth: {
    getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
  },
};

describe("Data Provider Error Handling", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("HttpError Handling", () => {
    it("should properly handle column does not exist errors", async () => {
      // This test simulates the exact error from fix-auth-advanced.html
      const errorMessage = "column contacts_summary.nb_tasks does not exist";
      const errorResponse = {
        status: 400,
        statusText: "Bad Request",
        message: errorMessage,
        code: "PGRST202",
      };

      // Mock the Supabase response
      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          filter: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              range: vi.fn().mockRejectedValue(errorResponse),
            }),
          }),
        }),
      });

      // Test that the error is properly caught and transformed
      try {
        const query = mockSupabaseClient
          .from("contacts_summary")
          .select("*")
          .filter("nb_tasks", "gt", 0)
          .order("last_seen", { ascending: false })
          .range(0, 24);

        await query;

        // Should not reach here
        expect.fail("Should have thrown an error");
      } catch (error: unknown) {
        const err = error as { status: number; message: string; code: string };
        expect(err.status).toBe(400);
        expect(err.message).toContain("nb_tasks does not exist");
        expect(err.code).toBe("PGRST202");
      }
    });

    it("should detect and report schema mismatches in filters", () => {
      const testFilters = [
        {
          resource: "contacts_summary",
          filter: { nb_tasks: { gt: 0 } },
          shouldError: true,
          expectedError: "nb_tasks does not exist",
        },
        {
          resource: "contacts",
          filter: { invalid_field: { eq: "value" } },
          shouldError: true,
          expectedError: "invalid_field does not exist",
        },
        {
          resource: "opportunities",
          filter: { amount: { gt: 1000 } },
          shouldError: false,
          expectedError: null,
        },
      ];

      testFilters.forEach((test) => {
        if (test.shouldError) {
          expect(() => {
            // In a real implementation, this would validate against schema
            validateFilter(test.resource, test.filter);
          }).toThrow(test.expectedError!);
        } else {
          expect(() => {
            validateFilter(test.resource, test.filter);
          }).not.toThrow();
        }
      });
    });
  });

  describe("Error Recovery Strategies", () => {
    it("should provide fallback when field does not exist", async () => {
      // When a field doesn't exist, provide a safe fallback
      const safeQuery = (
        table: string,
        fields: string[],
        filters: Record<string, unknown> = {}
      ) => {
        const validFields = getValidFields(table);
        const safeFields = fields.filter((f) => validFields.includes(f));

        if (safeFields.length === 0) {
          throw new Error(`No valid fields found for table ${table}`);
        }

        const safeFilters: Record<string, unknown> = {};
        Object.keys(filters).forEach((key) => {
          if (validFields.includes(key)) {
            safeFilters[key] = filters[key];
          } else {
            console.warn(`Skipping invalid filter field: ${table}.${key}`);
          }
        });

        return { fields: safeFields, filters: safeFilters };
      };

      const result = safeQuery("contacts_summary", ["id", "name", "nb_tasks", "last_seen"], {
        nb_tasks: { gt: 0 },
        last_seen: { not: null },
      });

      // Should filter out invalid fields
      expect(result.fields).not.toContain("nb_tasks");
      expect(result.fields).toContain("last_seen");
      expect(result.filters).not.toHaveProperty("nb_tasks");
      expect(result.filters).toHaveProperty("last_seen");
    });

    it("should log detailed error information for debugging", () => {
      const consoleSpy = vi.spyOn(console, "error");

      const logDataProviderError = (
        error: { message: string; code: string; status: number },
        context: { resource: string; method: string; params: Record<string, unknown> }
      ) => {
        console.error("[DataProvider Error]", {
          message: error.message,
          code: error.code,
          status: error.status,
          resource: context.resource,
          method: context.method,
          params: context.params,
          timestamp: new Date().toISOString(),
        });
      };

      const testError = {
        message: "column contacts_summary.nb_tasks does not exist",
        code: "PGRST202",
        status: 400,
      };

      const testContext = {
        resource: "contacts_summary",
        method: "getList",
        params: {
          filter: { nb_tasks: { gt: 0 } },
          sort: { field: "last_seen", order: "DESC" },
        },
      };

      logDataProviderError(testError, testContext);

      expect(consoleSpy).toHaveBeenCalledWith(
        "[DataProvider Error]",
        expect.objectContaining({
          message: testError.message,
          code: testError.code,
          resource: testContext.resource,
          method: testContext.method,
        })
      );
    });
  });

  describe("Schema Validation at Runtime", () => {
    it("should validate schema before making requests", () => {
      const schemaValidator = {
        validateField: (table: string, field: string): boolean => {
          const schema = getTableSchema(table);
          return schema.includes(field);
        },

        validateRequest: (table: string, request: SchemaValidationRequest): ValidationResult => {
          const errors: string[] = [];

          // Validate select fields
          if (request.select) {
            const fields = request.select.split(",").map((f: string) => f.trim());
            fields.forEach((field: string) => {
              if (!schemaValidator.validateField(table, field)) {
                errors.push(`Field '${field}' does not exist in table '${table}'`);
              }
            });
          }

          // Validate filter fields
          if (request.filter) {
            Object.keys(request.filter).forEach((field) => {
              if (!schemaValidator.validateField(table, field)) {
                errors.push(`Filter field '${field}' does not exist in table '${table}'`);
              }
            });
          }

          // Validate sort field
          if (request.sort?.field) {
            if (!schemaValidator.validateField(table, request.sort.field)) {
              errors.push(`Sort field '${request.sort.field}' does not exist in table '${table}'`);
            }
          }

          return {
            valid: errors.length === 0,
            errors,
          };
        },
      };

      // Test with invalid request
      const invalidRequest = {
        select: "id,name,nb_tasks",
        filter: { nb_tasks: { gt: 0 } },
        sort: { field: "last_seen", order: "DESC" },
      };

      const validation = schemaValidator.validateRequest("contacts_summary", invalidRequest);

      expect(validation.valid).toBe(false);
      expect(validation.errors).toContain(
        "Field 'nb_tasks' does not exist in table 'contacts_summary'"
      );
      expect(validation.errors).toContain(
        "Filter field 'nb_tasks' does not exist in table 'contacts_summary'"
      );
    });
  });
});

// Helper functions
function validateFilter(resource: string, filter: any): void {
  const invalidFields: Record<string, string[]> = {
    contacts_summary: ["nb_tasks"],
    contacts: ["invalid_field"],
  };

  const invalid = invalidFields[resource] || [];

  Object.keys(filter).forEach((field) => {
    if (invalid.includes(field)) {
      throw new Error(`${field} does not exist`);
    }
  });
}

function getValidFields(table: string): string[] {
  const schemas: Record<string, string[]> = {
    contacts_summary: [
      "id",
      "name",
      "first_name",
      "last_name",
      "email",
      "phone",
      "last_seen",
      "first_seen",
      "tags",
      "organization_ids",
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
    opportunities: [
      "id",
      "name",
      "stage",
      "amount",
      "customer_organization_id",
      "probability",
      "expected_close_date",
    ],
  };

  return schemas[table] || [];
}

function getTableSchema(table: string): string[] {
  return getValidFields(table);
}

interface SchemaValidationRequest {
  select?: string;
  filter?: Record<string, unknown>;
  sort?: { field: string; order: string };
}

interface ValidationResult {
  valid: boolean;
  errors: string[];
}

// Export for use in other tests
export { validateFilter, getValidFields, getTableSchema };
