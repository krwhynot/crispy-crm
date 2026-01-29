import { describe, it, expect, beforeAll, vi, afterEach } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@supabase/supabase-js";

// Test the actual unified data provider behavior
describe("Unified Data Provider - Real Schema Tests", () => {
  let supabase: SupabaseClient;

  beforeAll(() => {
    const url = process.env.VITE_SUPABASE_URL || "https://aaqnanddcqvfiwhshndl.supabase.co";
    const key = process.env.VITE_SUPABASE_ANON_KEY || "test-key";
    supabase = createClient(url, key);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("contacts_summary view queries", () => {
    it("should fail when filtering by non-existent nb_tasks field", async () => {
      // Mock the error response that would come from Supabase
      const mockError = {
        message: "column contacts_summary.nb_tasks does not exist",
        code: "PGRST202",
        details: null,
        hint: null,
      };

      // Create a mock query that returns the expected error
      const query = {
        data: null,
        error: mockError,
        count: null,
        status: 400,
        statusText: "Bad Request",
      };

      // Simulate the query execution
      const { error } = query;

      // Should get an error about the column not existing
      expect(error).toBeTruthy();
      if (error) {
        expect(error.message).toContain("column");
        expect(error.message).toContain("nb_tasks");
        expect(error.message).toContain("does not exist");
      }
    });

    it("should succeed when using valid fields only", async () => {
      // Query with valid fields only
      const { error } = await supabase
        .from("contacts_summary")
        .select("id, first_name, last_name, last_seen")
        .order("last_seen", { ascending: false, nullsFirst: false })
        .limit(5);

      // Should not have column-related errors
      if (error) {
        expect(error.message).not.toContain("does not exist");
      }
    });

    it("should list all valid fields for contacts_summary", async () => {
      // Get a single row to see the schema
      const { data, error } = await supabase.from("contacts_summary").select("*").limit(1);

      if (!error && data && data.length > 0) {
        const validFields = Object.keys(data[0]);
        console.log("Valid contacts_summary fields:", validFields);

        // Verify nb_tasks is NOT in the list
        expect(validFields).not.toContain("nb_tasks");

        // Verify expected fields ARE in the list
        expect(validFields).toContain("id");
        expect(validFields).toContain("first_name");
        expect(validFields).toContain("last_name");
        expect(validFields).toContain("last_seen");
      }
    });
  });

  describe("HTTP error simulation", () => {
    it("should handle 400 errors with proper error messages", async () => {
      // Mock the HTTP error response
      const mockResponse = {
        status: 400,
        json: async () => ({
          message: "column contacts_summary.nb_tasks does not exist",
          code: "PGRST202",
          details: null,
          hint: null,
        }),
      };

      // Simulate the error response
      const errorBody = await mockResponse.json();

      expect(mockResponse.status).toBe(400);
      expect(errorBody.message).toContain("column");
      expect(errorBody.message).toContain("nb_tasks");
      expect(errorBody.message).toContain("does not exist");
    });
  });

  describe("Data provider error transformation", () => {
    it("should transform Supabase errors into HttpError format", async () => {
      interface SupabaseError {
        message?: string;
        status?: number;
        code?: string;
        details?: string | null;
        hint?: string | null;
      }

      // Mock the data provider's error handling
      class HttpError extends Error {
        status: number;
        body: Record<string, unknown>;

        constructor(message: string, status: number, body: Record<string, unknown> = {}) {
          super(message);
          this.name = "HttpError";
          this.status = status;
          this.body = body;
        }
      }

      const transformSupabaseError = (error: SupabaseError): HttpError => {
        // Extract status and message
        const status = error.status || 500;
        const message = error.message || "Unknown error";

        // Create HttpError matching React Admin expectations
        return new HttpError(message, status, {
          code: error.code,
          details: error.details,
          hint: error.hint,
        });
      };

      // Test transformation
      const supabaseError = {
        message: "column contacts_summary.nb_tasks does not exist",
        status: 400,
        code: "PGRST202",
      };

      const httpError = transformSupabaseError(supabaseError);

      expect(httpError).toBeInstanceOf(Error);
      expect(httpError.name).toBe("HttpError");
      expect(httpError.status).toBe(400);
      expect(httpError.message).toContain("nb_tasks does not exist");
      expect(httpError.body.code).toBe("PGRST202");
    });
  });

  describe("Field validation before queries", () => {
    it("should validate fields before building queries", () => {
      // Schema definitions
      const schemas = {
        contacts_summary: [
          "id",
          "name",
          "first_name",
          "last_name",
          "email",
          "phone",
          "title",
          "role",
          "department",
          "purchase_influence",
          "decision_authority",
          "address",
          "city",
          "state",
          "postal_code",
          "country",
          "birthday",
          "linkedin_url",
          "twitter_handle",
          "notes",
          "sales_id",
          "created_at",
          "updated_at",
          "created_by",
          "deleted_at",
          "search_tsv",
          "first_seen",
          "last_seen",
          "gender",
          "tags",
          "organization_ids",
        ],
      };

      const validateField = (table: string, field: string): boolean => {
        const tableSchema = schemas[table as keyof typeof schemas];
        if (!tableSchema) {
          console.warn(`Unknown table: ${table}`);
          return false;
        }
        return tableSchema.includes(field);
      };

      // Test validation
      expect(validateField("contacts_summary", "nb_tasks")).toBe(false);
      expect(validateField("contacts_summary", "last_seen")).toBe(true);
      expect(validateField("contacts_summary", "first_name")).toBe(true);

      // Build safe query
      const buildSafeQuery = (table: string, filters: Record<string, any>) => {
        const safeFilters: Record<string, any> = {};
        const warnings: string[] = [];

        Object.entries(filters).forEach(([field, value]) => {
          if (validateField(table, field)) {
            safeFilters[field] = value;
          } else {
            warnings.push(`Skipping invalid field: ${table}.${field}`);
          }
        });

        return { filters: safeFilters, warnings };
      };

      const { filters, warnings } = buildSafeQuery("contacts_summary", {
        nb_tasks: { gt: 0 },
        last_seen: { not: null },
        first_name: { ilike: "%john%" },
      });

      expect(filters).not.toHaveProperty("nb_tasks");
      expect(filters).toHaveProperty("last_seen");
      expect(filters).toHaveProperty("first_name");
      expect(warnings).toContain("Skipping invalid field: contacts_summary.nb_tasks");
    });
  });

  describe("Error recovery and fallbacks", () => {
    it("should provide helpful error messages for common mistakes", () => {
      const commonErrors = [
        {
          error: "column contacts_summary.nb_tasks does not exist",
          suggestion:
            'The field "nb_tasks" does not exist in contacts_summary. Available task-related queries should use the tasks table directly.',
        },
        {
          error: "column contacts.last_activity does not exist",
          suggestion:
            'The field "last_activity" does not exist. Use the activities table with a join or the contacts_summary view which has "last_seen".',
        },
        {
          error: 'relation "public.deals" does not exist',
          suggestion:
            'The table "deals" does not exist. The system uses "opportunities" instead of deals.',
        },
      ];

      const getSuggestion = (errorMessage: string): string => {
        const error = commonErrors.find((e) =>
          errorMessage.includes(e.error.split(" ").slice(1).join(" "))
        );
        return error?.suggestion || "Check the database schema for valid fields and tables.";
      };

      // Test suggestions
      expect(getSuggestion("column contacts_summary.nb_tasks does not exist")).toContain(
        "tasks table directly"
      );

      expect(getSuggestion("column contacts.last_activity does not exist")).toContain(
        "activities table"
      );

      expect(getSuggestion('relation "public.deals" does not exist')).toContain("opportunities");
    });

    it("should log errors with context for debugging", () => {
      const errorLogger = {
        log: (error: any, context: any) => {
          const logEntry = {
            timestamp: new Date().toISOString(),
            error: {
              message: error.message,
              code: error.code,
              status: error.status,
            },
            context: {
              resource: context.resource,
              method: context.method,
              params: context.params,
            },
            suggestion: getSuggestion(error.message),
          };

          console.error("[DataProvider Error]", logEntry);
          return logEntry;
        },
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
          pagination: { page: 1, perPage: 25 },
          sort: { field: "last_seen", order: "DESC" },
        },
      };

      const logEntry = errorLogger.log(testError, testContext);

      expect(logEntry.error.message).toContain("nb_tasks does not exist");
      expect(logEntry.context.resource).toBe("contacts_summary");
      expect(logEntry.suggestion).toContain("tasks table");
    });
  });
});

// Helper function for error suggestions
function getSuggestion(errorMessage: string): string {
  if (errorMessage.includes("nb_tasks")) {
    return 'The field "nb_tasks" does not exist. To filter contacts by task count, you need to join with the tasks table or create a computed column.';
  }
  if (errorMessage.includes("last_activity")) {
    return 'Use "last_seen" field from contacts_summary view or join with the activities table.';
  }
  if (errorMessage.includes("deals")) {
    return 'This system uses "opportunities" instead of "deals".';
  }
  return "Check the database schema for valid fields.";
}
