import { useEffect } from "react";
import { useGetOne } from "react-admin";
import { ActivityIcon } from "lucide-react";
import { ResourceSlideOver, type TabConfig } from "@/components/layouts/ResourceSlideOver";
import { ContactDetailSkeleton } from "@/components/ui/list-skeleton";
import { ActivitiesTab } from "./ActivitiesTab";
import { ContactRightPanel } from "./ContactRightPanel";
import { ContactHierarchyBreadcrumb } from "./ContactHierarchyBreadcrumb";
import { QuickAddTaskButton, FavoriteToggleButton } from "@/atomic-crm/components";
import { useRecentSearches } from "@/atomic-crm/hooks/useRecentSearches";
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
 * Two-column layout:
 * - Left: Activities tab (activity timeline)
 * - Right: Contact details, notes, and tasks (ContactRightPanel)
 *
 * In edit mode, the right panel shows the full contact form above
 * the notes and tasks sections.
 *
 * Uses ResourceSlideOver wrapper for consistent UI.
 */
export function ContactSlideOver({
  recordId,
  isOpen,
  mode,
  onClose,
  onModeToggle,
}: ContactSlideOverProps) {
  const { addRecent } = useRecentSearches();

  const { data: record } = useGetOne<Contact>(
    "contacts",
    { id: recordId! },
    { enabled: !!recordId && isOpen }
  );

  useEffect(() => {
    if (record?.id) {
      addRecent({
        id: record.id,
        label: `${record.first_name || ""} ${record.last_name || ""}`.trim(),
        entityType: "contacts",
      });
    }
  }, [record?.id, record?.first_name, record?.last_name, addRecent]);

  // Tab configuration - Activities only (details/notes/tasks in right panel)
  const contactTabs: TabConfig[] = [
    {
      key: "activities",
      label: "Activities",
      component: (props) => (
        <ActivitiesTab contactId={props.record.id} organizationId={props.record.organization_id} />
      ),
      icon: ActivityIcon,
      countFromRecord: (record: Contact) => record.nb_activities,
    },
  ];

  // Record representation function
  const getContactName = (record: Contact) => {
    return `${record.first_name || ""} ${record.last_name || ""}`.trim();
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
      breadcrumbComponent={ContactHierarchyBreadcrumb}
      loadingSkeleton={ContactDetailSkeleton}
      rightPanel={({ record, mode, onModeToggle, onDirtyChange }) => (
        <ContactRightPanel
          record={record as Contact}
          mode={mode}
          onModeToggle={onModeToggle}
          onDirtyChange={onDirtyChange}
        />
      )}
      headerActions={(record) => (
        <>
          <FavoriteToggleButton
            entityType="contacts"
            entityId={record.id}
            displayName={
              `${record.first_name || ""} ${record.last_name || ""}`.trim() ||
              `Contact #${record.id}`
            }
          />
          <QuickAddTaskButton contactId={record.id} />
        </>
      )}
    />
  );
}
