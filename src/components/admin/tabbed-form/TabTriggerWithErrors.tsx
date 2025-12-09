import { TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

export interface TabTriggerWithErrorsProps {
  value: string;
  label: string;
  errorCount: number;
  /** Optional data-tutorial attribute for tutorial highlighting */
  dataTutorial?: string;
}

export const TabTriggerWithErrors = ({
  value,
  label,
  errorCount,
  dataTutorial,
}: TabTriggerWithErrorsProps) => {
  const ariaLabel =
    errorCount > 0
      ? `${label} tab, ${errorCount} error${errorCount > 1 ? "s" : ""}`
      : `${label} tab`;

  return (
    <TabsTrigger
      value={value}
      aria-label={ariaLabel}
      data-tutorial={dataTutorial}
      className="flex-none h-11 px-2.5 py-0.5 text-sm font-normal rounded-t-md border-b-0 bg-transparent data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=inactive]:text-muted-foreground hover:text-foreground"
    >
      {label}
      {errorCount > 0 && (
        <Badge variant="destructive" className="ml-1 h-3.5 px-1 text-[10px] py-0">
          {errorCount}
        </Badge>
      )}
    </TabsTrigger>
  );
};
