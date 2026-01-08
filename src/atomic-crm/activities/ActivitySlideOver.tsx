import type { RaRecord } from "react-admin";
import type { ComponentType } from "react";
import { InfoIcon, LinkIcon } from "lucide-react";
import type { TabConfig, TabComponentProps } from "@/components/layouts/ResourceSlideOver";
import { ResourceSlideOver } from "@/components/layouts/ResourceSlideOver";
import { ActivityDetailsTab, ActivityRelatedTab } from "./slideOverTabs";
import type { ActivityRecord } from "../types";

interface ActivitySlideOverProps {
  recordId: number | null;
  isOpen: boolean;
  onClose: () => void;
  mode: "view" | "edit";
  onModeToggle: () => void;
}

/**
 * ActivitySlideOver - Slide-over panel for viewing and editing activities
 *
 * Features:
 * - Details tab: Activity type, subject, date, duration, description, sentiment, follow-up
 * - Related tab: Linked contact, organization, opportunity
 * - View/Edit mode toggle
 * - URL synchronization (?view=123 or ?edit=123)
 * - ESC key to close
 *
 * Design:
 * - 40vw width (480-720px)
 * - Slide-in from right
 * - Two tabs with icons
 */
export function ActivitySlideOver({
  recordId,
  isOpen,
  onClose,
  mode,
  onModeToggle,
}: ActivitySlideOverProps) {
  // Tab configuration - using type assertion for component compatibility
  // The tab components accept the same props as TabComponentProps but with typed record
  const tabs: TabConfig[] = [
    {
      key: "details",
      label: "Details",
      component: ActivityDetailsTab as ComponentType<TabComponentProps>,
      icon: InfoIcon,
    },
    {
      key: "related",
      label: "Related",
      component: ActivityRelatedTab as ComponentType<TabComponentProps>,
      icon: LinkIcon,
    },
  ];

  // Record representation function
  const recordRepresentation = (record: RaRecord) => {
    const activityRecord = record as ActivityRecord;
    return activityRecord.subject || `Activity #${record.id}`;
  };

  return (
    <ResourceSlideOver
      resource="activities"
      recordId={recordId}
      isOpen={isOpen}
      onClose={onClose}
      mode={mode}
      onModeToggle={onModeToggle}
      tabs={tabs}
      recordRepresentation={recordRepresentation}
    />
  );
}
