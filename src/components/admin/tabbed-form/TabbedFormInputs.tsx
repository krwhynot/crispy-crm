import { useMemo } from "react";
import { useFormState } from "react-hook-form";
import { Tabs, TabsList } from "@/components/ui/tabs";
import { TabTriggerWithErrors } from "./TabTriggerWithErrors";
import { TabPanel } from "./TabPanel";
import { FormErrorSummary } from "../FormErrorSummary";

export interface TabDefinition {
  key: string;
  label: string;
  fields: string[];
  content: React.ReactNode;
  /** Optional data-tutorial attribute for tutorial highlighting */
  dataTutorial?: string;
}

export interface TabbedFormInputsProps {
  tabs: TabDefinition[];
  defaultTab?: string;
  className?: string;
  /**
   * Optional field label map for user-friendly error messages
   * Maps field names to display labels
   * @example { first_name: "First Name", organization_id: "Organization" }
   */
  fieldLabels?: Record<string, string>;
  /**
   * Whether to show the error summary banner
   * @default true
   */
  showErrorSummary?: boolean;
}

export const TabbedFormInputs = ({
  tabs,
  defaultTab,
  className,
  fieldLabels = {},
  showErrorSummary = true,
}: TabbedFormInputsProps) => {
  const { errors } = useFormState();
  const errorKeys = Object.keys(errors || {});

  // Memoize error count calculations to avoid unnecessary re-renders
  const errorCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const tab of tabs) {
      counts[tab.key] = errorKeys.filter((key) => tab.fields.includes(key)).length;
    }
    return counts;
  }, [errorKeys, tabs]);

  const hasErrors = errorKeys.length > 0;

  return (
    <div className="flex flex-col gap-4">
      {/* Error summary banner - shows when form has validation errors */}
      {showErrorSummary && hasErrors && (
        <FormErrorSummary
          errors={errors}
          fieldLabels={fieldLabels}
          defaultExpanded={errorKeys.length <= 3}
        />
      )}

      <Tabs defaultValue={defaultTab || tabs[0]?.key} className={className}>
        <TabsList className="h-auto min-h-0 inline-flex justify-start rounded-t-lg bg-muted p-[1px] gap-[1px] border-b-0">
          {tabs.map((tab) => (
            <TabTriggerWithErrors
              key={tab.key}
              value={tab.key}
              label={tab.label}
              errorCount={errorCounts[tab.key] || 0}
              dataTutorial={tab.dataTutorial}
            />
          ))}
        </TabsList>

        {tabs.map((tab) => (
          <TabPanel key={tab.key} value={tab.key}>
            {tab.content}
          </TabPanel>
        ))}
      </Tabs>
    </div>
  );
};
