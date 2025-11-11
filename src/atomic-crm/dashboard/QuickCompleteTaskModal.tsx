/**
 * Quick Complete Task Modal
 *
 * Progressive disclosure modal for completing tasks with follow-up actions.
 * Guides users through: Complete Task → Log Activity → Update Opportunity
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
import { useDataProvider, useNotify } from "react-admin";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Task } from "../types";
import { LogActivityStep, type ActivityData } from "./LogActivityStep";
import { UpdateOpportunityStep } from "./UpdateOpportunityStep";
import { SuccessStep } from "./SuccessStep";

// Flow steps enum
enum FlowStep {
  LOG_ACTIVITY = "log_activity",
  UPDATE_OPPORTUNITY = "update_opportunity",
  COMPLETE = "complete",
}

interface QuickCompleteTaskModalProps {
  task: Task;
  onClose: () => void;
  onComplete: () => void;
}

export function QuickCompleteTaskModal({ task, onClose, onComplete }: QuickCompleteTaskModalProps) {
  const [step, setStep] = useState<FlowStep>(FlowStep.LOG_ACTIVITY);
  const [activityData, setActivityData] = useState<ActivityData | null>(null);
  const [_isSubmitting, _setIsSubmitting] = useState(false);

  const dataProvider = useDataProvider();
  const notify = useNotify();

  /**
   * Handle activity saved (Step 1 → Step 2)
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
   * Handle opportunity updated (Step 2 → Step 3)
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
  const handleComplete = async (activity: ActivityData, opportunityStage: string | null) => {
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

      // Signal parent to refresh and handle cleanup
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
   * Handle skip for opportunity update step (optional)
   * Completes workflow without updating opportunity stage
   */
  const handleSkipOpportunityUpdate = () => {
    if (activityData) {
      handleComplete(activityData, null);
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
          <DialogDescription>
            {step === FlowStep.LOG_ACTIVITY && "Log the activity to complete this task"}
            {step === FlowStep.UPDATE_OPPORTUNITY && "Optionally update the opportunity stage"}
            {step === FlowStep.COMPLETE && "Your task has been completed successfully"}
          </DialogDescription>
        </DialogHeader>

        {/* Step 1: Log Activity */}
        {step === FlowStep.LOG_ACTIVITY && (
          <LogActivityStep task={task} onSave={handleActivitySaved} onCancel={onClose} />
        )}

        {/* Step 2: Update Opportunity */}
        {step === FlowStep.UPDATE_OPPORTUNITY && task.opportunity_id && (
          <UpdateOpportunityStep
            opportunityId={task.opportunity_id as number}
            onUpdate={handleOpportunityUpdated}
            onSkip={handleSkipOpportunityUpdate}
          />
        )}

        {/* Step 3: Success */}
        {step === FlowStep.COMPLETE && <SuccessStep />}
      </DialogContent>
    </Dialog>
  );
}
