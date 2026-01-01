import type { LucideIcon } from "lucide-react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SidepaneEmptyStateProps {
  /** Icon to display above message */
  icon?: LucideIcon;
  /** Empty state message */
  message: string;
  /** Optional action button */
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function SidepaneEmptyState({ icon: Icon, message, action }: SidepaneEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      {Icon && <Icon className="h-10 w-10 text-muted-foreground/50 mb-2" />}
      <p className="text-sm text-muted-foreground">{message}</p>
      {action && (
        <Button variant="outline" size="sm" className="mt-3 h-11" onClick={action.onClick}>
          <Plus className="h-4 w-4 mr-1" />
          {action.label}
        </Button>
      )}
    </div>
  );
}
