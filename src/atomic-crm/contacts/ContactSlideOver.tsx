import { UserIcon, ActivityIcon, FileTextIcon } from "lucide-react";
import { ResourceSlideOver, type TabConfig } from "@/components/layouts/ResourceSlideOver";
import { ContactDetailsTab } from "./ContactDetailsTab";
import { ContactNotesTab } from "./ContactNotesTab";
import { ActivitiesTab } from "./ActivitiesTab";
import type { Contact } from "../types";

interface ContactSlideOverProps {
  recordId: number | null;
  isOpen: boolean;
  mode: "view" | "edit";
  onClose: () => void;
  onModeToggle: () => void;
}

/**
 * Slide-over panel for viewing and editing contact records.
 *
 * Provides a tabbed interface with:
 * - Details: Contact information (view/edit)
 * - Activities: Activity timeline
 * - Notes: Contact notes (create/edit)
 * - Files: File attachments (placeholder)
 *
 * Uses ResourceSlideOver wrapper from Task 1.4 for consistent UI.
 */
export function ContactSlideOver({
  recordId,
  isOpen,
  mode,
  onClose,
  onModeToggle,
}: ContactSlideOverProps) {
  // Tab configuration
  const contactTabs: TabConfig[] = [
    {
      key: "details",
      label: "Details",
      component: ContactDetailsTab,
      icon: UserIcon,
    },
    {
      key: "activities",
      label: "Activities",
      component: ({ record }) => <ActivitiesTab contactId={record.id} />,
      icon: ActivityIcon,
    },
    {
      key: "notes",
      label: "Notes",
      component: ContactNotesTab,
      icon: FileTextIcon,
    },
    {
      key: "files",
      label: "Files",
      component: ContactFilesTab,
      icon: FileIcon,
    },
  ];

  // Record representation function
  const getContactName = (record: Contact) => {
    return `${record.first_name} ${record.last_name}`;
  };

  return (
    <ResourceSlideOver
      resource="contacts"
      recordId={recordId}
      isOpen={isOpen}
      onClose={onClose}
      mode={mode}
      onModeToggle={onModeToggle}
      tabs={contactTabs}
      recordRepresentation={getContactName}
    />
  );
}
