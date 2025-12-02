import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ExternalLink, TrendingUp, Calendar, DollarSign } from "lucide-react";
import {
  usePrincipalOpportunities,
  type OpportunitySummary,
} from "../hooks/usePrincipalOpportunities";

interface PipelineDrillDownSheetProps {
  /** Principal (organization) ID to show opportunities for */
  principalId: number | null;
  /** Principal name for display */
  principalName: string;
  /** Whether the sheet is open */
  isOpen: boolean;
  /** Close handler */
  onClose: () => void;
}

/**
 * Slide-over sheet showing opportunities for a selected principal.
 *
 * Features:
 * - Fetches opportunities filtered by organization_id
 * - Shows stage, amount, probability, and dates
 * - Links to full opportunity detail page
 * - Built-in accessibility via Radix Dialog (focus trap, ESC to close)
 */
export function PipelineDrillDownSheet({
  principalId,
  principalName,
  isOpen,
  onClose,
}: PipelineDrillDownSheetProps) {
  const navigate = useNavigate();
  const { opportunities, loading, error } = usePrincipalOpportunities({
    principalId,
    enabled: isOpen && !!principalId,
  });

  const handleViewOpportunity = (opportunityId: number) => {
    // Navigate to opportunity list with view parameter to open slide-over
    navigate(`/opportunities?view=${opportunityId}`);
    onClose();
  };

  const getStageColor = (stage: string): "default" | "secondary" | "destructive" | "outline" => {
    const stageLower = stage.toLowerCase();
    // Check for "lost" first since "Closed Lost" contains both "closed" and "lost"
    if (stageLower.includes("lost")) return "destructive";
    if (stageLower.includes("won") || stageLower.includes("closed")) return "default";
    if (stageLower.includes("negotiat") || stageLower.includes("proposal")) return "secondary";
    return "outline";
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const totalPipeline = opportunities.reduce((sum, opp) => sum + opp.amount, 0);
  const weightedPipeline = opportunities.reduce(
    (sum, opp) => sum + opp.amount * (opp.probability / 100),
    0
  );

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side="right"
        className="w-[480px] max-w-[90vw] p-0 flex flex-col"
        // Note: role="dialog" and aria-modal="true" are set automatically by Radix
        // aria-labelledby is auto-wired to SheetTitle's id by Radix
      >
        {/* Header */}
        <SheetHeader className="border-b border-border px-6 py-4">
          <SheetTitle id="drill-down-title" className="text-lg font-semibold">
            {principalName}
          </SheetTitle>
          <SheetDescription>
            {loading
              ? "Loading opportunities..."
              : `${opportunities.length} ${opportunities.length === 1 ? "opportunity" : "opportunities"}`}
          </SheetDescription>
        </SheetHeader>

        {/* Summary Stats */}
        {!loading && opportunities.length > 0 && (
          <div className="border-b border-border px-6 py-3 bg-muted/30">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Total Pipeline:</span>
                <span className="font-semibold">{formatCurrency(totalPipeline)}</span>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Weighted:</span>
                <span className="font-semibold">{formatCurrency(weightedPipeline)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Content */}
        <ScrollArea className="flex-1">
          <div className="p-4 space-y-3">
            {loading ? (
              // Loading skeleton
              <>
                {[1, 2, 3].map((i) => (
                  <div key={i} className="p-4 border rounded-lg space-y-2">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-4 w-1/4" />
                  </div>
                ))}
              </>
            ) : error ? (
              // Error state
              <div className="text-center py-8">
                <p className="text-destructive">Failed to load opportunities</p>
                <p className="text-sm text-muted-foreground mt-1">{error.message}</p>
              </div>
            ) : opportunities.length === 0 ? (
              // Empty state
              <div className="text-center py-8">
                <p className="text-muted-foreground">No opportunities found for this principal</p>
              </div>
            ) : (
              // Opportunity list
              opportunities.map((opp) => (
                <OpportunityCard
                  key={opp.id}
                  opportunity={opp}
                  onView={() => handleViewOpportunity(opp.id)}
                  getStageColor={getStageColor}
                  formatCurrency={formatCurrency}
                />
              ))
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}

/**
 * Individual opportunity card within the drill-down list
 */
function OpportunityCard({
  opportunity,
  onView,
  getStageColor,
  formatCurrency,
}: {
  opportunity: OpportunitySummary;
  onView: () => void;
  getStageColor: (stage: string) => "default" | "secondary" | "destructive" | "outline";
  formatCurrency: (amount: number) => string;
}) {
  return (
    <div
      className="p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer group"
      onClick={onView}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onView();
        }
      }}
      role="button"
      tabIndex={0}
      aria-label={`View ${opportunity.name}`}
    >
      {/* Header: Name + Stage */}
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-medium text-foreground line-clamp-1">{opportunity.name}</h3>
        <Badge variant={getStageColor(opportunity.stage)} className="shrink-0">
          {opportunity.stage}
        </Badge>
      </div>

      {/* Amount and Probability */}
      <div className="mt-2 flex items-center gap-4 text-sm">
        <span className="font-semibold text-foreground">{formatCurrency(opportunity.amount)}</span>
        <span className="text-muted-foreground">{opportunity.probability}% probability</span>
      </div>

      {/* Dates */}
      <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
        {opportunity.expectedCloseDate && (
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            <span>Close: {format(opportunity.expectedCloseDate, "MMM d, yyyy")}</span>
          </div>
        )}
        {opportunity.lastActivityDate && (
          <div className="flex items-center gap-1">
            <span>Last activity: {format(opportunity.lastActivityDate, "MMM d")}</span>
          </div>
        )}
      </div>

      {/* View link (visible on hover and keyboard focus) */}
      <div className="mt-3 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity">
        <Button
          variant="link"
          size="sm"
          className="h-auto p-0 text-primary focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          aria-label="View opportunity details"
        >
          <ExternalLink className="h-3 w-3 mr-1" aria-hidden="true" />
          View Details
        </Button>
      </div>
    </div>
  );
}
