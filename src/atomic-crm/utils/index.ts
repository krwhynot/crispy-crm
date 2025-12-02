// Utils barrel exports
export { formatName, formatFullName } from "./formatName";
export { formatRelativeTime } from "./formatRelativeTime";
export { rateLimiter, createRateLimiter } from "./rateLimiter";
export { secureStorage } from "./secureStorage";
export { getActivityIcon } from "./getActivityIcon";
export { ContextMenu, ContextMenuItem } from "./contextMenu";
export { exportScheduler } from "./exportScheduler";
export { keyboardShortcuts, registerShortcut, unregisterShortcut } from "./keyboardShortcuts";
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
} from "./formatters";

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
