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
  "None",
  "Call",
  "Email",
  "Meeting",
  "Follow-up",
  "Proposal",
  "Discovery",
  "Administrative",
]);

export const priorityLevelSchema = z.enum(["low", "medium", "high", "critical"]);

// ============================================================================
// Core Schema
// ============================================================================

// ID schema: accepts string or number, coerces to number (React Admin compatibility)
const idSchema = z.coerce.number().int().positive();

export const taskSchema = z.object({
  id: idSchema.optional(),
  title: z.string().min(1, "Title is required").max(500, "Title too long"),
  description: z.string().max(2000, "Description too long").nullable().optional(),
  due_date: z.string().min(1, "Due date is required"),
  reminder_date: z.string().nullable().optional(),
  completed: z.boolean().default(false),
  completed_at: z.string().nullable().optional(),
  priority: priorityLevelSchema.default("medium"),
  type: taskTypeSchema,
  contact_id: idSchema, // Required: task must be associated with a contact
  opportunity_id: idSchema.nullable().optional(),
  sales_id: idSchema, // Required: task must be assigned to a sales rep
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

// ============================================================================
// Derived Schemas
// ============================================================================

/** Schema for creating new tasks */
export const taskCreateSchema = taskSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
});

/** Schema for updating existing tasks (requires id) */
export const taskUpdateSchema = taskSchema.partial().required({ id: true });

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
    type: "None" as const,
    due_date: new Date().toISOString().slice(0, 10),
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
  isUpdate ? taskUpdateSchema.parse(data) : taskSchema.parse(data);
