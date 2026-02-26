import { mapErrorToUserMessage, type ErrorContext } from "./errorMessages";

/**
 * Extract user-friendly error from provider errors.
 *
 * Handles two error shapes:
 * 1. RA validation errors: { body: { errors: { field: "msg" } } }
 * 2. Everything else: delegates to mapErrorToUserMessage
 */
export function extractProviderValidationMessage(error: unknown, context?: ErrorContext): string {
  // RA-style validation error with body.errors (from withValidation)
  if (typeof error === "object" && error !== null && "body" in error) {
    const body = (error as { body?: { errors?: Record<string, string> } }).body;
    if (body?.errors && typeof body.errors === "object") {
      const entries = Object.entries(body.errors);
      if (entries.length > 0) {
        return entries.map(([, msg]) => msg).join(". ");
      }
    }
  }

  // Delegate to centralized error mapper (handles constraints, auth, network, etc.)
  return mapErrorToUserMessage(error, context);
}
