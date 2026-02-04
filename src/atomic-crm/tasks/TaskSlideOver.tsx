import { CheckSquareIcon } from "lucide-react";
import type { TabConfig } from "@/components/layouts/ResourceSlideOver";
import { ResourceSlideOver } from "@/components/layouts/ResourceSlideOver";
import { TaskSlideOverDetailsTab } from "./TaskSlideOverDetailsTab";
import { TaskHierarchyBreadcrumb } from "./TaskHierarchyBreadcrumb";
import type { Task } from "./types";

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
 * - View/Edit mode toggle
 * - URL synchronization
 * - ESC key to close
 *
 * Design:
 * - 40vw width (480-720px)
 * - Slide-in from right
 * - Single tab interface
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
      breadcrumbComponent={TaskHierarchyBreadcrumb}
    />
  );
}
