/**
 * Update Opportunity Step Component
 *
 * Step 2 of Quick Complete Task workflow.
 * Optionally updates opportunity stage after logging activity.
 *
 * Features:
 * - Shows current opportunity stage
 * - Provides stage selector dropdown
 * - Update and Skip buttons
 * - Optional - can be skipped entirely
 */

import { useState } from "react";
import { useGetOne } from "react-admin";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  OPPORTUNITY_STAGES,
  getOpportunityStageLabel,
  type OpportunityStageValue,
} from "../opportunities/stageConstants";
import { Loader2, ArrowRight } from "lucide-react";

interface UpdateOpportunityStepProps {
  opportunityId: number;
  onUpdate: (newStage: string | null) => void;
  onSkip: () => void;
  activityType?: string; // Optional: for smart stage suggestions
}

export function UpdateOpportunityStep({
  opportunityId,
  onUpdate,
  onSkip,
}: UpdateOpportunityStepProps) {
  const { data: opportunity, isLoading, error } = useGetOne("opportunities", { id: opportunityId });

  const [selectedStage, setSelectedStage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Handle submit (update or skip based on whether stage is selected)
  const handleSubmit = async () => {
    if (!selectedStage) {
      // No stage selected, skip to completion without updating
      onSkip();
      return;
    }

    setIsSubmitting(true);
    onUpdate(selectedStage);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        <span className="ml-2 text-sm text-muted-foreground">Loading opportunity...</span>
      </div>
    );
  }

  // Error state
  if (error || !opportunity) {
    return (
      <div className="space-y-section">
        <p className="text-sm text-destructive">Unable to load opportunity details.</p>
        <Button onClick={onSkip} className="w-full">
          Continue Anyway
        </Button>
      </div>
    );
  }

  const currentStage = opportunity.stage as OpportunityStageValue;
  const currentStageLabel = getOpportunityStageLabel(currentStage);

  // Filter out closed stages from selection (can't move back to them)
  const availableStages = OPPORTUNITY_STAGES.filter(
    (stage) => !["closed_won", "closed_lost"].includes(stage.value)
  );

  return (
    <div className="space-y-section">
      {/* Current Opportunity Info */}
      <div className="rounded-md bg-muted/50 p-content">
        <p className="text-sm font-medium text-foreground">{opportunity.name || "Opportunity"}</p>
        <p className="mt-compact text-xs text-muted-foreground">
          Current Stage: <span className="font-medium text-foreground">{currentStageLabel}</span>
        </p>
      </div>

      {/* Stage Selector */}
      <div className="space-y-compact">
        <Label htmlFor="new-stage">Move to Stage (optional)</Label>
        <Select
          value={selectedStage || undefined}
          onValueChange={(value) => setSelectedStage(value)}
        >
          <SelectTrigger id="new-stage">
            <SelectValue placeholder="Select new stage..." />
          </SelectTrigger>
          <SelectContent>
            {availableStages.map((stage) => (
              <SelectItem
                key={stage.value}
                value={stage.value}
                disabled={stage.value === currentStage}
              >
                <div className="flex items-center gap-2">
                  <span>{stage.label}</span>
                  {stage.value === currentStage && (
                    <span className="text-xs text-muted-foreground">(current)</span>
                  )}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {!selectedStage && (
          <p className="text-xs text-muted-foreground">Leave blank to keep current stage</p>
        )}
        {selectedStage && selectedStage !== currentStage && (
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            Will move from {currentStageLabel} <ArrowRight className="inline h-3 w-3" />{" "}
            {getOpportunityStageLabel(selectedStage)}
          </p>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 pt-2">
        <Button variant="outline" onClick={onSkip} disabled={isSubmitting} className="flex-1">
          Skip
        </Button>
        <Button onClick={handleSubmit} disabled={isSubmitting} className="flex-1">
          {isSubmitting ? "Updating..." : selectedStage ? "Update & Close" : "Keep Stage & Close"}
        </Button>
      </div>

      {/* Help Text */}
      <p className="text-center text-xs text-muted-foreground">
        This step is optional - you can skip if the stage hasn't changed
      </p>
    </div>
  );
}
