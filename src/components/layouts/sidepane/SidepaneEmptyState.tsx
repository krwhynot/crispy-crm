import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SidepaneEmptyStateProps {
  /** Icon to display above message (optional for text-only mode) */
  icon?: LucideIcon;
  /** Main title (for title+description pattern) */
  title?: string;
  /** Description text (for title+description pattern) */
  description?: string;
  /** Simple message (for backward compatibility) */
  message?: string;
  /** Optional action button */
  action?: {
    label: string;
    onClick: () => void;
  };
}

/**
 * Empty state component for slide-over tabs.
 *
 * Supports two patterns:
 * 1. Simple: `message` prop only (backward compatible)
 * 2. Title+Description: `title` and `description` props (text-only, no icons)
 */
export function SidepaneEmptyState({
  icon: Icon,
  title,
  description,
  message,
  action,
}: SidepaneEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      {Icon && <Icon className="h-10 w-10 text-muted-foreground/50 mb-2" />}
      {title && <h3 className="text-sm font-medium text-foreground">{title}</h3>}
      {description && (
        <p className="mt-1 text-sm text-muted-foreground max-w-[280px]">{description}</p>
      )}
      {message && <p className="text-sm text-muted-foreground">{message}</p>}
      {action && (
        <Button variant="outline" size="sm" className="mt-4 min-h-[44px]" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  );
}
