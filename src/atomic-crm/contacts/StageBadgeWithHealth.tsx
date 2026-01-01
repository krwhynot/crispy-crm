import { memo } from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface StageBadgeWithHealthProps {
  stage: string;
  health?: "active" | "cooling" | "at_risk";
}

export const StageBadgeWithHealth = memo(function StageBadgeWithHealth({
  stage,
  health,
}: StageBadgeWithHealthProps) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "border-2",
        health === "active" && "border-success",
        health === "cooling" && "border-warning",
        health === "at_risk" && "border-destructive"
      )}
    >
      {stage}
    </Badge>
  );
});

StageBadgeWithHealth.displayName = "StageBadgeWithHealth";
