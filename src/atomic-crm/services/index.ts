// Service layer exports for Atomic CRM
// Follows Engineering Constitution principle #14: Service Layer orchestration for business ops

export { SalesService } from "./sales.service";
export { OpportunitiesService } from "./opportunities.service";
export { ActivitiesService } from "./activities.service";
export { JunctionsService } from "./junctions.service";
export { SegmentsService } from "./segments.service";
export { DigestService, createDigestService } from "./digest.service";

// Re-export types for convenience
export type { SalesFormData, Sale } from "../types";
export type { ContactOrganization, OpportunityParticipant } from "../types";
export type { Opportunity } from "../types";
export type { OpportunityCreateInput, OpportunityUpdateInput } from "./opportunities.service";

// Re-export digest types
export type {
  OverdueTask,
  StaleDeal,
  UserDigestSummary,
  DigestGenerationResult,
} from "./digest.service";
