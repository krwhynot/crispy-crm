import { cn } from "@/lib/utils.ts";
import { useConfigurationContext } from "../../root/ConfigurationContext";

/**
 * Maps status value to semantic CSS class for background color
 */
function getStatusBackgroundClass(status: string): string {
  const statusMap: Record<string, string> = {
    cold: "bg-info-default",
    warm: "bg-warning-default",
    hot: "bg-error-default",
    "in-contract": "bg-success-default",
  };
  return statusMap[status] || "bg-muted";
}

export const Status = ({ status, className }: { status: string; className?: string }) => {
  const { noteStatuses } = useConfigurationContext();
  if (!status || !noteStatuses) return null;
  const statusObject = noteStatuses.find((s: { value: string; label: string }) => s.value === status);

  if (!statusObject) return null;
  return (
    <div className={cn("group relative inline-block mr-2", className)}>
      <span
        className={cn("inline-block w-2.5 h-2.5 rounded-full", getStatusBackgroundClass(status))}
      />
      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs bg-popover text-popover-foreground border border-border rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10 shadow-sm">
        {statusObject.label}
      </div>
    </div>
  );
};
