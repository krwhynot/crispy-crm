/**
 * OrganizationSlideOver - Slide-over panel for viewing/editing organization details
 *
 * Uses the ResourceSlideOver pattern with tabbed navigation. Tabs are conditionally
 * rendered based on organization type:
 * - Details, Contacts, Opportunities, Notes: All organizations
 * - Authorizations: Only for distributor organizations
 *
 * @see docs/plans/2025-11-16-unified-design-system-rollout.md
 */

import { BuildingIcon, Users, Target, StickyNote, ShieldCheck } from "lucide-react";
import type { TabConfig } from "@/components/layouts/ResourceSlideOver";
import { ResourceSlideOver } from "@/components/layouts/ResourceSlideOver";
import { OrganizationDetailSkeleton } from "@/components/ui/list-skeleton";
import { OrganizationDetailsTab } from "./slideOverTabs/OrganizationDetailsTab";
import { OrganizationContactsTab } from "./slideOverTabs/OrganizationContactsTab";
import { OrganizationOpportunitiesTab } from "./slideOverTabs/OrganizationOpportunitiesTab";
import { OrganizationNotesTab } from "./slideOverTabs/OrganizationNotesTab";
import { AuthorizationsTab } from "./AuthorizationsTab";
import { useGetOne } from "react-admin";
import type { OrganizationRecord } from "./types";

interface OrganizationSlideOverProps {
  recordId: number | null;
  isOpen: boolean;
  onClose: () => void;
  mode: "view" | "edit";
  onModeToggle: () => void;
}

export function OrganizationSlideOver({
  recordId,
  isOpen,
  onClose,
  mode,
  onModeToggle,
}: OrganizationSlideOverProps) {
  // Fetch the organization to determine its type
  const { data: organization } = useGetOne(
    "organizations",
    { id: recordId! },
    { enabled: !!recordId && isOpen }
  );

  const isDistributor = organization?.organization_type === "distributor";

  // Base tabs available for all organizations with count badges
  const baseTabs: TabConfig[] = [
    {
      key: "details",
      label: "Details",
      component: OrganizationDetailsTab,
      icon: BuildingIcon,
    },
    {
      key: "contacts",
      label: "Contacts",
      component: OrganizationContactsTab,
      icon: Users,
      countFromRecord: (record: OrganizationRecord) => record.nb_contacts,
    },
    {
      key: "opportunities",
      label: "Opportunities",
      component: OrganizationOpportunitiesTab,
      icon: Target,
      countFromRecord: (record: OrganizationRecord) => record.nb_opportunities,
    },
    {
      key: "notes",
      label: "Notes",
      component: OrganizationNotesTab,
      icon: StickyNote,
      countFromRecord: (record: OrganizationRecord) => record.nb_notes,
    },
  ];

  // Conditionally add Authorizations tab for distributors
  const tabs: TabConfig[] = isDistributor
    ? [
        ...baseTabs.slice(0, 1), // Details first
        {
          key: "authorizations",
          label: "Authorizations",
          component: AuthorizationsTab,
          icon: ShieldCheck,
        },
        ...baseTabs.slice(1), // Then Contacts, Opportunities, Notes
      ]
    : baseTabs;

  const recordRepresentation = (record: OrganizationRecord) => {
    return record.name || `Organization #${record.id}`;
  };

  return (
    <ResourceSlideOver
      resource="organizations"
      recordId={recordId}
      isOpen={isOpen}
      onClose={onClose}
      mode={mode}
      onModeToggle={onModeToggle}
      tabs={tabs}
      recordRepresentation={recordRepresentation}
      loadingSkeleton={OrganizationDetailSkeleton}
    />
  );
}
