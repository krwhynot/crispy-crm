import { TabsContent } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

export interface TabPanelProps {
  value: string;
  children: React.ReactNode;
  className?: string;
}

export const TabPanel = ({
  value,
  children,
  className,
}: TabPanelProps) => {
  return (
    <TabsContent
      value={value}
      className={cn(
        "rounded-lg border border-[color:var(--border-subtle)] bg-[color:var(--bg-secondary)] p-6",
        className
      )}
    >
      {children}
    </TabsContent>
  );
};
