/**
 * Centralized Error Message Mapping
 *
 * Sanitizes technical database/API errors into user-friendly messages.
 * Consolidates patterns from:
 * - src/components/ra-wrappers/create-in-dialog-button.tsx (parseCreateError)
 * - src/providers/supabase/wrappers/withErrorLogging.ts (sanitizeDatabaseError)
 *
 * Engineering Constitution: Single source of truth for error messaging
 */

/**
 * Context information for error message generation
 */
export interface ErrorContext {
  /** The resource being operated on (e.g., "contacts", "organizations") */
  resource?: string;
  /** The action being performed */
  action?: "create" | "update" | "delete";
}

/**
 * Human-readable field labels for error messages
 * Maps database column names to display labels
 */
export const FIELD_LABELS: Record<string, string> = {
  // Common fields
  email: "Email",
  name: "Name",
  title: "Title",

  // Contacts
  organization_id: "Organization",
  first_name: "First Name",
  last_name: "Last Name",
  phone: "Phone Number",
  department: "Department",
  linkedin_url: "LinkedIn URL",
  manager_id: "Manager",
  contact_id: "Contact",

  // Organizations
  website: "Website",
  address: "Address",
  city: "City",
  state: "State",
  postal_code: "Postal Code",
  segment_id: "Segment",
  parent_organization_id: "Parent Organization",

  // Opportunities
  opportunity_id: "Opportunity",
  customer_organization_id: "Customer Organization",
  principal_organization_id: "Principal Organization",
  distributor_organization_id: "Distributor Organization",
  stage: "Stage",
  estimated_close_date: "Estimated Close Date",
  win_reason: "Win Reason",
  loss_reason: "Loss Reason",

  // Products
  product_id: "Product",
  category: "Category",

  // Tasks
  due_date: "Due Date",
  assigned_to: "Assigned To",

  // Activities
  activity_type: "Activity Type",
  interaction_type: "Interaction Type",

  // Legacy/Common references
  sales_id: "Account Manager",
  principal_id: "Principal",
  distributor_id: "Distributor",
};

/**
 * Human-readable resource labels for error messages
 * Maps resource names to singular display labels
 */
export const RESOURCE_LABELS: Record<string, string> = {
  contacts: "contact",
  organizations: "organization",
  opportunities: "opportunity",
  activities: "activity",
  tasks: "task",
  products: "product",
  tags: "tag",
  segments: "segment",
  notes: "note",
  sales: "sales representative",
  users: "user",
  product_distributors: "product distributor",
  organization_distributors: "organization distributor",
  distributor_authorizations: "distributor authorization",
};

/**
 * Maps database constraint names to user-friendly error messages
 * Provides specific, actionable messages for constraint violations
 */
export const CONSTRAINT_MESSAGES: Record<string, string> = {
  // Unique constraints (23505 errors)
  organizations_name_unique_idx: "An organization with this name already exists.",
  tags_name_key: "A tag with this name already exists.",
  segments_name_type_unique: "A segment with this name and type already exists.",

  // Foreign key DELETE prevention (23503 errors - when deleting parent)
  activities_contact_id_fkey: "Cannot delete - this contact has associated activities.",
  contact_notes_contact_id_fkey: "Cannot delete - this contact has notes.",
  opportunity_contacts_contact_id_fkey: "Cannot delete - this contact is linked to opportunities.",
  contact_organizations_contact_id_fkey: "Cannot delete - this contact is linked to organizations.",

  // Foreign key INSERT/UPDATE validation (23503 errors - when creating/updating)
  contacts_organization_id_fkey: "Please select a valid organization.",
  contacts_sales_id_fkey: "Please select a valid account manager.",
  opportunities_customer_organization_id_fkey: "Please select a valid customer organization.",
  opportunities_principal_organization_id_fkey: "Please select a valid principal organization.",
  opportunities_distributor_organization_id_fkey: "Please select a valid distributor organization.",
  tasks_assigned_to_fkey: "Please select a valid user to assign this task to.",

  // Not-null constraints (23502 errors) - though these are better handled by field extraction
  contacts_email_not_null: "Email is required for contacts.",
  organizations_name_not_null: "Organization name is required.",
};

/**
 * Maps technical error messages to user-friendly messages
 *
 * Handles:
 * - Postgres constraint violations (23503, 23505, 23502)
 * - RLS/Auth errors (PGRST301, PGRST202, 403, 42501)
 * - Network/connection errors
 * - Validation errors
 *
 * @param error - The error to sanitize (can be Error, string, or unknown)
 * @param context - Optional resource and action context for specific error messages
 * @returns A user-friendly error message
 */
export function mapErrorToUserMessage(error: unknown, context?: ErrorContext): string {
  // Handle non-Error types
  if (error === null || error === undefined) {
    return "Something went wrong. Please try again.";
  }

  if (typeof error === "string") {
    return sanitizeMessage(error);
  }

  if (!(error instanceof Error)) {
    return "Something went wrong. Please try again.";
  }

  return sanitizeMessage(error.message);
}

/**
 * Sanitize a raw error message string into user-friendly format
 * @param message - The raw error message to sanitize
 * @param context - Optional context about the resource and action
 */
function sanitizeMessage(message: string, context?: ErrorContext): string {
  const msg = message.toLowerCase();

  // ============================================
  // Specific Constraint Name Matching (Priority)
  // ============================================

  // Extract constraint name from messages like: constraint "organizations_name_unique_idx"
  const constraintMatch = message.match(/constraint "([^"]+)"/i);
  if (constraintMatch?.[1] && CONSTRAINT_MESSAGES[constraintMatch[1]]) {
    return CONSTRAINT_MESSAGES[constraintMatch[1]];
  }

  // ============================================
  // Postgres Constraint Violations
  // ============================================

  // Unique constraint (23505)
  if (msg.includes("duplicate key") || msg.includes("unique constraint") || msg.includes("23505")) {
    if (msg.includes("name")) return "This name is already in use. Please choose a different name.";
    if (msg.includes("email")) return "This email is already in use.";
    return "This already exists. Please use a different value.";
  }

  // Foreign key constraint (23503)
  if (
    msg.includes("foreign key") ||
    msg.includes("23503") ||
    msg.includes("violates foreign key")
  ) {
    if (msg.includes("delete") || msg.includes("update")) {
      return "Cannot delete — other records depend on this.";
    }
    return "Invalid selection — referenced record not found.";
  }

  // Not null constraint (23502)
  if (
    msg.includes("not-null") ||
    msg.includes("null value") ||
    msg.includes("23502") ||
    msg.includes("violates not-null")
  ) {
    // Try to extract field name
    const match = message.match(/column '(\w+)'/i);
    if (match && match[1]) {
      const fieldName = match[1];
      const label = FIELD_LABELS[fieldName] || fieldName.replace(/_/g, " ");
      return `${label} is required.`;
    }
    return "Required field is missing.";
  }

  // Check constraint violation
  if (msg.includes("violates check constraint")) {
    return "Invalid value provided. Please check your input.";
  }

  // ============================================
  // Auth/RLS/Permission Errors
  // ============================================

  // RLS violations
  if (msg.includes("rls") || msg.includes("row-level security") || msg.includes("pgrst202")) {
    return "You don't have access to this record.";
  }

  // JWT/Session expired
  if (
    msg.includes("jwt") ||
    msg.includes("token") ||
    msg.includes("expired") ||
    msg.includes("pgrst301")
  ) {
    return "Your session expired. Please sign in again.";
  }

  // Permission denied
  if (
    msg.includes("403") ||
    msg.includes("forbidden") ||
    msg.includes("permission") ||
    msg.includes("insufficient_privilege") ||
    msg.includes("42501")
  ) {
    return "You don't have permission for this action.";
  }

  // Unauthorized
  if (msg.includes("401") || msg.includes("unauthorized") || msg.includes("not authenticated")) {
    return "Please sign in to continue.";
  }

  // ============================================
  // Network/Connection Errors
  // ============================================

  if (
    msg.includes("network") ||
    msg.includes("fetch") ||
    msg.includes("connection") ||
    msg.includes("failed to fetch") ||
    msg.includes("networkerror")
  ) {
    return "Connection issue. Please check your internet and try again.";
  }

  if (msg.includes("timeout") || msg.includes("timed out")) {
    return "Request timed out. Please try again.";
  }

  // ============================================
  // Validation/Format Errors
  // ============================================

  // Generic validation failure
  if (msg.includes("validation failed") || msg.includes("invalid input")) {
    return "Please check the form for errors.";
  }

  // ============================================
  // Safe Passthrough
  // ============================================

  // If the message is short and doesn't contain technical terms, pass it through
  // This allows intentionally user-friendly backend messages to show
  if (
    message.length < 80 &&
    !msg.includes("constraint") &&
    !msg.includes("pgrst") &&
    !msg.includes("supabase") &&
    !msg.includes("postgrest") &&
    !msg.includes("postgres") &&
    !msg.includes("relation") &&
    !msg.includes("column") &&
    !msg.includes("violates") &&
    !msg.includes("coerce") &&
    !msg.includes("json object")
  ) {
    return message;
  }

  // ============================================
  // Fallback
  // ============================================

  return "Something went wrong. Please try again.";
}

/**
 * Generate a context-specific fallback message
 *
 * Use this when you know the action being performed and want a specific fallback.
 *
 * @param action - The action being performed (e.g., "create", "update", "delete")
 * @param resource - The resource type (e.g., "organization", "contact")
 * @returns A contextual error message
 */
export function getActionErrorMessage(
  action: "create" | "update" | "delete" | "save" | "load",
  resource?: string
): string {
  const resourceLabel = resource ? ` ${resource}` : "";

  switch (action) {
    case "create":
      return `Couldn't create${resourceLabel}. Please try again.`;
    case "update":
      return `Couldn't save changes${resourceLabel ? ` to${resourceLabel}` : ""}. Please try again.`;
    case "delete":
      return `Couldn't delete${resourceLabel}. Please try again.`;
    case "save":
      return `Couldn't save${resourceLabel}. Please try again.`;
    case "load":
      return `Couldn't load${resourceLabel}. Please try again.`;
    default:
      return "Something went wrong. Please try again.";
  }
}

/**
 * Check if an error is likely a network/connectivity issue
 */
export function isNetworkError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const msg = error.message.toLowerCase();
  return (
    msg.includes("network") ||
    msg.includes("fetch") ||
    msg.includes("connection") ||
    msg.includes("failed to fetch") ||
    msg.includes("timeout")
  );
}

/**
 * Check if an error is an authentication/session error
 */
export function isAuthError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const msg = error.message.toLowerCase();
  return (
    msg.includes("jwt") ||
    msg.includes("token") ||
    msg.includes("expired") ||
    msg.includes("pgrst301") ||
    msg.includes("401") ||
    msg.includes("unauthorized")
  );
}

/**
 * Sanitize PostgreSQL error messages for user display
 * Removes technical details and provides actionable messages
 *
 * Used by withErrorLogging to extract field-specific validation errors
 * from database constraint violations.
 *
 * @param message - Raw database error message
 * @returns Object with field name and user-friendly message, or null if not recognized
 */
export function sanitizeDatabaseError(message: string): { field: string; message: string } | null {
  // Pattern: "null value in column 'X' of relation 'Y' violates not-null constraint"
  const notNullMatch = message.match(/null value in column '(\w+)'.*violates not-null constraint/i);
  if (notNullMatch) {
    const columnName = notNullMatch[1];
    const label = FIELD_LABELS[columnName] || columnName.replace(/_/g, " ");
    return { field: columnName, message: `${label} is required` };
  }

  // Pattern: "duplicate key value violates unique constraint"
  const uniqueMatch = message.match(/duplicate key.*constraint "(\w+)"/i);
  if (uniqueMatch) {
    return { field: "_error", message: "This record already exists" };
  }

  // Pattern: "violates foreign key constraint"
  const fkMatch = message.match(/violates foreign key constraint.*column "(\w+)"/i);
  if (fkMatch) {
    const columnName = fkMatch[1];
    const label = FIELD_LABELS[columnName] || columnName.replace(/_/g, " ");
    return { field: columnName, message: `Invalid ${label} reference` };
  }

  // Pattern: "violates check constraint"
  if (message.includes("violates check constraint")) {
    return { field: "_error", message: "Invalid value provided" };
  }

  return null; // Not a recognized database error
}
