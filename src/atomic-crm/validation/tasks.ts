/**
 * Task validation schemas and functions
 *
 * Implements Zod validation for tasks following Core Principle #3:
 * Single point validation at API boundaries
 */

import { z } from "zod";

/**
 * Task type enum matching PostgreSQL task_type enum
 */
export const taskTypeEnum = z.enum([
  "Call", // Phone conversations
  "Email", // Email communications
  "Meeting", // In-person/virtual meetings & demos
  "Follow-up", // Re-engagement reminders
  "Proposal", // Quotes and proposals
  "Discovery", // Needs analysis & qualification
  "Administrative", // Internal tasks
  "None", // Default/unspecified
]);

/**
 * Base task schema with all required fields
 */
export const taskSchema = z.object({
  // Required fields
  title: z.string().min(1, "Task title is required"),
  contact_id: z.union([
    z.string().min(1, "Contact is required"),
    z.number().min(1, "Contact is required"),
  ]),
  type: taskTypeEnum,
  due_date: z.string().min(1, "Due date is required"),
  sales_id: z.union([z.string().min(1), z.number().min(1)]),

  // Optional fields
  description: z.string().nullable().optional(),
  completed: z.boolean().optional(),
  completed_at: z.string().nullable().optional(),
  priority: z.enum(["low", "medium", "high"]).default("medium").optional(),
  opportunity_id: z.union([z.string(), z.number()]).nullable().optional(),
  reminder_date: z.string().nullable().optional(),

  // ID only present on updates
  id: z.union([z.string(), z.number()]).optional(),
});

/**
 * Schema for creating a new task
 */
export const createTaskSchema = taskSchema.omit({ id: true });

/**
 * Schema for updating an existing task
 */
export const updateTaskSchema = taskSchema.partial().required({ id: true });

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

/**
 * Inferred types from schemas
 */
export type Task = z.infer<typeof taskSchema>;
export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type TaskType = z.infer<typeof taskTypeEnum>;

/**
 * Validate task creation data
 * @param data - Task data to validate
 * @returns Validated task data
 * @throws Zod validation error if data is invalid
 */
export function validateCreateTask(data: unknown): CreateTaskInput {
  return createTaskSchema.parse(data);
}

/**
 * Validate task update data
 * @param data - Task data to validate
 * @returns Validated task data
 * @throws Zod validation error if data is invalid
 */
export function validateUpdateTask(data: unknown): UpdateTaskInput {
  return updateTaskSchema.parse(data);
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
export function validateTaskForSubmission(data: unknown, isUpdate = false): Task | UpdateTaskInput {
  // Use appropriate schema based on operation
  const validated = isUpdate ? updateTaskSchema.parse(data) : taskSchema.parse(data);

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
