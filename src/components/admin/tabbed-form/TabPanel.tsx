import { TabsContent } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

export interface TabPanelProps {
  value: string;
  children: React.ReactNode;
  className?: string;
}

export const TabPanel = ({ value, children, className }: TabPanelProps) => {
  return (
    <TabsContent
      value={value}
      className={cn(
        "rounded-b-lg rounded-tr-lg border border-[color:var(--border-subtle)] bg-background p-3",
        className
      )}
    >
      {children}
    </TabsContent>
  );
};
