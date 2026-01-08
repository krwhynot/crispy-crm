import { CheckSquareIcon, LinkIcon } from "lucide-react";
import type { TabConfig } from "@/components/layouts/ResourceSlideOver";
import { ResourceSlideOver } from "@/components/layouts/ResourceSlideOver";
import { TaskSlideOverDetailsTab } from "./TaskSlideOverDetailsTab";
import { TaskRelatedItemsTab } from "./TaskRelatedItemsTab";
import { QuickAddTaskButton } from "@/atomic-crm/components";
import type { Task } from "../types";

interface TaskSlideOverProps {
  recordId: number | null;
  isOpen: boolean;
  onClose: () => void;
  mode: "view" | "edit";
  onModeToggle: () => void;
}

/**
 * TaskSlideOver - Slide-over panel for viewing and editing tasks
 *
 * Features:
 * - Details tab: All task fields including inline completion checkbox
 * - Related Items tab: Contact, Opportunity, Sales rep links
 * - View/Edit mode toggle
 * - URL synchronization
 * - ESC key to close
 *
 * Design:
 * - 40vw width (480-720px)
 * - Slide-in from right
 * - Two tabs with icons
 */
export function TaskSlideOver({
  recordId,
  isOpen,
  onClose,
  mode,
  onModeToggle,
}: TaskSlideOverProps) {
  // Tab configuration
  const tabs: TabConfig[] = [
    {
      key: "details",
      label: "Details",
      component: TaskSlideOverDetailsTab,
      icon: CheckSquareIcon,
    },
    {
      key: "related",
      label: "Related Items",
      component: TaskRelatedItemsTab,
      icon: LinkIcon,
    },
  ];

  // Record representation function
  const recordRepresentation = (record: Task) => {
    return record.title || `Task #${record.id}`;
  };

  return (
    <ResourceSlideOver
      resource="tasks"
      recordId={recordId}
      isOpen={isOpen}
      onClose={onClose}
      mode={mode}
      onModeToggle={onModeToggle}
      tabs={tabs}
      recordRepresentation={recordRepresentation}
      headerActions={() => <QuickAddTaskButton />}
    />
  );
}
