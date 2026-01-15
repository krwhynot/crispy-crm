// Utils barrel exports
export { formatName, formatSingleName } from "./formatName";
export { formatRelativeTime } from "./formatRelativeTime";
export { rateLimiter, createRateLimiter } from "./rateLimiter";
export { secureStorage } from "./secureStorage";
export { getActivityIcon } from "./getActivityIcon";
// NOTE: contextMenu, exportScheduler, keyboardShortcuts removed from barrel - only used in tests
// Tests import directly from the source files
export { validateCsvFile, getSecurePapaParseConfig, sanitizeCsvValue } from "./csvUploadValidator";
export { getAvatarUrl, getInitials } from "./avatar.utils";
export {
  levenshteinDistance,
  findSimilarOpportunities,
  hasSimilarOpportunity,
  type SimilarOpportunity,
  type FindSimilarParams,
  type SimilarityCheckResult,
} from "./levenshtein";

// Text formatting
export {
  formatFullName,
  formatRoleAndDept,
  formatSalesName,
  formatTagsForExport,
  formatCount,
  EMPTY_PLACEHOLDER,
  ucFirst,
} from "./formatters";

// Safe JSON parsing with Zod validation
export { safeJsonParse } from "./safeJsonParse";

// Staleness calculations (PRD Section 6.3)
export {
  STAGE_STALE_THRESHOLDS,
  ACTIVE_PIPELINE_STAGES,
  CLOSED_STAGES,
  StageStaleThresholdsSchema,
  isOpportunityStale,
  getStaleThreshold,
  getDaysSinceActivity,
  countStaleOpportunities,
  filterStaleOpportunities,
  isClosedStage,
  isActivePipelineStage,
  type ActivePipelineStage,
  type ClosedStage,
  type StageStaleThresholds,
} from "./stalenessCalculation";

// Autocomplete defaults for ReferenceInput
export {
  AUTOCOMPLETE_DEBOUNCE_MS,
  AUTOCOMPLETE_MIN_CHARS,
  enableGetChoices,
  shouldRenderSuggestions,
  getAutocompleteProps,
  getQSearchAutocompleteProps,
  getContactSearchAutocompleteProps,
} from "./autocompleteDefaults";

// CSV export utilities
export {
  extractEmailByType,
  extractPhoneByType,
  flattenEmailsForExport,
  flattenPhonesForExport,
} from "./exportHelpers";

// List page patterns
export {
  COLUMN_VISIBILITY,
  SORT_FIELDS,
  DEFAULT_PER_PAGE,
  getColumnVisibility,
} from "./listPatterns";

// Notification utilities
export { useNotifyWithRetry } from "./useNotifyWithRetry";
