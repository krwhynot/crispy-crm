import { useMemo } from "react";
import { useFormState } from "react-hook-form";
import { Tabs, TabsList } from "@/components/ui/tabs";
import { TabTriggerWithErrors } from "./TabTriggerWithErrors";
import { TabPanel } from "./TabPanel";

export interface TabDefinition {
  key: string;
  label: string;
  fields: string[];
  content: React.ReactNode;
}

export interface TabbedFormInputsProps {
  tabs: TabDefinition[];
  defaultTab?: string;
  className?: string;
}

export const TabbedFormInputs = ({
  tabs,
  defaultTab,
  className,
}: TabbedFormInputsProps) => {
  const { errors } = useFormState();
  const errorKeys = Object.keys(errors || {});

  // Memoize error count calculations to avoid unnecessary re-renders
  const errorCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const tab of tabs) {
      counts[tab.key] = errorKeys.filter((key) =>
        tab.fields.includes(key)
      ).length;
    }
    return counts;
  }, [errorKeys, tabs]);

  return (
    <Tabs
      defaultValue={defaultTab || tabs[0]?.key}
      className={className}
    >
      <TabsList className="h-auto min-h-0 inline-flex justify-start rounded-t-lg bg-muted p-[1px] gap-[1px] border-b-0">
        {tabs.map((tab) => (
          <TabTriggerWithErrors
            key={tab.key}
            value={tab.key}
            label={tab.label}
            errorCount={errorCounts[tab.key] || 0}
          />
        ))}
      </TabsList>

      {tabs.map((tab) => (
        <TabPanel key={tab.key} value={tab.key}>
          {tab.content}
        </TabPanel>
      ))}
    </Tabs>
  );
};
