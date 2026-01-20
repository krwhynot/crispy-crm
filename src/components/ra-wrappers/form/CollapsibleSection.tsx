import { useState, useId } from "react";
import { ChevronDown } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

interface CollapsibleSectionProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  className?: string;
}

export const CollapsibleSection = ({
  title,
  children,
  defaultOpen = false,
  className,
}: CollapsibleSectionProps) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const contentId = useId();

  return (
    <Collapsible
      open={isOpen}
      onOpenChange={setIsOpen}
      className={cn("border border-border rounded-md", className)}
    >
      <CollapsibleTrigger
        aria-controls={contentId}
        className={cn(
          "flex w-full items-center justify-between px-3",
          "text-sm font-medium text-foreground/70",
          "hover:bg-muted/50 transition-colors",
          "h-11", // 44px touch target - Fitts's Law
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        )}
      >
        <span>{title}</span>
        <ChevronDown
          data-testid="collapsible-chevron"
          className={cn("h-4 w-4 transition-transform duration-200", isOpen && "rotate-180")}
        />
      </CollapsibleTrigger>
      <CollapsibleContent id={contentId} className="px-3 pb-3">
        <div className="pt-2">{children}</div>
      </CollapsibleContent>
    </Collapsible>
  );
};
