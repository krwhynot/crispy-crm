import { useEffect, useState } from "react";
import { opportunityExporter } from "./opportunityExporter";
import { List } from "@/components/admin/list";
import { ListPagination } from "@/components/admin/list-pagination";
import { OpportunitySpeedDial } from "./OpportunitySpeedDial";
import { StandardListLayout } from "@/components/layouts/StandardListLayout";
import { ListSkeleton } from "@/components/ui/list-skeleton";

import { useGetIdentity, useListContext } from "ra-core";

import { OpportunityArchivedList } from "./OpportunityArchivedList";
import { OpportunityEmpty } from "./OpportunityEmpty";
import { OpportunityListContent } from "./kanban";
import { OpportunityRowListView } from "./OpportunityRowListView";
import { CampaignGroupedList } from "./CampaignGroupedList";
import { OpportunityViewSwitcher, type OpportunityView } from "./OpportunityViewSwitcher";
import { saveStagePreferences } from "../filters/opportunityStagePreferences";
import { useSlideOverState } from "@/hooks/useSlideOverState";
import { OpportunitySlideOver } from "./OpportunitySlideOver";
import { useFilterCleanup } from "../hooks/useFilterCleanup";
import { ListSearchBar } from "@/components/admin/ListSearchBar";
import { OpportunityListFilter } from "./OpportunityListFilter";
import { OPPORTUNITY_FILTER_CONFIG } from "./opportunityFilterConfig";
import { OpportunityListTutorial } from "./OpportunityListTutorial";

// Helper functions for view preference persistence
const OPPORTUNITY_VIEW_KEY = "opportunity.view.preference";

const getViewPreference = (): OpportunityView => {
  const saved = localStorage.getItem(OPPORTUNITY_VIEW_KEY);
  return saved === "list" || saved === "kanban" || saved === "campaign" ? saved : "kanban";
};

const saveViewPreference = (view: OpportunityView) => {
  localStorage.setItem(OPPORTUNITY_VIEW_KEY, view);
};

const OpportunityList = () => {
  const { data: identity, isPending: isIdentityPending } = useGetIdentity();
  const [view, setView] = useState<OpportunityView>(getViewPreference);

  // Clean up stale cached filters from localStorage
  useFilterCleanup("opportunities");

  // Slide-over state
  const { slideOverId, isOpen, mode, openSlideOver, closeSlideOver, toggleMode } =
    useSlideOverState();

  const handleViewChange = (newView: OpportunityView) => {
    setView(newView);
    saveViewPreference(newView);
  };

  if (isIdentityPending) return <ListSkeleton rows={8} columns={5} />;
  if (!identity) return null;

  return (
    <>
      <div data-tutorial="opportunities-list">
        <List
          perPage={25}
          filter={{
            "deleted_at@is": null,
          }}
          title={false}
          sort={{ field: "created_at", order: "DESC" }}
          actions={false}
          exporter={opportunityExporter}
          pagination={<ListPagination rowsPerPageOptions={[10, 25, 50]} />}
        >
          <OpportunityListLayout
            view={view}
            onViewChange={handleViewChange}
            openSlideOver={openSlideOver}
            isSlideOverOpen={isOpen}
            slideOverId={slideOverId}
            closeSlideOver={closeSlideOver}
          />
          <OpportunitySpeedDial />
        </List>
      </div>

      {/* Slide-over panel */}
      <OpportunitySlideOver
        recordId={slideOverId}
        isOpen={isOpen}
        onClose={closeSlideOver}
        mode={mode}
        onModeToggle={toggleMode}
      />
      <OpportunityListTutorial />
    </>
  );
};

/**
 * OpportunityListLayout - Renders inside List context to access ListContext
 * Must be a child of <List> to use useListContext() for filter state
 * Note: Breadcrumb is handled by List wrapper (list.tsx) - no longer needed here
 */
const OpportunityListLayout = ({
  view,
  onViewChange,
  openSlideOver,
  isSlideOverOpen,
  slideOverId,
  closeSlideOver,
}: {
  view: OpportunityView;
  onViewChange: (view: OpportunityView) => void;
  openSlideOver: (id: number, mode?: "view" | "edit") => void;
  isSlideOverOpen: boolean;
  slideOverId: number | null;
  closeSlideOver: () => void;
}) => {
  const { data, isPending, filterValues } = useListContext();
  const hasFilters = filterValues && Object.keys(filterValues).length > 0;

  // Monitor stage filter changes and update localStorage preferences
  useEffect(() => {
    if (filterValues?.stage && Array.isArray(filterValues.stage)) {
      saveStagePreferences(filterValues.stage);
    }
  }, [filterValues?.stage]);

  // Show skeleton during loading
  if (isPending) {
    return (
      <StandardListLayout resource="opportunities" filterComponent={<OpportunityListFilter />}>
        <ListSkeleton rows={8} columns={5} />
      </StandardListLayout>
    );
  }

  // Empty state when no data and no filters applied
  if (!data?.length && !hasFilters) {
    return (
      <StandardListLayout resource="opportunities" filterComponent={<OpportunityListFilter />}>
        <OpportunityEmpty>
          <OpportunityArchivedList />
        </OpportunityEmpty>
      </StandardListLayout>
    );
  }

  // Note: Breadcrumb is now handled by the List component wrapper (list.tsx)
  // Use flex column layout so kanban can fill remaining height
  // CRITICAL: h-full + min-h-0 + overflow-hidden enables scroll in child components
  return (
    <StandardListLayout resource="opportunities" filterComponent={<OpportunityListFilter />}>
      {/* Search bar + view toggles row */}
      <div className="flex items-center gap-4 mb-4">
        <div className="flex-1">
          <ListSearchBar
            placeholder="Search opportunities..."
            filterConfig={OPPORTUNITY_FILTER_CONFIG}
          />
        </div>
        <div className="flex-shrink-0">
          <span data-tutorial="opp-view-switcher">
            <OpportunityViewSwitcher view={view} onViewChange={onViewChange} />
          </span>
        </div>
      </div>
      <div className="flex h-full min-h-0 w-full flex-1 flex-col overflow-hidden">
        {view === "kanban" ? (
          <OpportunityListContent
            openSlideOver={openSlideOver}
            slideOverId={slideOverId}
            closeSlideOver={closeSlideOver}
          />
        ) : view === "campaign" ? (
          <CampaignGroupedList openSlideOver={openSlideOver} />
        ) : (
          <OpportunityRowListView openSlideOver={openSlideOver} isSlideOverOpen={isSlideOverOpen} />
        )}
        <OpportunityArchivedList />
      </div>
    </StandardListLayout>
  );
};

export default OpportunityList;
