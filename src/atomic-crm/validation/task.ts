import { z } from "zod";

/**
 * Task Type Enum
 * Matches database enum: task_type
 */
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

export type TaskType = z.infer<typeof taskTypeSchema>;

/**
 * Priority Level Enum
 * Matches database enum: priority_level
 */
export const priorityLevelSchema = z.enum(["low", "medium", "high", "critical"]);

export type PriorityLevel = z.infer<typeof priorityLevelSchema>;

/**
 * Task Schema
 * Validation for task records
 *
 * Per Engineering Constitution: Single source of truth at API boundary
 * Form state derives from this schema via .partial().parse({})
 */
export const taskSchema = z.object({
  id: z.number().int().positive().optional(),
  title: z.string().min(1, "Title is required").max(500, "Title too long"),
  description: z.string().max(2000, "Description too long").nullable().optional(),
  due_date: z.string().date("Due date must be a valid date"),
  reminder_date: z.string().date("Reminder date must be a valid date").nullable().optional(),
  completed: z.boolean().default(false),
  completed_at: z.string().datetime().nullable().optional(),
  priority: priorityLevelSchema.default("medium"),
  type: taskTypeSchema.default("None"),
  contact_id: z.number().int().positive().nullable().optional(),
  opportunity_id: z.number().int().positive().nullable().optional(),
  sales_id: z.number().int().positive().nullable().optional(),
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional(),
});

export type Task = z.infer<typeof taskSchema>;

/**
 * Partial update schema - for editing existing tasks
 * Requires ID for validation at API boundary
 */
export const taskUpdateSchema = taskSchema.partial().required({ id: true });

/**
 * Create schema - for new tasks
 * Title and due_date are required for creation
 */
export const taskCreateSchema = taskSchema.omit({ id: true, created_at: true, updated_at: true });

/**
 * Default values for new task form
 * Per Engineering Constitution: Form state from schema
 */
export const getTaskDefaultValues = () =>
  taskSchema.partial().parse({
    completed: false,
    priority: "medium" as const,
    type: "None" as const,
    due_date: new Date().toISOString().slice(0, 10), // Today's date
  });
