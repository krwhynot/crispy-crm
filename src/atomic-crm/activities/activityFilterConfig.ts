/**
 * Activity Filter Configuration
 *
 * Defines how activity filters are displayed in the FilterChipBar.
 * Imports from validation schema to prevent label drift.
 *
 * @module activities/activityFilterConfig
 */

import { validateFilterConfig } from "../filters/filterConfigSchema";
import {
  INTERACTION_TYPE_OPTIONS,
  SAMPLE_STATUS_OPTIONS,
  sentimentSchema,
} from "../validation/activities";

/**
 * Convert validation options to filter choices format
 */
const INTERACTION_TYPE_CHOICES = INTERACTION_TYPE_OPTIONS.map((opt) => ({
  id: opt.value,
  name: opt.label,
}));

const SAMPLE_STATUS_CHOICES = SAMPLE_STATUS_OPTIONS.map((opt) => ({
  id: opt.value,
  name: opt.label,
}));

const SENTIMENT_CHOICES = sentimentSchema.options.map((value) => ({
  id: value,
  name: value.charAt(0).toUpperCase() + value.slice(1),
}));

/**
 * Filter configuration for Activities list
 *
 * Matches filters available in ActivityListFilter.tsx:
 * - type: Interaction type (NOT activity_type)
 * - sample_status: Sample tracking status
 * - activity_date@gte/lte: Activity date range
 * - sentiment: Activity sentiment
 * - created_by: Creator reference (NOT sales_id)
 *
 * ⚠️ NOTE: Activities use @gte/@lte format for date filters
 */
export const ACTIVITY_FILTER_CONFIG = validateFilterConfig([
  {
    key: "type",
    label: "Type",
    type: "multiselect",
    choices: INTERACTION_TYPE_CHOICES,
  },
  {
    key: "sample_status",
    label: "Sample Status",
    type: "multiselect",
    choices: SAMPLE_STATUS_CHOICES,
  },
  {
    key: "activity_date@gte",
    label: "After",
    type: "date-range",
    removalGroup: "activity_date_range",
  },
  {
    key: "activity_date@lte",
    label: "Before",
    type: "date-range",
    removalGroup: "activity_date_range",
  },
  {
    key: "sentiment",
    label: "Sentiment",
    type: "multiselect",
    choices: SENTIMENT_CHOICES,
  },
  {
    key: "created_by",
    label: "Created By",
    type: "reference",
    reference: "sales",
  },
]);
