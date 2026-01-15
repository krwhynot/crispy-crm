// src/lib/index.ts - Central barrel for lib utilities

// Core utilities
export { cn } from "./utils";
export { pluralize } from "./utils/pluralize";

// Type guards for error handling
export { isHttpError, isError, hasMessage, getErrorMessage } from "./type-guards";

// Date utilities
export { formatDateDisplay, formatDateForInput, formatDateLocale, type DateInput } from "./formatDate";
export { parseDateSafely } from "./date-utils";

// Sanitization utilities
export { sanitizeHtml, sanitizeEmailHtml, sanitizeToPlainText } from "./sanitization";

// Logging utilities
export { logger } from "./logger";
export { DEV, devLog, devWarn, devError } from "./devLogger";

// Zod error formatting
export {
  zodErrorToFormErrors,
  zodErrorToReactAdminErrors,
  getFieldError,
  hasFieldError,
  getAllErrorMessages,
  createValidationError,
} from "./zodErrorFormatting";

// Generic memoization
export { genericMemo } from "./genericMemo";

// Input sanitization
export { sanitizeInputRestProps } from "./sanitizeInputRestProps";
