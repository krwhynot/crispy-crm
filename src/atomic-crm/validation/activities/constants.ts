/**
 * Activity constants and UI options
 *
 * Static constants for activity types, options, and display mappings.
 */

import { sampleStatusSchema } from "./types";

/**
 * Interaction type options for UI components (15 types after STI migration)
 */
export const INTERACTION_TYPE_OPTIONS = [
  { value: "call", label: "Call" },
  { value: "email", label: "Email" },
  { value: "meeting", label: "Meeting" },
  { value: "demo", label: "Demo" },
  { value: "proposal", label: "Proposal" },
  { value: "follow_up", label: "Follow Up" },
  { value: "trade_show", label: "Trade Show" },
  { value: "site_visit", label: "Site Visit" },
  { value: "contract_review", label: "Contract Review" },
  { value: "check_in", label: "Check In" },
  { value: "social", label: "Social" },
  { value: "note", label: "Note" },
  { value: "sample", label: "Sample" },
  // STI task type mappings
  { value: "administrative", label: "Administrative" },
  { value: "other", label: "Other" },
] as const;

/**
 * Sample status options for UI components
 */
export const SAMPLE_STATUS_OPTIONS = [
  { value: "sent", label: "Sent" },
  { value: "received", label: "Received" },
  { value: "feedback_pending", label: "Feedback Pending" },
  { value: "feedback_received", label: "Feedback Received" },
] as const;

/**
 * Activity types organized by logical groups for dropdown UI
 * Uses Title Case for display, snake_case for API
 */
export const ACTIVITY_TYPE_GROUPS = {
  Communication: ["Call", "Email", "Check-in", "Social"] as const,
  Meetings: ["Meeting", "Demo", "Site Visit", "Trade Show"] as const,
  Documentation: ["Proposal", "Contract Review", "Follow-up", "Note", "Sample"] as const,
} as const;

/**
 * Map from Title Case (UI) to snake_case (API/database)
 * Used when submitting forms to convert display values to database values
 */
export const ACTIVITY_TYPE_TO_API: Record<string, string> = {
  Call: "call",
  Email: "email",
  Meeting: "meeting",
  Demo: "demo",
  Proposal: "proposal",
  "Follow-up": "follow_up",
  "Trade Show": "trade_show",
  "Site Visit": "site_visit",
  "Contract Review": "contract_review",
  "Check-in": "check_in",
  Social: "social",
  Note: "note",
  Sample: "sample",
} as const;

/**
 * Map from snake_case (API/database) to Title Case (UI)
 * Used when displaying database values in the UI
 */
export const ACTIVITY_TYPE_FROM_API: Record<string, string> = {
  call: "Call",
  email: "Email",
  meeting: "Meeting",
  demo: "Demo",
  proposal: "Proposal",
  follow_up: "Follow-up",
  trade_show: "Trade Show",
  site_visit: "Site Visit",
  contract_review: "Contract Review",
  check_in: "Check-in",
  social: "Social",
  note: "Note",
  sample: "Sample",
} as const;

// Legacy alias for backward compatibility during migration
export const ACTIVITY_TYPE_MAP = ACTIVITY_TYPE_TO_API;

/**
 * Context-specific outcome options by activity type
 * Provides relevant outcomes for each activity type category
 *
 * Design rationale:
 * - "Left Voicemail" only makes sense for Call
 * - "Bounced" only makes sense for Email
 * - Meeting-type activities use scheduling-related outcomes
 */
export const OUTCOME_OPTIONS_BY_TYPE: Record<string, readonly string[]> = {
  // Communication outcomes
  Call: ["Connected", "Left Voicemail", "No Answer", "Wrong Number"],
  Email: ["Sent", "Replied", "No Reply", "Bounced"],
  "Check-in": ["Connected", "Left Voicemail", "No Answer"],
  Social: ["Engaged", "No Response"],

  // Meeting outcomes
  Meeting: ["Held", "Rescheduled", "Cancelled", "No Show"],
  Demo: ["Held", "Rescheduled", "Cancelled", "No Show"],
  "Site Visit": ["Completed", "Rescheduled", "Cancelled"],
  "Trade Show": ["Attended", "Engaged", "Collected Leads"],

  // Documentation outcomes
  Proposal: ["Sent", "Accepted", "Rejected", "Revised"],
  "Contract Review": ["Completed", "Pending Changes", "Approved"],
  "Follow-up": ["Completed", "Rescheduled"],
  Note: ["Completed"],
  Sample: ["Sent", "Received", "Feedback Pending", "Feedback Received"],
} as const;

/**
 * Active sample statuses that require follow-up (WG-001)
 * Per PRD 4.4: "Samples require follow-up activities"
 * Active statuses: sent, received, feedback_pending (not feedback_received - workflow complete)
 */
export const SAMPLE_ACTIVE_STATUSES = ["sent", "received", "feedback_pending"] as const;
