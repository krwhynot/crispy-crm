/**
 * Quick Complete Task Modal
 *
 * Progressive disclosure modal for completing tasks with follow-up actions.
 * Guides users through: Complete Task ’ Log Activity ’ Update Opportunity
 *
 * Feature: Dashboard Quick Actions
 * Design: docs/plans/2025-11-10-dashboard-quick-actions-design.md
 *
 * Flow:
 * 1. Log Activity (required) - Capture what happened
 * 2. Update Opportunity (optional) - Adjust stage if needed
 * 3. Success (auto-close) - Confirm completion
 *
 * Uses atomic database function `complete_task_with_followup` for transactional integrity.
 */

import { useState } from "react";
import { useDataProvider, useNotify, useRefresh } from "react-admin";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Task } from "../types";

// Flow steps enum
enum FlowStep {
  LOG_ACTIVITY = "log_activity",
  UPDATE_OPPORTUNITY = "update_opportunity",
  COMPLETE = "complete",
}

// Activity data shape for the RPC call
interface ActivityData {
  type: string; // interaction_type enum value
  description: string;
  subject?: string;
  activity_date?: string;
}

interface QuickCompleteTaskModalProps {
  task: Task;
  onClose: () => void;
  onComplete: () => void;
}

export function QuickCompleteTaskModal({
  task,
  onClose,
  onComplete,
}: QuickCompleteTaskModalProps) {
  const [step, setStep] = useState<FlowStep>(FlowStep.LOG_ACTIVITY);
  const [activityData, setActivityData] = useState<ActivityData | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const dataProvider = useDataProvider();
  const notify = useNotify();
  const refresh = useRefresh();

  /**
   * Handle activity saved (Step 1 ’ Step 2)
   * Stores activity data and advances to opportunity update step
   */
  const handleActivitySaved = (data: ActivityData) => {
    setActivityData(data);

    // If task has no opportunity, skip to completion
    if (!task.opportunity_id) {
      handleComplete(data, null);
      return;
    }

    // Otherwise, advance to opportunity update step
    setStep(FlowStep.UPDATE_OPPORTUNITY);
  };

  /**
   * Handle opportunity updated (Step 2 ’ Step 3)
   * Calls RPC function to complete task atomically
   */
  const handleOpportunityUpdated = async (newStage: string | null) => {
    if (!activityData) return;
    await handleComplete(activityData, newStage);
  };

  /**
   * Complete the entire workflow
   * Calls atomic database function to ensure all operations succeed together
   */
  const handleComplete = async (
    activity: ActivityData,
    opportunityStage: string | null,
  ) => {
    setIsSubmitting(true);

    try {
      // Call atomic RPC function
      await dataProvider.rpc("complete_task_with_followup", {
        p_task_id: task.id,
        p_activity_data: {
          type: activity.type,
          description: activity.description,
          subject: activity.subject,
          activity_date: activity.activity_date,
        },
        p_opportunity_stage: opportunityStage,
      });

      // Show success step briefly
      setStep(FlowStep.COMPLETE);

      // Notify user
      notify("Task completed successfully!", { type: "success" });

      // Refresh parent data
      refresh();
      onComplete();

      // Auto-close after 1 second
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (error) {
      console.error("Failed to complete task:", error);
      notify("Failed to complete task. Please try again.", {
        type: "error",
      });
      setIsSubmitting(false);
    }
  };

  /**
   * Handle skip in any step
   * Advances to next step or completes without optional data
   */
  const handleSkip = () => {
    if (step === FlowStep.LOG_ACTIVITY) {
      // Can't skip activity logging - it's required
      // User must provide at least minimal notes
      return;
    }

    if (step === FlowStep.UPDATE_OPPORTUNITY) {
      // Skip opportunity update, complete with activity only
      if (activityData) {
        handleComplete(activityData, null);
      }
    }
  };

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {step === FlowStep.LOG_ACTIVITY && `Complete Task: ${task.title}`}
            {step === FlowStep.UPDATE_OPPORTUNITY && "Update Opportunity"}
            {step === FlowStep.COMPLETE && "Task Completed!"}
          </DialogTitle>
        </DialogHeader>

        {/* Step 1: Log Activity */}
        {step === FlowStep.LOG_ACTIVITY && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              How did it go? Log what happened for this task.
            </p>
            {/* LogActivityStep component will be created in next batch */}
            <div className="p-4 border border-dashed rounded">
              <p className="text-center text-muted-foreground">
                LogActivityStep component (to be implemented)
              </p>
              <button
                onClick={() =>
                  handleActivitySaved({
                    type: "follow_up",
                    description: "Placeholder activity",
                  })
                }
                className="mt-4 w-full px-4 py-2 bg-primary text-primary-foreground rounded"
              >
                Continue (Temp)
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Update Opportunity */}
        {step === FlowStep.UPDATE_OPPORTUNITY && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Want to update the opportunity stage?
            </p>
            {/* UpdateOpportunityStep component will be created in next batch */}
            <div className="p-4 border border-dashed rounded">
              <p className="text-center text-muted-foreground">
                UpdateOpportunityStep component (to be implemented)
              </p>
              <div className="flex gap-2 mt-4">
                <button
                  onClick={handleSkip}
                  className="flex-1 px-4 py-2 border rounded"
                  disabled={isSubmitting}
                >
                  Skip
                </button>
                <button
                  onClick={() => handleOpportunityUpdated("initial_outreach")}
                  className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded"
                  disabled={isSubmitting}
                >
                  Update (Temp)
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Success */}
        {step === FlowStep.COMPLETE && (
          <div className="py-8 text-center">
            <div className="text-4xl mb-4"></div>
            <p className="text-lg font-medium">Task completed and logged!</p>
            <p className="text-sm text-muted-foreground mt-2">Closing...</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
