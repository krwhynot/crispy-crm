/**
 * Activities validation module
 *
 * Implements validation rules for customer interactions and engagements.
 * This is the public API - import from '@/atomic-crm/validation/activities'
 */

// Type schemas and type exports
export {
  activityTypeSchema,
  interactionTypeSchema,
  sampleStatusSchema,
  sentimentSchema,
  type ActivityType,
  type InteractionType,
  type SampleStatus,
  type Sentiment,
} from "./types";

// Constants and UI options
export {
  INTERACTION_TYPE_OPTIONS,
  SAMPLE_STATUS_OPTIONS,
  ACTIVITY_TYPE_GROUPS,
  ACTIVITY_TYPE_TO_API,
  ACTIVITY_TYPE_FROM_API,
  ACTIVITY_TYPE_MAP,
  OUTCOME_OPTIONS_BY_TYPE,
  SAMPLE_ACTIVE_STATUSES,
} from "./constants";

// Core schemas
export {
  baseActivitiesSchema,
  activitiesSchema,
  engagementsSchema,
  interactionsSchema,
  updateActivitiesSchema,
  activityNoteFormSchema,
  type ActivitiesInput,
  type Activities,
  type EngagementsInput,
  type Engagements,
  type InteractionsInput,
  type Interactions,
  type ActivityNoteFormData,
  type ActivityRecord,
} from "./schemas";

// Validation functions
export {
  validateActivitiesForm,
  validateCreateActivities,
  validateUpdateActivities,
  validateEngagementsForm,
  validateCreateEngagements,
  validateUpdateEngagements,
  validateInteractionsForm,
  validateCreateInteractions,
  validateUpdateInteractions,
} from "./validation";

// UI transforms and QuickLogForm schemas
export {
  activityDisplayTypeSchema,
  activityOutcomeSchema,
  quickLogFormBaseSchema,
  quickLogFormSchema,
  activityLogSchema,
  type QuickLogFormInput,
  type QuickLogFormOutput,
  type ActivityLogInput,
  type ActivityLog,
} from "./transforms";
