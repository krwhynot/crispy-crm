import { useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";
import { AdminButton } from "@/components/admin/AdminButton";

interface QuickAddTaskButtonProps {
  contactId?: number;
  opportunityId?: number;
  organizationId?: number;
  variant?: "chip" | "button";
}

export function QuickAddTaskButton({
  contactId,
  opportunityId,
  organizationId,
  variant = "chip",
}: QuickAddTaskButtonProps) {
  const navigate = useNavigate();

  const handleClick = () => {
    const params = new URLSearchParams();
    if (contactId) params.set("contact_id", String(contactId));
    if (opportunityId) params.set("opportunity_id", String(opportunityId));
    if (organizationId) params.set("organization_id", String(organizationId));

    navigate(`/tasks/create?${params.toString()}`);
  };

  if (variant === "chip") {
    return (
      <button
        type="button"
        onClick={handleClick}
        className="inline-flex items-center gap-1.5 px-3 h-11 rounded-full
                   bg-primary/10 text-primary text-sm font-medium
                   hover:bg-primary/20 transition-colors whitespace-nowrap"
        aria-label="Add task"
      >
        <Plus className="h-4 w-4" />
        Add Task
      </button>
    );
  }

  return (
    <AdminButton type="button" onClick={handleClick} variant="outline" size="sm" className="h-11">
      <Plus className="h-4 w-4 mr-2" />
      Add Task
    </AdminButton>
  );
}
