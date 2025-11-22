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

// ============================================================================
// Aliases for backward compatibility with legacy tasks.ts
// ============================================================================

/** @deprecated Use taskCreateSchema instead */
export const createTaskSchema = taskCreateSchema;

/** @deprecated Use taskUpdateSchema instead */
export const updateTaskSchema = taskUpdateSchema;

/** @deprecated Use taskTypeSchema instead */
export const taskTypeEnum = taskTypeSchema;

// ============================================================================
// Validation with refinements (from legacy tasks.ts)
// ============================================================================

/**
 * Schema for task with reminder validation
 * Tasks with reminders must have a future due date
 */
export const taskWithReminderSchema = taskSchema.refine(
  (data) => {
    if (!data.due_date) return true;
    const dueDate = new Date(data.due_date);
    return dueDate > new Date();
  },
  {
    message: "Tasks with reminders must have a future due date",
    path: ["due_date"],
  }
);

// ============================================================================
// Inferred types
// ============================================================================

export type CreateTaskInput = z.infer<typeof taskCreateSchema>;
export type UpdateTaskInput = z.infer<typeof taskUpdateSchema>;

// ============================================================================
// Validation helper functions (from legacy tasks.ts)
// ============================================================================

/**
 * Validate task creation data
 * @param data - Task data to validate
 * @returns Validated task data
 * @throws Zod validation error if data is invalid
 */
export function validateCreateTask(data: unknown): CreateTaskInput {
  return taskCreateSchema.parse(data);
}

/**
 * Validate task update data
 * @param data - Task data to validate
 * @returns Validated task data
 * @throws Zod validation error if data is invalid
 */
export function validateUpdateTask(data: unknown): UpdateTaskInput {
  return taskUpdateSchema.parse(data);
}

/**
 * Validate task with reminder
 * @param data - Task data to validate
 * @returns Validated task data
 * @throws Zod validation error if data is invalid
 */
export function validateTaskWithReminder(data: unknown): Task {
  return taskWithReminderSchema.parse(data);
}

/**
 * Transform date for database storage
 * Ensures date is in ISO format with time set to start of day in UTC
 * @param date - Date string to transform
 * @returns ISO formatted date string
 */
export function transformTaskDate(date: string): string {
  const taskDate = new Date(date);
  taskDate.setUTCHours(0, 0, 0, 0);
  return taskDate.toISOString();
}

/**
 * Validate and transform task for submission
 * @param data - Task data to validate and transform
 * @param isUpdate - Whether this is an update operation
 * @returns Transformed task data ready for database
 */
export function validateTaskForSubmission(
  data: unknown,
  isUpdate = false
): Task | UpdateTaskInput {
  // Use appropriate schema based on operation
  const validated = isUpdate
    ? taskUpdateSchema.parse(data)
    : taskSchema.parse(data);

  // Transform due date to ISO format
  if (validated.due_date) {
    validated.due_date = transformTaskDate(validated.due_date);
  }

  // Transform completed_at if present
  if (validated.completed_at) {
    validated.completed_at = transformTaskDate(validated.completed_at);
  }

  return validated;
}
