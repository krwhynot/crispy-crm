import { useState, useEffect } from "react";
import { useDataProvider, useNotify, useGetOne } from "ra-core";
import { Button } from "@/components/ui/button";
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
import type { Task, Opportunity } from "../types";

interface QuickLogActivityProps {
  open: boolean;
  onClose: () => void;
  task: Task;
}

// Maps task types to activity interaction types
const TASK_TYPE_TO_ACTIVITY_TYPE: Record<string, string> = {
  Call: "call",
  Email: "email",
  Meeting: "meeting",
  "Follow-up": "follow_up",
  Proposal: "proposal",
  Discovery: "meeting",
  Administrative: "check_in",
  None: "check_in",
};

// Infer activity type from task title keywords
const inferActivityTypeFromTitle = (title: string): string => {
  const lowerTitle = title.toLowerCase();

  if (lowerTitle.includes("call") || lowerTitle.includes("phone")) return "call";
  if (lowerTitle.includes("email") || lowerTitle.includes("mail")) return "email";
  if (lowerTitle.includes("meeting") || lowerTitle.includes("meet")) return "meeting";
  if (lowerTitle.includes("demo") || lowerTitle.includes("demonstration")) return "demo";
  if (lowerTitle.includes("proposal") || lowerTitle.includes("quote")) return "proposal";
  if (lowerTitle.includes("follow") || lowerTitle.includes("check")) return "follow_up";
  if (lowerTitle.includes("visit") || lowerTitle.includes("site")) return "site_visit";
  if (lowerTitle.includes("contract") || lowerTitle.includes("agreement")) return "contract_review";

  return "check_in"; // Default fallback
};

export const QuickLogActivity: React.FC<QuickLogActivityProps> = ({ open, onClose, task }) => {
  const dataProvider = useDataProvider();
  const notify = useNotify();

  // Determine initial activity type
  const getInitialActivityType = () => {
    // First try to use the task type if it exists and is not "None"
    if (task.type && task.type !== "None") {
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
          activity_type: "interaction", // Required field for activities table
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

      notify("Activity logged successfully", { type: "success" });
      onClose();
    } catch (error) {
      console.error("Error logging activity:", error);
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
                {/* Group 1: Communication (3 items) */}
                <SelectGroup>
                  <SelectLabel>Communication</SelectLabel>
                  <SelectItem value="call">Call</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="check_in">Check-in</SelectItem>
                </SelectGroup>

                <SelectSeparator />

                {/* Group 2: Meetings (3 items) */}
                <SelectGroup>
                  <SelectLabel>Meetings</SelectLabel>
                  <SelectItem value="meeting">Meeting</SelectItem>
                  <SelectItem value="demo">Demo</SelectItem>
                  <SelectItem value="site_visit">Site Visit</SelectItem>
                </SelectGroup>

                <SelectSeparator />

                {/* Group 3: Documentation (3 items) */}
                <SelectGroup>
                  <SelectLabel>Documentation</SelectLabel>
                  <SelectItem value="proposal">Proposal</SelectItem>
                  <SelectItem value="contract_review">Contract Review</SelectItem>
                  <SelectItem value="follow_up">Follow-up</SelectItem>
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
          <Button type="button" variant="outline" onClick={handleSkip} disabled={isSubmitting}>
            Skip
          </Button>
          <Button type="button" onClick={handleSave} disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : "Save Activity"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
