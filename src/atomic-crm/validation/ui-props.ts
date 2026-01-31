/**
 * UI Props Schemas — Test-Only Documentation
 *
 * These schemas define expected prop shapes for UI components. They are validated
 * in tests to ensure component contracts remain stable, but are NOT used for
 * runtime prop validation (React's type system handles that).
 *
 * @remarks Test-only — do not import into production component code.
 */

import { z } from "zod";

// ============================================================================
// Function Validators (Zod 4 custom schemas)
// ============================================================================

/**
 * Validator for void callback functions (no args, no return)
 */
const voidCallbackSchema = z.custom<() => void>((val) => typeof val === "function", {
  message: "Expected a callback function",
});

/**
 * Validator for boolean callback functions (receives boolean arg)
 */
const booleanCallbackSchema = z.custom<(isDirty: boolean) => void>(
  (val) => typeof val === "function",
  { message: "Expected a function receiving boolean" }
);

/**
 * Validator for record callback functions (receives record arg)
 */
const recordCallbackSchema = z.custom<(draft: Record<string, unknown>) => void>(
  (val) => typeof val === "function",
  { message: "Expected a function receiving record" }
);

/**
 * Validator for number callback functions (receives number arg)
 */
const numberCallbackSchema = z.custom<(id: number) => void>((val) => typeof val === "function", {
  message: "Expected a function receiving number",
});

// ============================================================================
// SlideOver Schemas
// ============================================================================

/**
 * Base schema for all SlideOver component props
 * Used by: ContactSlideOver, OrganizationSlideOver, OpportunitySlideOver,
 *          TaskSlideOver, ActivitySlideOver, ProductSlideOver, EngagementSlideOver
 */
export const slideOverPropsSchema = z.strictObject({
  recordId: z.number().int().positive().nullable(),
  isOpen: z.boolean(),
  onClose: voidCallbackSchema,
  mode: z.enum(["view", "edit"]).default("view"),
  onModeToggle: voidCallbackSchema,
});

/**
 * Extended SlideOver props with optional edit permission
 * Used when component needs to conditionally show/hide edit controls
 */
export const slideOverPropsWithCanEditSchema = slideOverPropsSchema.extend({
  canEdit: z.boolean().optional(),
});

// ============================================================================
// Tab Component Schemas
// ============================================================================

/**
 * Props schema for tab components within SlideOvers
 * Each tab receives the parent record and mode state
 */
export const tabComponentPropsSchema = z.strictObject({
  record: z.record(z.string().max(50), z.unknown()),
  mode: z.enum(["view", "edit"]),
  onModeToggle: voidCallbackSchema.optional(),
  isActiveTab: z.boolean(),
  onDirtyChange: booleanCallbackSchema.optional(),
});

// ============================================================================
// Dashboard Form Schemas
// ============================================================================

/**
 * Props schema for QuickLogForm component on dashboard
 * Supports draft persistence and pre-population from context
 */
export const quickLogFormPropsSchema = z.strictObject({
  onComplete: voidCallbackSchema,
  onRefresh: voidCallbackSchema.optional(),
  initialDraft: z.record(z.string().max(50), z.unknown()).optional().nullable(),
  onDraftChange: recordCallbackSchema.optional(),
  initialContactId: z.number().int().positive().optional(),
  initialOrganizationId: z.number().int().positive().optional(),
  initialOpportunityId: z.number().int().positive().optional(),
});

// ============================================================================
// List Layout Schemas
// ============================================================================

/**
 * Props schema for ContactListLayout component
 * Manages list/detail split view with SlideOver integration
 */
export const contactListLayoutPropsSchema = z.strictObject({
  openSlideOver: numberCallbackSchema,
  isSlideOverOpen: z.boolean(),
});

// ============================================================================
// Type Inference
// ============================================================================

export type TabComponentProps = z.infer<typeof tabComponentPropsSchema>;
export type QuickLogFormProps = z.infer<typeof quickLogFormPropsSchema>;
