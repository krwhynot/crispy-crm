/**
 * Validation Constants
 *
 * Centralized string length limits for Zod schema validation.
 * These limits prevent DoS attacks via unbounded string inputs
 * and ensure consistent validation across the application.
 *
 * @see Engineering Constitution - Zod Validation section
 */

export const VALIDATION_LIMITS = {
  // =====================================================================
  // IDs and References
  // =====================================================================
  /** UUID v4 format is exactly 36 characters (xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx) */
  UUID_LENGTH: 36,

  // =====================================================================
  // Contact Information
  // =====================================================================
  /** RFC 5321 maximum email address length */
  EMAIL_MAX: 254,
  /** International phone format with extensions */
  PHONE_MAX: 30,

  // =====================================================================
  // URLs
  // =====================================================================
  /** Practical browser URL limit */
  URL_MAX: 2000,
  /** CDN avatar URLs are typically shorter */
  AVATAR_URL_MAX: 500,

  // =====================================================================
  // Text Fields (aligned with typical DB column sizes)
  // =====================================================================
  /** Names, titles, short identifiers */
  NAME_MAX: 100,
  /** Default varchar(255) equivalent */
  SHORT_TEXT_MAX: 255,
  /** Descriptions, summaries */
  MEDIUM_TEXT_MAX: 1000,
  /** Notes, comments, longer content */
  LONG_TEXT_MAX: 5000,

  // =====================================================================
  // System Fields
  // =====================================================================
  /** ISO 8601 timestamp strings (e.g., "2024-01-15T10:30:00.000Z") */
  TIMESTAMP_MAX: 50,
  /** Timezone identifiers (e.g., "America/Chicago") */
  TIMEZONE_MAX: 50,
} as const;

/**
 * Type for validation limits
 * Useful for type-safe access to limit values
 */
export type ValidationLimitKey = keyof typeof VALIDATION_LIMITS;
