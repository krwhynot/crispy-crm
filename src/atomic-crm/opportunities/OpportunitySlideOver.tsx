import { TargetIcon, Users, Building2, Package, Activity } from "lucide-react";
import type { TabConfig } from "@/components/layouts/ResourceSlideOver";
import { ResourceSlideOver } from "@/components/layouts/ResourceSlideOver";
import { OpportunitySlideOverDetailsTab } from "./slideOverTabs/OpportunitySlideOverDetailsTab";
import { OpportunityContactsTab } from "./slideOverTabs/OpportunityContactsTab";
import { OpportunityOrganizationsTab } from "./slideOverTabs/OpportunityOrganizationsTab";
import { OpportunityProductsTab } from "./slideOverTabs/OpportunityProductsTab";
import { OpportunityActivitiesTab } from "./slideOverTabs/OpportunityActivitiesTab";

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
      key: "organizations",
      label: "Organizations",
      component: OpportunityOrganizationsTab,
      icon: Building2,
    },
    {
      key: "products",
      label: "Products",
      component: OpportunityProductsTab,
      icon: Package,
    },
    {
      key: "activities",
      label: "Activities",
      component: OpportunityActivitiesTab,
      icon: Activity,
    },
  ];

  const recordRepresentation = (record: any) => {
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
    />
  );
}
