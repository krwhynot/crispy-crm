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
 * Human-readable field labels for error messages
 * Maps database column names to display labels
 */
const FIELD_LABELS: Record<string, string> = {
  organization_id: "Organization",
  first_name: "First Name",
  last_name: "Last Name",
  sales_id: "Account Manager",
  email: "Email",
  name: "Name",
  title: "Title",
  principal_id: "Principal",
  distributor_id: "Distributor",
  contact_id: "Contact",
  opportunity_id: "Opportunity",
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
 * @returns A user-friendly error message
 */
export function mapErrorToUserMessage(error: unknown): string {
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
 */
function sanitizeMessage(message: string): string {
  const msg = message.toLowerCase();

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
  if (msg.includes("foreign key") || msg.includes("23503") || msg.includes("violates foreign key")) {
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
