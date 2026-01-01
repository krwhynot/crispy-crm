import { Button } from "@/components/ui/button";
import { StageBadgeWithHealth } from "./StageBadgeWithHealth";

interface SuggestedOpportunityCardProps {
  opportunity: {
    id: number;
    name: string;
    stage: string;
    health_status?: "active" | "cooling" | "at_risk";
    amount?: number;
  };
  onLink: () => void;
}

export function SuggestedOpportunityCard({ opportunity, onLink }: SuggestedOpportunityCardProps) {
  return (
    <div className="border rounded-lg p-4 flex items-center justify-between hover:bg-muted/50 transition-colors">
      <div className="flex-1">
        <div className="font-medium">{opportunity.name}</div>
        <div className="flex items-center gap-2 mt-1">
          <StageBadgeWithHealth stage={opportunity.stage} health={opportunity.health_status} />
          {opportunity.amount && (
            <span className="text-sm text-muted-foreground">
              {new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: "USD",
              }).format(opportunity.amount)}
            </span>
          )}
        </div>
      </div>
      <Button onClick={onLink} size="sm">
        Link
      </Button>
    </div>
  );
}
