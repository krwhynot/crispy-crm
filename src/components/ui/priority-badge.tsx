import { Badge } from "@/components/ui/badge";

/**
 * PriorityBadge Component
 *
 * Displays a task priority level with consistent semantic color mapping.
 * Extracted to single location per DRY principle - used in:
 * - TaskList (table column)
 * - TaskSlideOverDetailsTab (slide-over view)
 * - TaskShow (card view)
 *
 * Variant mapping standardized:
 * - low: outline (subtle)
 * - medium: secondary (neutral)
 * - high: default (attention)
 * - critical: destructive (urgent)
 */

const priorityVariants = {
  low: "outline",
  medium: "secondary",
  high: "default",
  critical: "destructive",
} as const;

type PriorityLevel = keyof typeof priorityVariants;

interface PriorityBadgeProps {
  priority: string;
  className?: string;
}

export function PriorityBadge({ priority, className }: PriorityBadgeProps) {
  const variant = priorityVariants[priority as PriorityLevel] || "outline";
  const label = priority.charAt(0).toUpperCase() + priority.slice(1);

  return (
    <Badge variant={variant} className={className}>
      {label}
    </Badge>
  );
}

/**
 * Priority choices for SelectInput components.
 * Centralized to prevent duplication across form components.
 */
export const priorityChoices = [
  { id: "low", name: "Low" },
  { id: "medium", name: "Medium" },
  { id: "high", name: "High" },
  { id: "critical", name: "Critical" },
] as const;
