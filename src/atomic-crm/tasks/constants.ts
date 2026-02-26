/**
 * Task constants derived from validation schemas
 * Single source of truth: Zod enum → UI choices (DOM-006)
 */

import { priorityLevelSchema } from "../validation/task";
import { formatFieldLabel } from "../utils/formatters";

export const TASK_PRIORITY_CHOICES = priorityLevelSchema.options.map((p) => ({
  id: p,
  name: formatFieldLabel(p),
}));
