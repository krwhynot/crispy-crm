import { useState, useEffect } from "react";
import { useDataProvider, useNotify, useGetOne } from "ra-core";
import { useQueryClient } from "@tanstack/react-query";
import { AdminButton } from "@/components/admin/AdminButton";
import { logger } from "@/lib/logger";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { activityKeys, opportunityKeys, taskKeys } from "@/atomic-crm/queryKeys";
import type { Task } from "../tasks/types";
import type { Opportunity } from "../types";

interface QuickLogActivityProps {
  open: boolean;
  onClose: () => void;
  task: Task;
}

/**
 * All 13 activity types from PRD v1.18 organized into groups
 * Matches the structure in dashboard/v3/validation/activitySchema.ts
 */
const ACTIVITY_TYPE_GROUPS = {
  Communication: [
    { value: "call", label: "Call" },
    { value: "email", label: "Email" },
    { value: "check_in", label: "Check-in" },
    { value: "social", label: "Social" },
  ],
  Meetings: [
    { value: "meeting", label: "Meeting" },
    { value: "demo", label: "Demo" },
    { value: "site_visit", label: "Site Visit" },
    { value: "trade_show", label: "Trade Show" },
  ],
  Documentation: [
    { value: "proposal", label: "Proposal" },
    { value: "contract_review", label: "Contract Review" },
    { value: "follow_up", label: "Follow-up" },
    { value: "note", label: "Note" },
    { value: "sample", label: "Sample" },
  ],
} as const;

// Maps task types to activity interaction types
const TASK_TYPE_TO_ACTIVITY_TYPE: Record<string, string> = {
  Call: "call",
  Email: "email",
  Meeting: "meeting",
  "Follow-up": "follow_up",
  Demo: "demo",
  Proposal: "proposal",
  Other: "check_in",
};

// Infer activity type from task title keywords (all 13 types)
const inferActivityTypeFromTitle = (title: string): string => {
  const lowerTitle = title.toLowerCase();

  if (lowerTitle.includes("call") || lowerTitle.includes("phone")) return "call";
  if (lowerTitle.includes("email") || lowerTitle.includes("mail")) return "email";
  if (lowerTitle.includes("meeting") || lowerTitle.includes("meet")) return "meeting";
  if (lowerTitle.includes("demo") || lowerTitle.includes("demonstration")) return "demo";
  if (lowerTitle.includes("proposal") || lowerTitle.includes("quote")) return "proposal";
  if (lowerTitle.includes("follow") || lowerTitle.includes("check-in")) return "follow_up";
  if (lowerTitle.includes("visit") || lowerTitle.includes("site")) return "site_visit";
  if (lowerTitle.includes("contract") || lowerTitle.includes("agreement")) return "contract_review";
  if (lowerTitle.includes("trade") || lowerTitle.includes("show") || lowerTitle.includes("expo"))
    return "trade_show";
  if (
    lowerTitle.includes("social") ||
    lowerTitle.includes("linkedin") ||
    lowerTitle.includes("network")
  )
    return "social";
  if (lowerTitle.includes("sample") || lowerTitle.includes("product")) return "sample";
  if (lowerTitle.includes("note") || lowerTitle.includes("memo")) return "note";

  return "check_in"; // Default fallback
};

export const QuickLogActivity: React.FC<QuickLogActivityProps> = ({ open, onClose, task }) => {
  const dataProvider = useDataProvider();
  const notify = useNotify();
  const queryClient = useQueryClient();

  // Determine initial activity type
  const getInitialActivityType = () => {
    // First try to use the task type if it exists and is not "Other"
    if (task.type && task.type !== "Other") {
      return TASK_TYPE_TO_ACTIVITY_TYPE[task.type] || "check_in";
    }
    // Otherwise infer from the title
    return inferActivityTypeFromTitle(task.title);
  };

  const [activityType, setActivityType] = useState(getInitialActivityType());
  const [notes, setNotes] = useState(`Completed task: ${task.title}`);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [organizationId, setOrganizationId] = useState<number | null>(null);

  // Fetch opportunity to get organization_id if task has opportunity_id
  const { data: opportunity } = useGetOne<Opportunity>(
    "opportunities",
    { id: task.opportunity_id || 0 },
    { enabled: !!task.opportunity_id }
  );

  useEffect(() => {
    if (opportunity) {
      setOrganizationId(opportunity.customer_organization_id);
    }
  }, [opportunity]);

  const handleSave = async () => {
    setIsSubmitting(true);

    try {
      await dataProvider.create("activities", {
        data: {
          activity_type: "activity",
          type: activityType, // The interaction_type enum
          subject: `Completed: ${task.title}`,
          description: notes,
          activity_date: new Date().toISOString(),
          contact_id: task.contact_id || null,
          opportunity_id: task.opportunity_id || null,
          organization_id: organizationId || null, // Use fetched organizationId from opportunity
          related_task_id: task.id, // Link to the completed task
          follow_up_required: false,
        },
      });

      queryClient.invalidateQueries({ queryKey: activityKeys.all });
      queryClient.invalidateQueries({ queryKey: opportunityKeys.all });
      queryClient.invalidateQueries({ queryKey: taskKeys.all });

      notify("Activity logged successfully", { type: "success" });
      onClose();
    } catch (error: unknown) {
      logger.error("Failed to log activity", error, {
        feature: "QuickLogActivity",
        taskId: task.id,
        activityType,
      });
      notify("Failed to log activity", { type: "error" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkip = () => {
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Log Activity Details</DialogTitle>
          <DialogDescription>What happened with this task? (optional)</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="activity-type">Activity Type</Label>
            <Select value={activityType} onValueChange={setActivityType} disabled={isSubmitting}>
              <SelectTrigger id="activity-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {/* Group 1: Communication (4 items) */}
                <SelectGroup>
                  <SelectLabel>Communication</SelectLabel>
                  {ACTIVITY_TYPE_GROUPS.Communication.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectGroup>

                <SelectSeparator />

                {/* Group 2: Meetings (4 items) */}
                <SelectGroup>
                  <SelectLabel>Meetings</SelectLabel>
                  {ACTIVITY_TYPE_GROUPS.Meetings.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectGroup>

                <SelectSeparator />

                {/* Group 3: Documentation (5 items) */}
                <SelectGroup>
                  <SelectLabel>Documentation</SelectLabel>
                  {ACTIVITY_TYPE_GROUPS.Documentation.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="What was discussed or accomplished?"
              className="min-h-[100px]"
              disabled={isSubmitting}
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <AdminButton type="button" variant="outline" onClick={handleSkip} disabled={isSubmitting}>
            Skip
          </AdminButton>
          <AdminButton
            type="button"
            onClick={handleSave}
            isLoading={isSubmitting}
            loadingText="Saving..."
          >
            Save Activity
          </AdminButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
