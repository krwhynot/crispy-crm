/**
 * Activity type definitions
 *
 * Core Zod schemas for activity types and derived TypeScript types.
 */

import { z } from "zod";

/**
 * Activity type enum - determines the activity category
 * After STI migration, 'task' distinguishes planned items from logged interactions
 */
export const activityTypeSchema = z.enum([
  "activity", // Logged activity (call, email, meeting, etc.)
  "task", // Planned task (STI pattern - stored in same table)
]);

/**
 * Interaction type enum - the specific type of activity (15 types after STI migration)
 */
export const interactionTypeSchema = z
  .enum([
    "call",
    "email",
    "meeting",
    "demo",
    "proposal",
    "follow_up",
    "trade_show",
    "site_visit",
    "contract_review",
    "check_in",
    "social",
    "note",
    "sample", // Added for sample tracking workflow (PRD 4.4)
    // STI task type mappings
    "administrative", // Maps from task type 'None'
    "other", // Maps from task type 'Other'
  ])
  .default("call");

/**
 * Sample status enum - workflow states for sample activities
 * Workflow: sent -> received -> feedback_pending -> feedback_received
 */
export const sampleStatusSchema = z.enum([
  "sent",
  "received",
  "feedback_pending",
  "feedback_received",
]);

/**
 * Sentiment enum
 */
export const sentimentSchema = z.enum(["positive", "neutral", "negative"]);

// Type inference
export type ActivityType = z.infer<typeof activityTypeSchema>;
export type InteractionType = z.infer<typeof interactionTypeSchema>;
export type SampleStatus = z.infer<typeof sampleStatusSchema>;
export type Sentiment = z.infer<typeof sentimentSchema>;
