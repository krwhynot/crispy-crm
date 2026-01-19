/**
 * Validation Utilities
 *
 * User-friendly error message mapping for Zod validation errors.
 * Transforms technical Zod error messages into clear, actionable messages
 * that users can understand.
 *
 * @example
 * ```typescript
 * import { z } from "zod";
 * import { getFriendlyErrorMessage } from "./utils";
 *
 * // Use in catch block
 * try {
 *   schema.parse(data);
 * } catch (error) {
 *   if (error instanceof z.ZodError) {
 *     const friendlyMessages = error.issues.map(getFriendlyErrorMessage);
 *   }
 * }
 * ```
 */

/**
 * Zod issue type for error handling
 * Uses a simplified interface compatible with both Zod v3 and v4
 */
interface ZodIssueBase {
  code: string;
  message: string;
  path: (string | number)[];
}

/**
 * Maps Zod validation errors to user-friendly messages
 * Handles common form validation scenarios including type mismatches,
 * enum violations, length constraints, and custom refinements.
 *
 * Compatible with Zod v3 and v4.
 *
 * @param issue - The Zod validation issue to map
 * @returns A user-friendly error message string
 */
export function getFriendlyErrorMessage(issue: ZodIssueBase): string {
  const code = issue.code;

  // Handle type mismatches
  if (code === "invalid_type") {
    const issueData = issue as ZodIssueBase & { expected?: string; input?: unknown };

    if (issueData.expected === "date") {
      return "Please select a valid date.";
    }
    if (issueData.input === undefined) {
      return "This field is required.";
    }
    if (issueData.input === null) {
      return "This field is required.";
    }
    return issue.message || "Invalid value provided.";
  }

  // Handle invalid_value (Zod v4) and invalid_enum_value (Zod v3)
  if (code === "invalid_value" || code === "invalid_enum_value") {
    return "Please select a valid option.";
  }

  // Handle invalid_union (when none of the union types match)
  if (code === "invalid_union") {
    return "Invalid value provided.";
  }

  // Handle refinement errors (custom validations)
  if (code === "custom") {
    return issue.message || "Invalid value.";
  }

  // Handle too_small (min length/value violations)
  if (code === "too_small") {
    const issueData = issue as ZodIssueBase & {
      minimum?: number;
      origin?: string;
      type?: string;
    };
    const min = issueData.minimum ?? 1;
    const origin = issueData.origin ?? issueData.type;

    if (origin === "string") {
      return min === 1 ? "This field is required." : `Please enter at least ${min} characters.`;
    }
    if (origin === "number") {
      return `Value must be at least ${min}.`;
    }
    if (origin === "array") {
      return min === 1 ? "At least one item is required." : `Please select at least ${min} items.`;
    }
    return issue.message || "Value is too small.";
  }

  // Handle too_big (max length/value violations)
  if (code === "too_big") {
    const issueData = issue as ZodIssueBase & {
      maximum?: number;
      origin?: string;
      type?: string;
    };
    const max = issueData.maximum ?? 0;
    const origin = issueData.origin ?? issueData.type;

    if (origin === "string") {
      return `Please keep this under ${max} characters.`;
    }
    if (origin === "number") {
      return `Value must be at most ${max}.`;
    }
    if (origin === "array") {
      return `Please select no more than ${max} items.`;
    }
    return issue.message || "Value is too large.";
  }

  // Handle invalid_format (Zod v4) and invalid_string (Zod v3)
  if (code === "invalid_format" || code === "invalid_string") {
    const issueData = issue as ZodIssueBase & { format?: string; validation?: string };
    const format = issueData.format ?? issueData.validation;

    if (format === "email") {
      return "Please enter a valid email address.";
    }
    if (format === "url") {
      return "Please enter a valid URL.";
    }
    if (format === "uuid") {
      return "Invalid identifier format.";
    }
    return issue.message || "Invalid format.";
  }

  // Handle unrecognized_keys (for strictObject)
  if (code === "unrecognized_keys") {
    const issueData = issue as ZodIssueBase & { keys?: string[] };
    if (issueData.keys && issueData.keys.length > 0) {
      const keyList = issueData.keys.map((k) => `'${k}'`).join(", ");
      return issueData.keys.length === 1
        ? `Unknown field ${keyList} is not allowed`
        : `Unknown fields ${keyList} are not allowed`;
    }
    return "Unexpected fields provided.";
  }

  // Fallback to default message
  return issue.message;
}

/**
 * Creates user-friendly error messages from a Zod error object
 *
 * @param error - Zod error object with issues array
 * @returns Object mapping field paths to friendly error messages
 *
 * @example
 * ```typescript
 * import { z } from "zod";
 * import { formatZodErrors } from "./utils";
 *
 * try {
 *   schema.parse(data);
 * } catch (error) {
 *   if (error instanceof z.ZodError) {
 *     const errors = formatZodErrors(error);
 *     // { "email": "Please enter a valid email address.", "name": "This field is required." }
 *   }
 * }
 * ```
 */
export function formatZodErrors(error: { issues: ZodIssueBase[] }): Record<string, string> {
  const formattedErrors: Record<string, string> = {};

  for (const issue of error.issues) {
    const path = issue.path.join(".");
    formattedErrors[path] = getFriendlyErrorMessage(issue);
  }

  return formattedErrors;
}
