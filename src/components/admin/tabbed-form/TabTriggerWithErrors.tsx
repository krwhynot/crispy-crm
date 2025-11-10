import { TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

interface TabTriggerWithErrorsProps {
  value: string;
  label: string;
  errorCount: number;
}

export const TabTriggerWithErrors = ({
  value,
  label,
  errorCount,
}: TabTriggerWithErrorsProps) => {
  const ariaLabel = errorCount > 0
    ? `${label} tab, ${errorCount} error${errorCount > 1 ? 's' : ''}`
    : `${label} tab`;

  return (
    <TabsTrigger
      value={value}
      aria-label={ariaLabel}
      className="relative"
    >
      {label}
      {errorCount > 0 && (
        <Badge variant="destructive" className="ml-2">
          {errorCount}
        </Badge>
      )}
    </TabsTrigger>
  );
};
