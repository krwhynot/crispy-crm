import { useEffect } from "react";
import { useGetOne } from "react-admin";
import { UserIcon, ActivityIcon, FileTextIcon } from "lucide-react";
import { ResourceSlideOver, type TabConfig } from "@/components/layouts/ResourceSlideOver";
import { ContactDetailSkeleton } from "@/components/ui/list-skeleton";
import { ContactDetailsTab } from "./ContactDetailsTab";
import { ContactNotesTab } from "./slideOverTabs/ContactNotesTab";
import { ActivitiesTab } from "./ActivitiesTab";
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
 * Provides a tabbed interface with:
 * - Details: Contact information (view/edit)
 * - Activities: Activity timeline
 * - Notes: Contact notes (create/edit)
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
  }, [record, addRecent]);

  // Tab configuration with count badges
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
      countFromRecord: (record: Contact) => record.nb_activities,
    },
    {
      key: "notes",
      label: "Notes",
      component: ContactNotesTab,
      icon: FileTextIcon,
      countFromRecord: (record: Contact) => record.nb_notes,
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
      breadcrumbComponent={ContactHierarchyBreadcrumb}
      loadingSkeleton={ContactDetailSkeleton}
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
