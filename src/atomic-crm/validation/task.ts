import { z } from "zod";

/**
 * Task Validation Schema
 *
 * Per Engineering Constitution:
 * - Single source of truth at API boundary
 * - Form state derives from schema via .partial().parse({})
 * - No over-engineering: fail fast, no complex transforms
 */

// ============================================================================
// Enums (match PostgreSQL enums)
// ============================================================================

export const taskTypeSchema = z.enum([
  "Call",
  "Email",
  "Meeting",
  "Follow-up",
  "Demo",
  "Proposal",
  "Other",
]);

export const priorityLevelSchema = z.enum(["low", "medium", "high", "critical"]);

// ============================================================================
// Core Schema
// ============================================================================

// ID schema: accepts string or number, coerces to number (React Admin compatibility)
const idSchema = z.coerce.number().int().positive();

export const taskSchema = z.strictObject({
  id: idSchema.optional(),
  title: z.string().min(1, "Title is required").max(500, "Title too long"),
  description: z.string().max(2000, "Description too long").nullable().optional(),
  due_date: z.coerce.date({ error: "Due date is required" }),
  reminder_date: z.coerce.date().nullable().optional(),
  completed: z.coerce.boolean().default(false),
  completed_at: z.string().max(50).nullable().optional(),
  priority: priorityLevelSchema.default("medium"),
  type: taskTypeSchema,
  contact_id: idSchema.nullable().optional(), // Optional: task can be associated with contact, opportunity, or organization
  opportunity_id: idSchema.nullable().optional(),
  organization_id: idSchema.nullable().optional(), // Optional: direct link to organization (or inherit from contact)
  sales_id: idSchema, // Required: task must be assigned to a sales rep

  // Snooze functionality (per migration 20251203191347_add_snooze_until_to_tasks.sql)
  // Uses preprocess to handle empty string from forms → null
  snooze_until: z.preprocess(
    (val) => (val === "" ? null : val),
    z.coerce.date().nullable().optional()
  ), // NULL = active, future timestamp = snoozed

  // Audit fields (per migration 20251127054700_fix_critical_rls_security_tasks.sql)
  created_by: z.union([z.string(), z.number()]).optional().nullable(), // Sales rep who created this task (different from assignee)
  created_at: z.string().max(50).optional(),
  updated_at: z.string().max(50).optional(),
  deleted_at: z.string().max(50).optional().nullable(), // Soft-delete timestamp (NULL = active)
});

// ============================================================================
// Derived Schemas
// ============================================================================

/**
 * Schema for creating new tasks (system fields auto-populated by DB triggers)
 *
 * Maintains strictObject behavior for security - prevents mass assignment of
 * audit fields. Computed fields from views only appear on UPDATE (reads from DB),
 * not on CREATE (user input), so passthrough is not needed here.
 */
export const taskCreateSchema = taskSchema.omit({
  id: true,
  created_by: true, // Auto-set by trigger_set_task_created_by
  created_at: true,
  updated_at: true,
  deleted_at: true, // Soft-delete managed by application
});

/**
 * Schema for updating existing tasks (requires id)
 *
 * Uses passthrough() to allow computed fields from database views (assignee_name,
 * contact_name, etc.) through validation - these get stripped by beforeSave callback.
 * This maintains strictObject security for creates while allowing flexible updates.
 */
export const taskUpdateSchema = taskSchema
  .partial()
  .passthrough() // Allow computed fields through - stripped by lifecycle callbacks
  .required({ id: true });

// ============================================================================
// Types
// ============================================================================

export type Task = z.infer<typeof taskSchema>;
export type TaskType = z.infer<typeof taskTypeSchema>;
export type PriorityLevel = z.infer<typeof priorityLevelSchema>;
export type CreateTaskInput = z.infer<typeof taskCreateSchema>;
export type UpdateTaskInput = z.infer<typeof taskUpdateSchema>;

// ============================================================================
// Form Defaults (per Engineering Constitution #5)
// ============================================================================

/**
 * Generate default values for task forms
 * Per Constitution: Form state from schema via .partial().parse({})
 */
export const getTaskDefaultValues = () =>
  taskSchema.partial().parse({
    completed: false,
    priority: "medium" as const,
    type: "Call" as const, // Changed from "None" - meaningful default reduces cognitive load
    due_date: new Date(),
  });

// ============================================================================
// Backward Compatibility Aliases (for legacy code)
// ============================================================================

/** @deprecated Use taskCreateSchema */
export const createTaskSchema = taskCreateSchema;

/** @deprecated Use taskUpdateSchema */
export const updateTaskSchema = taskUpdateSchema;

/** @deprecated Use taskTypeSchema */
export const taskTypeEnum = taskTypeSchema;

// ============================================================================
// Validation Functions
// Per Constitution: Simple validation at API boundary, fail fast
// ============================================================================

/** Validate task creation - throws on invalid data */
export const validateCreateTask = (data: unknown) => taskCreateSchema.parse(data);

/** Validate task update - throws on invalid data */
export const validateUpdateTask = (data: unknown) => taskUpdateSchema.parse(data);

/** Validate task for submission - throws on invalid data */
export const validateTaskForSubmission = (data: unknown, isUpdate = false) =>
  isUpdate ? taskUpdateSchema.parse(data) : taskCreateSchema.parse(data);
