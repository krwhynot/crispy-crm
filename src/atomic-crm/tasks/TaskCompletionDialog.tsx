import { useState } from "react";
import { CheckCircle, FileText, CalendarPlus } from "lucide-react";
import { useNavigate } from "react-router-dom";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { AdminButton } from "@/components/admin/AdminButton";
import { QuickLogActivityDialog } from "@/atomic-crm/activities";

interface TaskCompletionDialogProps {
  task: {
    id: number;
    subject: string;
    taskType: string;
    relatedTo: { id: number; type: string; name: string };
  };
  open: boolean;
  onClose: () => void;
  onComplete: () => void;
}

const mapTaskTypeToActivityType = (taskType: string): string => {
  const mapping: Record<string, string> = {
    Call: "Call",
    Email: "Email",
    Meeting: "Meeting",
    Demo: "Demo",
    "Follow-up": "Follow-up",
    Proposal: "Email",
    Other: "Note",
  };
  return mapping[taskType] || "Note";
};

export const TaskCompletionDialog = ({
  task,
  open,
  onClose,
  onComplete,
}: TaskCompletionDialogProps) => {
  const navigate = useNavigate();
  const [showActivityDialog, setShowActivityDialog] = useState(false);

  const activityType = mapTaskTypeToActivityType(task.taskType);

  const handleLogActivity = () => {
    onComplete();
    setShowActivityDialog(true);
  };

  const handleCreateFollowUp = () => {
    const params = new URLSearchParams({
      type: "follow_up",
      title: `Follow-up: ${task.subject}`,
    });

    if (task.relatedTo.type === "contact") {
      params.append("contact_id", String(task.relatedTo.id));
    } else if (task.relatedTo.type === "opportunity") {
      params.append("opportunity_id", String(task.relatedTo.id));
    }

    onComplete();
    navigate(`/tasks/create?${params.toString()}`);
  };

  const handleJustComplete = () => {
    onComplete();
  };

  const entityContext = {
    ...(task.relatedTo.type === "contact" && { contactId: task.relatedTo.id }),
    ...(task.relatedTo.type === "opportunity" && { opportunityId: task.relatedTo.id }),
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent
          className="w-full max-w-md sm:w-[calc(100%-2rem)]"
          aria-describedby="task-completion-description"
        >
          <DialogHeader className="gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-success/10">
                <CheckCircle className="h-5 w-5 text-success" />
              </div>
              <DialogTitle className="text-lg font-semibold">Task Completed!</DialogTitle>
            </div>

            <DialogDescription id="task-completion-description" className="text-sm">
              <span className="font-medium text-foreground">{task.subject}</span>
            </DialogDescription>

            <div className="text-sm text-muted-foreground">What would you like to do next?</div>
          </DialogHeader>

          <div className="flex flex-col gap-3 pt-2">
            <AdminButton
              onClick={handleLogActivity}
              variant="default"
              className="min-h-[64px] w-full justify-start gap-3 px-6 text-left"
            >
              <FileText className="h-5 w-5 flex-shrink-0" />
              <div className="flex flex-col gap-1">
                <div className="font-semibold">Log Activity</div>
                <div className="text-xs opacity-90">Record what you did</div>
              </div>
            </AdminButton>

            <AdminButton
              onClick={handleCreateFollowUp}
              variant="default"
              className="min-h-[64px] w-full justify-start gap-3 px-6 text-left"
            >
              <CalendarPlus className="h-5 w-5 flex-shrink-0" />
              <div className="flex flex-col gap-1">
                <div className="font-semibold">Create Follow-up</div>
                <div className="text-xs opacity-90">Schedule next action</div>
              </div>
            </AdminButton>

            <AdminButton
              onClick={handleJustComplete}
              variant="outline"
              className="min-h-[64px] w-full justify-start gap-3 px-6 text-left"
            >
              <CheckCircle className="h-5 w-5 flex-shrink-0" />
              <div className="flex flex-col gap-1">
                <div className="font-semibold">Just Complete</div>
                <div className="text-xs opacity-90">No follow-up needed</div>
              </div>
            </AdminButton>
          </div>
        </DialogContent>
      </Dialog>

      <QuickLogActivityDialog
        open={showActivityDialog}
        onOpenChange={setShowActivityDialog}
        entityContext={entityContext}
        config={{
          activityType: activityType as
            | "Call"
            | "Email"
            | "Meeting"
            | "Demo"
            | "Sample"
            | "Note"
            | "Check-in"
            | "Follow-up",
          enableDraftPersistence: false,
          relatedTaskId: task.id,
        }}
      />
    </>
  );
};

export default TaskCompletionDialog;
