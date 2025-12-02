// Opportunities hooks barrel exports
export { useOpportunityContacts } from "./useOpportunityContacts";
export { useFilteredProducts } from "./useFilteredProducts";
export { useQuickAdd } from "./useQuickAdd";
export { useStageMetrics } from "./useStageMetrics";
export { useAutoGenerateName } from "./useAutoGenerateName";
export { useExportOpportunities } from "./useExportOpportunities";
export { useColumnPreferences } from "./useColumnPreferences";
export { useContactOrgMismatch } from "./useContactOrgMismatch";
export type { MismatchedContact, UseContactOrgMismatchResult } from "./useContactOrgMismatch";
export { useSimilarOpportunityCheck } from "./useSimilarOpportunityCheck";
export type {
  UseSimilarOpportunityCheckResult,
  UseSimilarOpportunityCheckOptions,
} from "./useSimilarOpportunityCheck";
export { useDistributorAuthorization } from "./useDistributorAuthorization";
export type {
  DistributorPrincipalAuthorization,
  UseDistributorAuthorizationResult,
} from "./useDistributorAuthorization";
export { useBulkActionsState } from "./useBulkActionsState";
export type {
  BulkAction,
  UseBulkActionsStateOptions,
  UseBulkActionsStateResult,
} from "./useBulkActionsState";
