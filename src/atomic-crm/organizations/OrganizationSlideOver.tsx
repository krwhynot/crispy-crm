/**
 * OrganizationSlideOver - Slide-over panel for viewing/editing organization details
 *
 * Uses the ResourceSlideOver pattern with two-column layout:
 * - Left tabs: Activities, Contacts, Opportunities (+Authorizations for distributors)
 * - Right panel: Organization details (view/edit) and notes (always visible)
 *
 * @see docs/archive/plans/2025-11-16-unified-design-system-rollout.md
 */

import { useEffect } from "react";
import { Users, Target, Activity, ShieldCheck } from "lucide-react";
import type { TabConfig } from "@/components/layouts/ResourceSlideOver";
import { ResourceSlideOver } from "@/components/layouts/ResourceSlideOver";
import { OrganizationDetailSkeleton } from "@/components/ui/list-skeleton";
import { OrganizationContactsTab } from "./slideOverTabs/OrganizationContactsTab";
import { OrganizationOpportunitiesTab } from "./slideOverTabs/OrganizationOpportunitiesTab";
import { OrganizationActivitiesTab } from "./slideOverTabs/OrganizationActivitiesTab";
import { OrganizationRightPanel } from "./slideOverTabs/OrganizationRightPanel";
import { AuthorizationsTab } from "./AuthorizationsTab";
import { useGetOne } from "react-admin";
import { useRecentSearches } from "@/atomic-crm/hooks/useRecentSearches";
import { FavoriteToggleButton, QuickAddTaskButton } from "@/atomic-crm/components";
import { OrganizationHierarchyBreadcrumb } from "./OrganizationHierarchyBreadcrumb";
import type { OrganizationRecord } from "./types";
import type { OrganizationWithHierarchy } from "../types";

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
  const { addRecent } = useRecentSearches();

  // Fetch the organization to determine its type
  const { data: organization } = useGetOne<OrganizationRecord>(
    "organizations",
    { id: recordId! },
    { enabled: !!recordId && isOpen }
  );

  useEffect(() => {
    if (organization?.id) {
      addRecent({
        id: organization.id,
        label: organization.name,
        entityType: "organizations",
      });
    }
  }, [organization?.id, organization?.name, addRecent]);

  const isDistributor = organization?.organization_type === "distributor";

  // Base tabs available for all organizations (Details + Notes moved to right panel)
  const baseTabs: TabConfig[] = [
    {
      key: "activities",
      label: "Activities",
      component: OrganizationActivitiesTab,
      icon: Activity,
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
  ];

  // Conditionally add Authorizations tab for distributors (after Activities)
  const tabs: TabConfig[] = isDistributor
    ? [
        baseTabs[0], // Activities
        {
          key: "authorizations",
          label: "Authorizations",
          component: AuthorizationsTab,
          icon: ShieldCheck,
        },
        ...baseTabs.slice(1), // Contacts, Opportunities
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
      breadcrumbComponent={OrganizationHierarchyBreadcrumb}
      headerActions={(record) => (
        <>
          <FavoriteToggleButton
            entityType="organizations"
            entityId={Number(record.id)}
            displayName={record.name || `Organization #${record.id}`}
          />
          <QuickAddTaskButton organizationId={Number(record.id)} />
        </>
      )}
      rightPanel={({ record, mode, onModeToggle, onDirtyChange }) => (
        <OrganizationRightPanel
          record={record as OrganizationWithHierarchy}
          mode={mode}
          onModeToggle={onModeToggle}
          onDirtyChange={onDirtyChange}
        />
      )}
    />
  );
}
