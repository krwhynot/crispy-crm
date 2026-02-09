// Service layer exports for Atomic CRM
// Follows Engineering Constitution principle #14: Service Layer orchestration for business ops

export { SalesService } from "./sales.service";
export { OpportunitiesService } from "./opportunities.service";
export { JunctionsService } from "./junctions.service";
export { SegmentsService } from "./segments.service";
export { DigestService, createDigestService } from "./digest.service";
export { ProductsService } from "./products.service";
export {
  ProductDistributorsService,
  parseCompositeId,
  createCompositeId,
} from "./productDistributors.service";

// Re-export types for convenience
export type { SalesFormData, Sale } from "../types";
export type { OpportunityParticipant } from "../types";
export type { Opportunity } from "../types";
export type { OpportunityCreateInput, OpportunityUpdateInput } from "./opportunities.service";
export type {
  ProductCreateInput,
  ProductUpdateInput,
  ProductWithDistributors,
  ProductDistributorInput,
} from "./products.service";
export type {
  ProductDistributor,
  ProductDistributorUpdateInput,
} from "./productDistributors.service";

// Re-export digest types
export type {
  OverdueTask,
  StaleDeal,
  UserDigestSummary,
  DigestGenerationResult,
} from "./digest.service";
