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
      forceMount
      value={value}
      className={cn(
        "rounded-b-lg rounded-tr-lg border border-border bg-background p-3",
        "data-[state=inactive]:hidden",
        className
      )}
    >
      {children}
    </TabsContent>
  );
};
