import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

interface SidepaneSectionProps {
  /** Section label text */
  label: string;
  children: React.ReactNode;
  /**
   * Variant determines wrapper style:
   * - "default": No wrapper, just label + content
   * - "list": Light card wrapper (bg-muted/30) for relationship lists
   */
  variant?: "default" | "list";
  /** Show separator above section */
  showSeparator?: boolean;
  className?: string;
}

export function SidepaneSection({
  label,
  children,
  variant = "default",
  showSeparator = false,
  className,
}: SidepaneSectionProps) {
  return (
    <>
      {showSeparator && <Separator className="my-4" />}
      <section className={cn("py-2", className)}>
        <h4 className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-3">
          {label}
        </h4>
        {variant === "list" ? (
          <Card className="bg-muted/30 border-0">
            <CardContent className="p-1">
              {children}
            </CardContent>
          </Card>
        ) : (
          children
        )}
      </section>
    </>
  );
}
