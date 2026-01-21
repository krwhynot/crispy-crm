/**
 * DataProvider Wrappers
 *
 * Composable wrappers that add cross-cutting concerns to DataProviders.
 * These implement the Decorator pattern for clean separation of concerns.
 *
 * Usage:
 * ```typescript
 * import { withErrorLogging, withValidation } from './wrappers';
 *
 * // Compose wrappers (order matters - outer wrappers catch inner errors)
 * const provider = withErrorLogging(
 *   withValidation(
 *     baseProvider
 *   )
 * );
 * ```
 *
 * Engineering Constitution: Each wrapper handles a single responsibility
 */

export { withErrorLogging } from "./withErrorLogging";
export type { DataProviderLogParams, ValidationError, ExtendedError } from "./withErrorLogging";

export { withValidation } from "./withValidation";
export type { ZodError, ReactAdminValidationError } from "./withValidation";

export { withSkipDelete } from "./withSkipDelete";
