import { describe, it, expect } from "vitest";
import {
  mapErrorToUserMessage,
  CONSTRAINT_MESSAGES,
  FIELD_LABELS,
  getActionErrorMessage,
  isNetworkError,
  isAuthError,
  sanitizeDatabaseError,
} from "../errorMessages";

describe("errorMessages", () => {
  describe("CONSTRAINT_MESSAGES", () => {
    it("should have user-friendly messages for unique constraints", () => {
      expect(CONSTRAINT_MESSAGES["organizations_name_unique_idx"]).toBe(
        "An organization with this name already exists."
      );
      expect(CONSTRAINT_MESSAGES["tags_name_key"]).toBe("A tag with this name already exists.");
      expect(CONSTRAINT_MESSAGES["segments_name_type_unique"]).toBe(
        "A segment with this name and type already exists."
      );
    });

    it("should have messages for foreign key delete prevention", () => {
      expect(CONSTRAINT_MESSAGES["activities_contact_id_fkey"]).toBe(
        "Cannot delete - this contact has associated activities."
      );
      expect(CONSTRAINT_MESSAGES["contact_notes_contact_id_fkey"]).toBe(
        "Cannot delete - this contact has notes."
      );
      expect(CONSTRAINT_MESSAGES["opportunity_contacts_contact_id_fkey"]).toBe(
        "Cannot delete - this contact is linked to opportunities."
      );
      expect(CONSTRAINT_MESSAGES["contact_organizations_contact_id_fkey"]).toBe(
        "Cannot delete - this contact is linked to organizations."
      );
    });

    it("should have messages for foreign key validation", () => {
      expect(CONSTRAINT_MESSAGES["contacts_organization_id_fkey"]).toBe(
        "Please select a valid organization."
      );
      expect(CONSTRAINT_MESSAGES["contacts_sales_id_fkey"]).toBe(
        "Please select a valid account manager."
      );
      expect(CONSTRAINT_MESSAGES["opportunities_customer_organization_id_fkey"]).toBe(
        "Please select a valid customer organization."
      );
      expect(CONSTRAINT_MESSAGES["opportunities_principal_organization_id_fkey"]).toBe(
        "Please select a valid principal organization."
      );
      expect(CONSTRAINT_MESSAGES["opportunities_distributor_organization_id_fkey"]).toBe(
        "Please select a valid distributor organization."
      );
      expect(CONSTRAINT_MESSAGES["tasks_assigned_to_fkey"]).toBe(
        "Please select a valid user to assign this task to."
      );
    });

    it("should have messages for not-null constraints", () => {
      expect(CONSTRAINT_MESSAGES["contacts_email_not_null"]).toBe(
        "Email is required for contacts."
      );
      expect(CONSTRAINT_MESSAGES["organizations_name_not_null"]).toBe(
        "Organization name is required."
      );
    });
  });

  describe("FIELD_LABELS", () => {
    it("should map common field names to labels", () => {
      expect(FIELD_LABELS["email"]).toBe("Email");
      expect(FIELD_LABELS["name"]).toBe("Name");
      expect(FIELD_LABELS["title"]).toBe("Title");
    });

    it("should map contact field names to labels", () => {
      expect(FIELD_LABELS["first_name"]).toBe("First Name");
      expect(FIELD_LABELS["last_name"]).toBe("Last Name");
      expect(FIELD_LABELS["phone"]).toBe("Phone Number");
      expect(FIELD_LABELS["department"]).toBe("Department");
    });

    it("should map organization field names to labels", () => {
      expect(FIELD_LABELS["website"]).toBe("Website");
      expect(FIELD_LABELS["address"]).toBe("Address");
      expect(FIELD_LABELS["city"]).toBe("City");
      expect(FIELD_LABELS["postal_code"]).toBe("Postal Code");
    });

    it("should map opportunity field names to labels", () => {
      expect(FIELD_LABELS["stage"]).toBe("Stage");
      expect(FIELD_LABELS["estimated_close_date"]).toBe("Estimated Close Date");
      expect(FIELD_LABELS["win_reason"]).toBe("Win Reason");
      expect(FIELD_LABELS["loss_reason"]).toBe("Loss Reason");
    });
  });

  describe("mapErrorToUserMessage", () => {
    describe("constraint name extraction and mapping", () => {
      it("should extract constraint names and use specific messages", () => {
        const error = new Error(
          'duplicate key value violates unique constraint "organizations_name_unique_idx"'
        );
        expect(mapErrorToUserMessage(error)).toBe("An organization with this name already exists.");
      });

      it("should match constraint names case-insensitively in extraction", () => {
        const error = new Error('violates unique CONSTRAINT "tags_name_key"');
        expect(mapErrorToUserMessage(error)).toBe("A tag with this name already exists.");
      });

      it("should prioritize constraint-specific messages over generic ones", () => {
        const error = new Error(
          'duplicate key value violates unique constraint "segments_name_type_unique"'
        );
        expect(mapErrorToUserMessage(error)).toBe(
          "A segment with this name and type already exists."
        );
      });

      it("should handle foreign key delete prevention messages", () => {
        const error = new Error(
          'update or delete on table "contacts" violates foreign key constraint "activities_contact_id_fkey"'
        );
        expect(mapErrorToUserMessage(error)).toBe(
          "Cannot delete - this contact has associated activities."
        );
      });

      it("should handle foreign key validation messages", () => {
        const error = new Error(
          'insert or update on table "contacts" violates foreign key constraint "contacts_organization_id_fkey"'
        );
        expect(mapErrorToUserMessage(error)).toBe("Please select a valid organization.");
      });
    });

    describe("PostgreSQL error code handling", () => {
      it("should handle 23502 (not-null constraint) with field extraction", () => {
        const error = new Error(
          "null value in column 'email' of relation 'contacts' violates not-null constraint"
        );
        expect(mapErrorToUserMessage(error)).toBe("Email is required.");
      });

      it("should handle 23502 error code directly", () => {
        const error = new Error("ERROR 23502: null value not allowed");
        expect(mapErrorToUserMessage(error)).toBe("Required field is missing.");
      });

      it("should handle 23503 (foreign key violation) on delete", () => {
        const error = new Error("update or delete violates foreign key constraint (23503)");
        expect(mapErrorToUserMessage(error)).toBe("Cannot delete — other records depend on this.");
      });

      it("should handle 23503 (foreign key violation) on insert/update", () => {
        const error = new Error("insert violates foreign key constraint (23503)");
        expect(mapErrorToUserMessage(error)).toBe(
          "Invalid selection — referenced record not found."
        );
      });

      it("should handle 23505 (unique violation)", () => {
        const error = new Error("duplicate key value violates unique constraint (23505)");
        expect(mapErrorToUserMessage(error)).toBe(
          "This already exists. Please use a different value."
        );
      });

      it("should handle 23505 with name field", () => {
        const error = new Error("duplicate key value for name violates unique constraint");
        expect(mapErrorToUserMessage(error)).toBe(
          "This name is already in use. Please choose a different name."
        );
      });

      it("should handle 23505 with email field", () => {
        const error = new Error("duplicate key value for email violates unique constraint");
        expect(mapErrorToUserMessage(error)).toBe("This email is already in use.");
      });

      it("should handle check constraint violations", () => {
        const error = new Error('new row violates check constraint "valid_stage"');
        expect(mapErrorToUserMessage(error)).toBe(
          "Invalid value provided. Please check your input."
        );
      });
    });

    describe("field label transformation", () => {
      it("should convert field names to user-friendly labels", () => {
        const error = new Error("null value in column 'first_name' violates not-null constraint");
        expect(mapErrorToUserMessage(error)).toBe("First Name is required.");
      });

      it("should handle underscored field names not in FIELD_LABELS", () => {
        const error = new Error("null value in column 'custom_field' violates not-null constraint");
        expect(mapErrorToUserMessage(error)).toBe("custom field is required.");
      });

      it("should extract fields from multiple contexts", () => {
        const error = new Error(
          "null value in column 'postal_code' of relation 'organizations' violates not-null constraint"
        );
        expect(mapErrorToUserMessage(error)).toBe("Postal Code is required.");
      });
    });

    describe("auth and permission errors", () => {
      it("should handle RLS violations (PGRST202)", () => {
        const error = new Error("PGRST202: Row level security violation");
        expect(mapErrorToUserMessage(error)).toBe("You don't have access to this record.");
      });

      it("should handle RLS keyword", () => {
        const error = new Error("RLS policy denied access");
        expect(mapErrorToUserMessage(error)).toBe("You don't have access to this record.");
      });

      it("should handle JWT/session expired (PGRST301)", () => {
        const error = new Error("PGRST301: JWT token expired");
        expect(mapErrorToUserMessage(error)).toBe("Your session expired. Please sign in again.");
      });

      it("should handle JWT keyword", () => {
        const error = new Error("Invalid JWT token");
        expect(mapErrorToUserMessage(error)).toBe("Your session expired. Please sign in again.");
      });

      it("should handle 403 Forbidden", () => {
        const error = new Error("403 Forbidden: insufficient privileges");
        expect(mapErrorToUserMessage(error)).toBe("You don't have permission for this action.");
      });

      it("should handle PostgreSQL 42501 (permission denied)", () => {
        const error = new Error("ERROR 42501: permission denied for table contacts");
        expect(mapErrorToUserMessage(error)).toBe("You don't have permission for this action.");
      });

      it("should handle 401 Unauthorized", () => {
        const error = new Error("401 Unauthorized");
        expect(mapErrorToUserMessage(error)).toBe("Please sign in to continue.");
      });
    });

    describe("network and connection errors", () => {
      it("should handle network errors", () => {
        const error = new Error("NetworkError: Failed to fetch");
        expect(mapErrorToUserMessage(error)).toBe(
          "Connection issue. Please check your internet and try again."
        );
      });

      it("should handle fetch failures", () => {
        const error = new Error("Failed to fetch from server");
        expect(mapErrorToUserMessage(error)).toBe(
          "Connection issue. Please check your internet and try again."
        );
      });

      it("should handle connection errors", () => {
        const error = new Error("Connection refused");
        expect(mapErrorToUserMessage(error)).toBe(
          "Connection issue. Please check your internet and try again."
        );
      });

      it("should handle timeout errors", () => {
        const error = new Error("Request timed out");
        expect(mapErrorToUserMessage(error)).toBe("Request timed out. Please try again.");
      });
    });

    describe("validation errors", () => {
      it("should handle validation failed messages", () => {
        const error = new Error("Validation failed for input");
        expect(mapErrorToUserMessage(error)).toBe("Please check the form for errors.");
      });

      it("should handle invalid input messages", () => {
        const error = new Error("Invalid input provided");
        expect(mapErrorToUserMessage(error)).toBe("Please check the form for errors.");
      });
    });

    describe("fallback behavior", () => {
      it("should return generic message for unknown constraint", () => {
        const error = new Error('violates unique constraint "unknown_constraint_xyz"');
        expect(mapErrorToUserMessage(error)).toBe(
          "This already exists. Please use a different value."
        );
      });

      it("should pass through short user-friendly messages", () => {
        const error = new Error("Unable to save changes");
        expect(mapErrorToUserMessage(error)).toBe("Unable to save changes");
      });

      it("should pass through very short messages", () => {
        const error = new Error("Invalid data");
        expect(mapErrorToUserMessage(error)).toBe("Invalid data");
      });

      it("should sanitize technical messages over 80 chars", () => {
        const error = new Error(
          "This is a very long technical error message that contains constraint and pgrst and supabase and postgres and relation and column and violates and coerce and json object"
        );
        expect(mapErrorToUserMessage(error)).toBe("Something went wrong. Please try again.");
      });

      it("should sanitize messages with technical terms", () => {
        const error = new Error("postgrest error in relation");
        expect(mapErrorToUserMessage(error)).toBe("Something went wrong. Please try again.");
      });
    });

    describe("error type handling", () => {
      it("should handle null error", () => {
        expect(mapErrorToUserMessage(null)).toBe("Something went wrong. Please try again.");
      });

      it("should handle undefined error", () => {
        expect(mapErrorToUserMessage(undefined)).toBe("Something went wrong. Please try again.");
      });

      it("should handle string error", () => {
        const error = "duplicate key value violates unique constraint";
        expect(mapErrorToUserMessage(error)).toBe(
          "This already exists. Please use a different value."
        );
      });

      it("should handle non-Error objects", () => {
        const error = { code: "UNKNOWN" };
        expect(mapErrorToUserMessage(error)).toBe("Something went wrong. Please try again.");
      });
    });

    describe("ErrorContext interface", () => {
      it("should accept optional context parameter", () => {
        const error = new Error("test error");
        const context = { resource: "contacts", action: "create" as const };
        const result = mapErrorToUserMessage(error, context);
        expect(typeof result).toBe("string");
      });

      it("should work without context (backward compatibility)", () => {
        const error = new Error(
          'duplicate key value violates unique constraint "organizations_name_unique_idx"'
        );
        const result = mapErrorToUserMessage(error);
        expect(result).toBe("An organization with this name already exists.");
      });
    });
  });

  describe("getActionErrorMessage", () => {
    it("should generate context-specific messages for create", () => {
      expect(getActionErrorMessage("create", "organization")).toBe(
        "Couldn't create organization. Please try again."
      );
      expect(getActionErrorMessage("create")).toBe("Couldn't create. Please try again.");
    });

    it("should generate context-specific messages for update", () => {
      expect(getActionErrorMessage("update", "contact")).toBe(
        "Couldn't save changes to contact. Please try again."
      );
      expect(getActionErrorMessage("update")).toBe("Couldn't save changes. Please try again.");
    });

    it("should generate context-specific messages for delete", () => {
      expect(getActionErrorMessage("delete", "opportunity")).toBe(
        "Couldn't delete opportunity. Please try again."
      );
      expect(getActionErrorMessage("delete")).toBe("Couldn't delete. Please try again.");
    });

    it("should generate context-specific messages for save", () => {
      expect(getActionErrorMessage("save", "task")).toBe("Couldn't save task. Please try again.");
    });

    it("should generate context-specific messages for load", () => {
      expect(getActionErrorMessage("load", "data")).toBe("Couldn't load data. Please try again.");
    });
  });

  describe("isNetworkError", () => {
    it("should identify network errors", () => {
      expect(isNetworkError(new Error("NetworkError occurred"))).toBe(true);
      expect(isNetworkError(new Error("Failed to fetch"))).toBe(true);
      expect(isNetworkError(new Error("Connection lost"))).toBe(true);
      expect(isNetworkError(new Error("Request timeout"))).toBe(true);
    });

    it("should return false for non-network errors", () => {
      expect(isNetworkError(new Error("Validation failed"))).toBe(false);
      expect(isNetworkError(new Error("Constraint violation"))).toBe(false);
    });

    it("should handle non-Error types", () => {
      expect(isNetworkError(null)).toBe(false);
      expect(isNetworkError(undefined)).toBe(false);
      expect(isNetworkError("network error")).toBe(false);
      expect(isNetworkError({ message: "network error" })).toBe(false);
    });
  });

  describe("isAuthError", () => {
    it("should identify auth errors", () => {
      expect(isAuthError(new Error("JWT expired"))).toBe(true);
      expect(isAuthError(new Error("Invalid token"))).toBe(true);
      expect(isAuthError(new Error("Session expired"))).toBe(true);
      expect(isAuthError(new Error("PGRST301 error"))).toBe(true);
      expect(isAuthError(new Error("401 Unauthorized"))).toBe(true);
    });

    it("should return false for non-auth errors", () => {
      expect(isAuthError(new Error("Validation failed"))).toBe(false);
      expect(isAuthError(new Error("Network error"))).toBe(false);
    });

    it("should handle non-Error types", () => {
      expect(isAuthError(null)).toBe(false);
      expect(isAuthError(undefined)).toBe(false);
      expect(isAuthError("jwt expired")).toBe(false);
      expect(isAuthError({ message: "token expired" })).toBe(false);
    });
  });

  describe("sanitizeDatabaseError", () => {
    it("should extract not-null constraint violations", () => {
      const message =
        "null value in column 'email' of relation 'contacts' violates not-null constraint";
      const result = sanitizeDatabaseError(message);
      expect(result).toEqual({
        field: "email",
        message: "Email is required",
      });
    });

    it("should use FIELD_LABELS for known fields", () => {
      const message =
        "null value in column 'first_name' of relation 'contacts' violates not-null constraint";
      const result = sanitizeDatabaseError(message);
      expect(result).toEqual({
        field: "first_name",
        message: "First Name is required",
      });
    });

    it("should handle unknown fields with underscore replacement", () => {
      const message =
        "null value in column 'custom_field' of relation 'table' violates not-null constraint";
      const result = sanitizeDatabaseError(message);
      expect(result).toEqual({
        field: "custom_field",
        message: "custom field is required",
      });
    });

    it("should extract unique constraint violations", () => {
      const message =
        'duplicate key value violates unique constraint "organizations_name_unique_idx"';
      const result = sanitizeDatabaseError(message);
      expect(result).toEqual({
        field: "_error",
        message: "This record already exists",
      });
    });

    it("should extract foreign key constraint violations", () => {
      const message =
        'insert or update on table "contacts" violates foreign key constraint on column "organization_id"';
      const result = sanitizeDatabaseError(message);
      expect(result).toEqual({
        field: "organization_id",
        message: "Invalid Organization reference",
      });
    });

    it("should handle check constraint violations", () => {
      const message = 'new row violates check constraint "valid_stage"';
      const result = sanitizeDatabaseError(message);
      expect(result).toEqual({
        field: "_error",
        message: "Invalid value provided",
      });
    });

    it("should return null for unrecognized errors", () => {
      const message = "Some other database error";
      const result = sanitizeDatabaseError(message);
      expect(result).toBeNull();
    });

    it("should return null for non-database errors", () => {
      const message = "Network connection failed";
      const result = sanitizeDatabaseError(message);
      expect(result).toBeNull();
    });
  });

  // ============================================
  // NEW TESTS: Resource-Specific Delete Messages
  // ============================================

  describe("resource-specific delete messages with ErrorContext", () => {
    it("should enhance generic 'Cannot delete' with resource name", () => {
      const error = new Error("Cannot delete - record has dependencies");
      const context = { resource: "contacts", action: "delete" as const };
      expect(mapErrorToUserMessage(error, context)).toBe(
        "Cannot delete contact - record has dependencies"
      );
    });

    it("should enhance 'Couldn't delete' with resource name", () => {
      const error = new Error("Couldn't delete - this record is in use");
      const context = { resource: "organizations", action: "delete" as const };
      expect(mapErrorToUserMessage(error, context)).toBe(
        "Couldn't delete organization - this record is in use"
      );
    });

    it("should not duplicate resource name if already present", () => {
      const error = new Error("Cannot delete contact - has activities");
      const context = { resource: "contacts", action: "delete" as const };
      // Should not become "Cannot delete contact contact - has activities"
      expect(mapErrorToUserMessage(error, context)).toBe("Cannot delete contact - has activities");
    });

    it("should not modify message for non-delete actions", () => {
      const error = new Error("Cannot delete - record has dependencies");
      const context = { resource: "contacts", action: "create" as const };
      // Should pass through without modification since action is not delete
      expect(mapErrorToUserMessage(error, context)).toBe("Cannot delete - record has dependencies");
    });

    it("should use RESOURCE_LABELS for friendly names", () => {
      const error = new Error("Cannot delete - has linked records");
      const context = { resource: "product_distributors", action: "delete" as const };
      expect(mapErrorToUserMessage(error, context)).toBe(
        "Cannot delete product distributor - has linked records"
      );
    });

    it("should fall back to raw resource name if not in RESOURCE_LABELS", () => {
      const error = new Error("Cannot delete - dependencies exist");
      const context = { resource: "custom_resource", action: "delete" as const };
      expect(mapErrorToUserMessage(error, context)).toBe(
        "Cannot delete custom_resource - dependencies exist"
      );
    });
  });

  // ============================================
  // NEW TESTS: Tier 1 Constraint Messages
  // ============================================

  describe("new Tier 1 constraint messages", () => {
    describe("self-reference prevention constraints", () => {
      it("should handle contact self-manager constraint", () => {
        const error = new Error('violates check constraint "contacts_no_self_manager"');
        expect(mapErrorToUserMessage(error)).toBe("A contact cannot be their own manager.");
      });

      it("should handle distributor self-authorization constraint", () => {
        const error = new Error(
          'insert or update violates check constraint "no_self_authorization"'
        );
        expect(mapErrorToUserMessage(error)).toBe(
          "A distributor cannot authorize itself as a principal."
        );
      });

      it("should handle organization self-distribution constraint", () => {
        const error = new Error('violates check constraint "no_self_distribution"');
        expect(mapErrorToUserMessage(error)).toBe("An organization cannot be its own distributor.");
      });
    });

    describe("win/loss reason requirements", () => {
      it("should handle closed_won without win_reason constraint", () => {
        const error = new Error(
          'new row violates check constraint "opportunities_closed_won_check"'
        );
        expect(mapErrorToUserMessage(error)).toBe("Closing as Won requires a win reason.");
      });

      it("should handle closed_lost without loss_reason constraint", () => {
        const error = new Error(
          'new row violates check constraint "opportunities_closed_lost_check"'
        );
        expect(mapErrorToUserMessage(error)).toBe("Closing as Lost requires a loss reason.");
      });
    });

    describe("date validation constraints", () => {
      it("should handle invalid authorization date range", () => {
        const error = new Error('violates check constraint "valid_authorization_dates"');
        expect(mapErrorToUserMessage(error)).toBe("Effective date must be before expiration date.");
      });
    });

    describe("enum validation constraints", () => {
      it("should handle invalid notification entity type", () => {
        const error = new Error('violates check constraint "notifications_entity_type_check"');
        expect(mapErrorToUserMessage(error)).toBe("Invalid entity type for notification.");
      });

      it("should handle invalid notification type", () => {
        const error = new Error('violates check constraint "notifications_type_check"');
        expect(mapErrorToUserMessage(error)).toBe("Invalid notification type.");
      });
    });

    describe("unique constraint messages", () => {
      it("should handle duplicate product in opportunity", () => {
        const error = new Error(
          'duplicate key value violates unique constraint "opportunity_products_opportunity_id_product_id_reference_key"'
        );
        expect(mapErrorToUserMessage(error)).toBe(
          "This product is already linked to this opportunity."
        );
      });

      it("should handle duplicate organization-distributor relationship", () => {
        const error = new Error(
          'duplicate key value violates unique constraint "uq_organization_distributor"'
        );
        expect(mapErrorToUserMessage(error)).toBe(
          "This organization-distributor relationship already exists."
        );
      });
    });

    describe("additional foreign key delete prevention", () => {
      it("should handle organization with distributor relationships", () => {
        const error = new Error(
          'update or delete violates foreign key constraint "organization_distributors_organization_id_fkey"'
        );
        expect(mapErrorToUserMessage(error)).toBe(
          "Cannot delete - this organization has distributor relationships."
        );
      });

      it("should handle opportunity with linked products", () => {
        const error = new Error(
          'update or delete violates foreign key constraint "opportunity_products_opportunity_id_fkey"'
        );
        expect(mapErrorToUserMessage(error)).toBe(
          "Cannot delete - this opportunity has linked products."
        );
      });

      it("should handle product with opportunity links", () => {
        const error = new Error(
          'update or delete violates foreign key constraint "opportunity_products_product_id_reference_fkey"'
        );
        expect(mapErrorToUserMessage(error)).toBe(
          "Cannot delete - this product is linked to opportunities."
        );
      });
    });
  });

  // ============================================
  // NEW TESTS: String Length Violations
  // ============================================

  describe("string length violations", () => {
    it("should handle varchar length exceeded with specific limit", () => {
      const error = new Error("value too long for type character varying(255)");
      expect(mapErrorToUserMessage(error)).toBe(
        "Input is too long. Maximum 255 characters allowed."
      );
    });

    it("should handle varchar with different length limits", () => {
      expect(mapErrorToUserMessage("value too long for type character varying(100)")).toBe(
        "Input is too long. Maximum 100 characters allowed."
      );
      expect(mapErrorToUserMessage("value too long for type character varying(50)")).toBe(
        "Input is too long. Maximum 50 characters allowed."
      );
      expect(mapErrorToUserMessage("value too long for type character varying(1000)")).toBe(
        "Input is too long. Maximum 1000 characters allowed."
      );
    });

    it("should handle string data truncation errors", () => {
      const error = new Error("ERROR: string data right truncation");
      expect(mapErrorToUserMessage(error)).toBe("Input is too long. Please shorten your text.");
    });
  });

  // ============================================
  // NEW TESTS: Data Type Mismatch Handling
  // ============================================

  describe("data type mismatch handling", () => {
    it("should handle invalid integer input", () => {
      const error = new Error('invalid input syntax for type integer: "abc"');
      expect(mapErrorToUserMessage(error)).toBe("Please enter a valid whole number.");
    });

    it("should handle invalid bigint input", () => {
      const error = new Error('invalid input syntax for type bigint: "not-a-number"');
      expect(mapErrorToUserMessage(error)).toBe("Please enter a valid whole number.");
    });

    it("should handle invalid numeric/decimal input", () => {
      const error = new Error('invalid input syntax for type numeric: "abc"');
      expect(mapErrorToUserMessage(error)).toBe("Please enter a valid number.");
    });

    it("should handle invalid UUID input", () => {
      const error = new Error('invalid input syntax for type uuid: "not-a-uuid"');
      expect(mapErrorToUserMessage(error)).toBe("Invalid record identifier format.");
    });

    it("should handle invalid date input", () => {
      const error = new Error('invalid input syntax for type date: "not-a-date"');
      expect(mapErrorToUserMessage(error)).toBe("Please enter a valid date.");
    });

    it("should handle invalid timestamp input", () => {
      const error = new Error('invalid input syntax for type timestamp: "invalid"');
      expect(mapErrorToUserMessage(error)).toBe("Please enter a valid date and time.");
    });

    it("should handle invalid boolean input", () => {
      const error = new Error('invalid input syntax for type boolean: "maybe"');
      expect(mapErrorToUserMessage(error)).toBe("Please select Yes or No.");
    });

    it("should handle unknown type with generic message", () => {
      const error = new Error('invalid input syntax for type customtype: "value"');
      expect(mapErrorToUserMessage(error)).toBe("Invalid input format. Please check your entry.");
    });
  });
});
