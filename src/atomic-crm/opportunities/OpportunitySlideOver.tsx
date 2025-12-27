import { TargetIcon, Users, Package, StickyNote } from "lucide-react";
import { useGetIdentity, useGetOne } from "react-admin";
import type { TabConfig } from "@/components/layouts/ResourceSlideOver";
import { ResourceSlideOver } from "@/components/layouts/ResourceSlideOver";
import { OpportunitySlideOverDetailsTab } from "./slideOverTabs/OpportunitySlideOverDetailsTab";
import { OpportunityContactsTab } from "./slideOverTabs/OpportunityContactsTab";
import { OpportunityProductsTab } from "./slideOverTabs/OpportunityProductsTab";
import { OpportunityNotesTab } from "./slideOverTabs/OpportunityNotesTab";
import { QuickAddTaskButton } from "@/atomic-crm/components";
import type { Opportunity } from "@/atomic-crm/types";
import { useUserRole } from "@/hooks/useUserRole";

interface OpportunitySlideOverProps {
  recordId: number | null;
  isOpen: boolean;
  onClose: () => void;
  mode: "view" | "edit";
  onModeToggle: () => void;
}

export function OpportunitySlideOver({
  recordId,
  isOpen,
  onClose,
  mode,
  onModeToggle,
}: OpportunitySlideOverProps) {
  const tabs: TabConfig[] = [
    {
      key: "details",
      label: "Details",
      component: OpportunitySlideOverDetailsTab,
      icon: TargetIcon,
    },
    {
      key: "contacts",
      label: "Contacts",
      component: OpportunityContactsTab,
      icon: Users,
    },
    {
      key: "products",
      label: "Products",
      component: OpportunityProductsTab,
      icon: Package,
    },
    {
      key: "notes",
      label: "Notes",
      component: OpportunityNotesTab,
      icon: StickyNote,
    },
  ];

  const recordRepresentation = (record: Opportunity) => {
    return record.name || `Opportunity #${record.id}`;
  };

  return (
    <ResourceSlideOver
      resource="opportunities"
      recordId={recordId}
      isOpen={isOpen}
      onClose={onClose}
      mode={mode}
      onModeToggle={onModeToggle}
      tabs={tabs}
      recordRepresentation={recordRepresentation}
      headerActions={(record) => (
        <QuickAddTaskButton opportunityId={record.id} />
      )}
    />
  );
}
