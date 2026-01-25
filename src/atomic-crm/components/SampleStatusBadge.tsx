/**
 * SampleStatusBadge Component
 *
 * Displays the current status of a sample activity with visual workflow progression.
 * Supports inline status updates via PATCH when in interactive mode.
 *
 * Workflow: Sent → Received → Feedback Pending → Feedback Received
 *
 * Badge Variant Mapping (P8 Design Constraint):
 * - sent: muted (secondary) - Initial state, sample dispatched
 * - received: success - Confirmed receipt by customer
 * - feedback_pending: warning - Awaiting customer feedback
 * - feedback_received: primary - Workflow complete with feedback
 *
 * @see PRD §4.4 for sample tracking requirements
 */

/* eslint-disable react-refresh/only-export-components */
// This file intentionally exports both a component and related utilities (workflow constants,
// status config, helper functions) as a cohesive module. Separating them would reduce cohesion.

import { useState, useCallback, memo } from "react";
import { useUpdate, useNotify } from "react-admin";
import { useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { AdminButton } from "@/components/admin/AdminButton";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { logger } from "@/lib/logger";
import { activityKeys } from "@/atomic-crm/queryKeys";
import {
  Check,
  ChevronRight,
  Package,
  PackageCheck,
  Clock,
  MessageSquareText,
  Loader2,
} from "lucide-react";
import type { SampleStatus } from "@/atomic-crm/validation/activities";

// Re-export type for consumers
export type { SampleStatus };

/**
 * Sample status workflow definition
 * Linear progression: sent → received → feedback_pending → feedback_received
 */
export const SAMPLE_STATUS_WORKFLOW: readonly SampleStatus[] = [
  "sent",
  "received",
  "feedback_pending",
  "feedback_received",
] as const;

/**
 * Display configuration for each status
 */
interface StatusConfig {
  label: string;
  shortLabel: string;
  icon: typeof Package;
  variant: "secondary" | "default" | "destructive" | "outline";
  className: string;
  description: string;
}

/**
 * Status configuration mapping
 * P8 Design: sent=muted, received=success, pending=warning, feedback=primary
 */
export const SAMPLE_STATUS_CONFIG: Record<SampleStatus, StatusConfig> = {
  sent: {
    label: "Sent",
    shortLabel: "Sent",
    icon: Package,
    variant: "secondary",
    className: "bg-muted text-muted-foreground border-muted-foreground/20",
    description: "Sample has been dispatched to customer",
  },
  received: {
    label: "Received",
    shortLabel: "Recv",
    icon: PackageCheck,
    variant: "default",
    className: "bg-success text-success-foreground border-success/20",
    description: "Customer confirmed receipt of sample",
  },
  feedback_pending: {
    label: "Feedback Pending",
    shortLabel: "Pending",
    icon: Clock,
    variant: "outline",
    className: "bg-warning text-warning-foreground border-warning/20",
    description: "Awaiting customer feedback on sample",
  },
  feedback_received: {
    label: "Feedback Received",
    shortLabel: "Complete",
    icon: MessageSquareText,
    variant: "default",
    className: "bg-primary text-primary-foreground border-primary/20",
    description: "Feedback collected, workflow complete",
  },
};

/**
 * Get the next status in the workflow progression
 * Returns undefined if already at final status
 */
export function getNextStatus(currentStatus: SampleStatus): SampleStatus | undefined {
  const currentIndex = SAMPLE_STATUS_WORKFLOW.indexOf(currentStatus);
  if (currentIndex === -1 || currentIndex >= SAMPLE_STATUS_WORKFLOW.length - 1) {
    return undefined;
  }
  return SAMPLE_STATUS_WORKFLOW[currentIndex + 1];
}

/**
 * Get the previous status in the workflow
 * Returns undefined if already at first status
 */
export function getPreviousStatus(currentStatus: SampleStatus): SampleStatus | undefined {
  const currentIndex = SAMPLE_STATUS_WORKFLOW.indexOf(currentStatus);
  if (currentIndex <= 0) {
    return undefined;
  }
  return SAMPLE_STATUS_WORKFLOW[currentIndex - 1];
}

/**
 * Check if a status transition is valid (only forward progression)
 */
export function isValidTransition(from: SampleStatus, to: SampleStatus): boolean {
  const fromIndex = SAMPLE_STATUS_WORKFLOW.indexOf(from);
  const toIndex = SAMPLE_STATUS_WORKFLOW.indexOf(to);
  // Allow forward progression only (or same status)
  return toIndex > fromIndex;
}

// ============================================
// Component Props
// ============================================

interface SampleStatusBadgeProps {
  /** Current sample status */
  status: SampleStatus;
  /** Activity record ID for PATCH updates */
  activityId?: number | string;
  /** Enable interactive mode with status progression controls */
  interactive?: boolean;
  /** Show workflow stepper visualization */
  showStepper?: boolean;
  /** Compact mode - smaller badge without icon */
  compact?: boolean;
  /** Callback after successful status update */
  onStatusChange?: (newStatus: SampleStatus) => void;
  /** Additional className for the badge */
  className?: string;
}

/**
 * SampleStatusBadge - Visual sample workflow status with optional progression controls
 *
 * Features:
 * - Color-coded badges per P8 design constraints
 * - Optional workflow stepper showing all stages
 * - Interactive mode with "Advance to Next Status" button
 * - PATCH updates via React Admin data provider
 *
 * @example
 * // Read-only badge
 * <SampleStatusBadge status="received" />
 *
 * @example
 * // Interactive with stepper
 * <SampleStatusBadge
 *   status="received"
 *   activityId={123}
 *   interactive
 *   showStepper
 *   onStatusChange={(s) => console.log('Updated to:', s)}
 * />
 */
export const SampleStatusBadge = memo(function SampleStatusBadge({
  status,
  activityId,
  interactive = false,
  showStepper = false,
  compact = false,
  onStatusChange,
  className,
}: SampleStatusBadgeProps) {
  const config = SAMPLE_STATUS_CONFIG[status];
  const nextStatus = getNextStatus(status);
  const Icon = config.icon;

  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  // React Admin update hook for PATCH operations
  const [update, { isPending: isUpdating }] = useUpdate();
  const notify = useNotify();
  const queryClient = useQueryClient();

  /**
   * Handle status progression to next workflow state
   * Uses React Admin data provider for PATCH update
   */
  const handleAdvanceStatus = useCallback(async () => {
    if (!activityId || !nextStatus) return;

    try {
      await update(
        "activities",
        {
          id: activityId,
          data: { sample_status: nextStatus },
          previousData: { sample_status: status },
        },
        {
          onSuccess: () => {
            // Invalidate activity cache to refresh timeline
            // Use granular detail key for specific activity
            queryClient.invalidateQueries({
              queryKey: activityKeys.detail(activityId),
            });
            notify(`Sample status updated to ${SAMPLE_STATUS_CONFIG[nextStatus].label}`, {
              type: "success",
            });
            onStatusChange?.(nextStatus);
            setIsPopoverOpen(false);
          },
          onError: (error) => {
            notify(
              `Failed to update sample status: ${error instanceof Error ? error.message : "Unknown error"}`,
              { type: "error" }
            );
          },
        }
      );
    } catch (error: unknown) {
      logger.error("Sample status update exception", error, {
        feature: "SampleStatusBadge",
        activityId,
        targetStatus: nextStatus,
      });
    }
  }, [activityId, nextStatus, status, update, notify, onStatusChange, queryClient]);

  /**
   * Handle direct status selection (for non-linear jumps if needed)
   */
  const handleStatusSelect = useCallback(
    async (targetStatus: SampleStatus) => {
      if (!activityId || targetStatus === status) return;

      try {
        await update(
          "activities",
          {
            id: activityId,
            data: { sample_status: targetStatus },
            previousData: { sample_status: status },
          },
          {
            onSuccess: () => {
              // Invalidate activity cache to refresh timeline
              // Use granular detail key for specific activity
              queryClient.invalidateQueries({
                queryKey: activityKeys.detail(activityId),
              });
              notify(`Sample status updated to ${SAMPLE_STATUS_CONFIG[targetStatus].label}`, {
                type: "success",
              });
              onStatusChange?.(targetStatus);
              setIsPopoverOpen(false);
            },
            onError: (error) => {
              notify(
                `Failed to update sample status: ${error instanceof Error ? error.message : "Unknown error"}`,
                { type: "error" }
              );
            },
          }
        );
      } catch (error: unknown) {
        logger.error("Sample status update exception", error, {
          feature: "SampleStatusBadge",
          activityId,
          targetStatus,
        });
      }
    },
    [activityId, status, update, notify, onStatusChange, queryClient]
  );

  // ============================================
  // Render: Read-Only Badge
  // ============================================

  if (!interactive) {
    return (
      <Badge variant={config.variant} className={cn(config.className, className)}>
        {!compact && <Icon className="h-3 w-3" />}
        {compact ? config.shortLabel : config.label}
      </Badge>
    );
  }

  // ============================================
  // Render: Interactive Badge with Popover
  // ============================================

  return (
    <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "inline-flex cursor-pointer min-h-11 transition-opacity hover:opacity-80",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            "rounded-md"
          )}
          aria-label={`Sample status: ${config.label}. Click to change.`}
          disabled={isUpdating}
        >
          <Badge variant={config.variant} className={cn(config.className, className)}>
            {isUpdating ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              !compact && <Icon className="h-3 w-3" />
            )}
            {compact ? config.shortLabel : config.label}
          </Badge>
        </button>
      </PopoverTrigger>

      <PopoverContent className="w-80 p-0" align="start" side="bottom" sideOffset={4}>
        <div className="p-4 space-y-4">
          {/* Header */}
          <div className="space-y-1">
            <h4 className="font-medium text-sm">Sample Workflow Status</h4>
            <p className="text-xs text-muted-foreground">{config.description}</p>
          </div>

          {/* Workflow Stepper */}
          {showStepper && (
            <div className="flex items-center justify-between py-2">
              {SAMPLE_STATUS_WORKFLOW.map((stepStatus, index) => {
                const stepConfig = SAMPLE_STATUS_CONFIG[stepStatus];
                const StepIcon = stepConfig.icon;
                const currentIndex = SAMPLE_STATUS_WORKFLOW.indexOf(status);
                const isCompleted = index < currentIndex;
                const isCurrent = stepStatus === status;

                return (
                  <div key={stepStatus} className="flex items-center">
                    {/* Step indicator */}
                    <button
                      type="button"
                      onClick={() => handleStatusSelect(stepStatus)}
                      disabled={isUpdating || index <= currentIndex}
                      className={cn(
                        "flex flex-col items-center gap-1 p-1 rounded transition-colors",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                        index > currentIndex ? "cursor-pointer hover:bg-muted" : "cursor-default"
                      )}
                      aria-label={`${isCompleted ? "Completed: " : isCurrent ? "Current: " : ""}${stepConfig.label}`}
                    >
                      <div
                        className={cn(
                          "h-11 w-11 rounded-full flex items-center justify-center transition-colors",
                          isCompleted && "bg-success text-success-foreground",
                          isCurrent && stepConfig.className,
                          !isCompleted && !isCurrent && "bg-muted text-muted-foreground"
                        )}
                      >
                        {isCompleted ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          <StepIcon className="h-4 w-4" />
                        )}
                      </div>
                      <span
                        className={cn(
                          "text-[10px] font-medium",
                          isCurrent ? "text-foreground" : "text-muted-foreground"
                        )}
                      >
                        {stepConfig.shortLabel}
                      </span>
                    </button>

                    {/* Connector line */}
                    {index < SAMPLE_STATUS_WORKFLOW.length - 1 && (
                      <ChevronRight
                        className={cn(
                          "h-4 w-4 mx-1",
                          index < currentIndex ? "text-success" : "text-muted-foreground/40"
                        )}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Quick Actions */}
          <div className="flex flex-col gap-2">
            {nextStatus && (
              <AdminButton
                onClick={handleAdvanceStatus}
                disabled={isUpdating}
                className="w-full h-11"
                size="default"
              >
                {isUpdating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    Advance to {SAMPLE_STATUS_CONFIG[nextStatus].label}
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </>
                )}
              </AdminButton>
            )}

            {!nextStatus && (
              <div className="text-center py-2">
                <Badge variant="default" className="bg-success text-success-foreground">
                  <Check className="h-3 w-3" />
                  Workflow Complete
                </Badge>
              </div>
            )}
          </div>

          {/* Status Selection List (for direct jumps) */}
          <div className="border-t pt-3 mt-3">
            <p className="text-xs text-muted-foreground mb-2">Or select a status directly:</p>
            <div className="grid grid-cols-2 gap-2">
              {SAMPLE_STATUS_WORKFLOW.map((selectStatus) => {
                const selectConfig = SAMPLE_STATUS_CONFIG[selectStatus];
                const SelectIcon = selectConfig.icon;
                const isCurrent = selectStatus === status;

                return (
                  <AdminButton
                    key={selectStatus}
                    variant={isCurrent ? "default" : "outline"}
                    size="sm"
                    className={cn("h-11 justify-start", isCurrent && "pointer-events-none")}
                    onClick={() => handleStatusSelect(selectStatus)}
                    disabled={isUpdating || isCurrent}
                  >
                    <SelectIcon className="h-3 w-3 mr-2" />
                    {selectConfig.shortLabel}
                    {isCurrent && <Check className="h-3 w-3 ml-auto" />}
                  </AdminButton>
                );
              })}
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
});

SampleStatusBadge.displayName = "SampleStatusBadge";

// ============================================
// Utility Components
// ============================================

/**
 * Compact inline stepper showing workflow progression
 * Useful for list views or tight spaces
 */
export function SampleStatusStepper({
  status,
  className,
}: {
  status: SampleStatus;
  className?: string;
}) {
  const currentIndex = SAMPLE_STATUS_WORKFLOW.indexOf(status);

  return (
    <div className={cn("flex items-center gap-1", className)}>
      {SAMPLE_STATUS_WORKFLOW.map((stepStatus, index) => {
        const isCompleted = index < currentIndex;
        const isCurrent = stepStatus === status;

        return (
          <div key={stepStatus} className="flex items-center">
            <div
              className={cn(
                "h-2 w-2 rounded-full transition-colors",
                isCompleted && "bg-success",
                isCurrent && "bg-primary",
                !isCompleted && !isCurrent && "bg-muted-foreground/30"
              )}
              title={SAMPLE_STATUS_CONFIG[stepStatus].label}
            />
            {index < SAMPLE_STATUS_WORKFLOW.length - 1 && (
              <div
                className={cn(
                  "h-0.5 w-3",
                  index < currentIndex ? "bg-success" : "bg-muted-foreground/20"
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

export default SampleStatusBadge;
