// Dashboard V3 hooks barrel exports
export { useCurrentSale } from "./useCurrentSale";
export { usePrincipalOpportunities } from "./usePrincipalOpportunities";
export { usePrincipalPipeline } from "./usePrincipalPipeline";
export { useMyTasks } from "./useMyTasks";
export { useHybridSearch } from "./useHybridSearch";
export { useKPIMetrics, STAGE_STALE_THRESHOLDS, type KPIMetrics } from "./useKPIMetrics";
export { useTeamActivities, type TeamActivity } from "./useTeamActivities";
export {
  useMyPerformance,
  type MyPerformanceMetrics,
  type PerformanceMetric,
} from "./useMyPerformance";
export { useDebouncedSearch } from "./useDebouncedSearch";
export { useEntityData, type Contact, type Organization, type Opportunity } from "./useEntityData";
export { usePipelineTableState, type SortField, type SortDirection } from "./usePipelineTableState";
export { useTaskCount } from "./useTaskCount";
