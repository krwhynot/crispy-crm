import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { opportunityExporter } from "./opportunityExporter";
import { List } from "@/components/ra-wrappers/list";
import { ListPagination } from "@/components/ra-wrappers/list-pagination";
import { QuickAddButton } from "./QuickAddButton";
import { ListPageLayout } from "@/components/layouts/ListPageLayout";
import { ListSkeleton } from "@/components/ui/list-skeleton";

import { useGetIdentity, useListContext } from "ra-core";

import { OpportunityArchivedList } from "./OpportunityArchivedList";
import { OpportunityEmpty } from "./OpportunityEmpty";
import { OpportunityListContent } from "./kanban";
import { OpportunityRowListView } from "./OpportunityRowListView";
import { CampaignGroupedList } from "./CampaignGroupedList";
import { PrincipalGroupedList } from "./PrincipalGroupedList";
import { OpportunityViewSwitcher, type OpportunityView } from "./OpportunityViewSwitcher";
import { saveStagePreferences } from "../filters/opportunityStagePreferences";
import { useSlideOverState } from "@/hooks/useSlideOverState";
import { OpportunitySlideOver } from "./OpportunitySlideOver";
import { OpportunityListFilter } from "./OpportunityListFilter";
import { OPPORTUNITY_FILTER_CONFIG } from "./opportunityFilterConfig";

import { ListNoResults } from "@/components/ra-wrappers/ListNoResults";
import { ExportMenuItem } from "@/components/ra-wrappers/export-menu-item";
import { SORT_BY_CREATED_DESC, FILTER_ACTIVE_RECORDS } from "@/atomic-crm/constants/listDefaults";

// Helper functions for view preference persistence
const OPPORTUNITY_VIEW_KEY = "opportunity.view.preference";

const getViewPreference = (): OpportunityView => {
  const saved = localStorage.getItem(OPPORTUNITY_VIEW_KEY);
  return saved === "list" || saved === "kanban" || saved === "campaign" || saved === "principal"
    ? saved
    : "kanban";
};

const saveViewPreference = (view: OpportunityView) => {
  localStorage.setItem(OPPORTUNITY_VIEW_KEY, view);
};

// Valid view options (module-scoped for stable reference in useEffect deps)
const validViews: OpportunityView[] = ["kanban", "list", "campaign", "principal"];

const OpportunityList = () => {
  const { data: identity, isPending: isIdentityPending } = useGetIdentity();
  const [searchParams, setSearchParams] = useSearchParams();

  // Check for URL param (from /opportunities/kanban redirect or direct link)
  const urlView = searchParams.get("view") as OpportunityView | null;

  const [view, setView] = useState<OpportunityView>(() => {
    // URL param takes precedence over localStorage
    if (urlView && validViews.includes(urlView)) {
      return urlView;
    }
    return getViewPreference();
  });

  // Clear URL param after reading (prevents stale state on refresh)
  useEffect(() => {
    if (urlView && validViews.includes(urlView)) {
      searchParams.delete("view");
      setSearchParams(searchParams, { replace: true });
      saveViewPreference(urlView);
    }
  }, [urlView, searchParams, setSearchParams]);

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
      <div>
        <List
          perPage={25}
          filter={FILTER_ACTIVE_RECORDS}
          title={false}
          sort={SORT_BY_CREATED_DESC}
          actions={false}
          exporter={opportunityExporter}
          pagination={<ListPagination rowsPerPageOptions={[10, 25, 50]} />}
        >
          <ListPageLayout
            resource="opportunities"
            filterComponent={<OpportunityListFilter />}
            filterConfig={OPPORTUNITY_FILTER_CONFIG}
            sortFields={["name", "stage", "priority", "estimated_close_date", "created_at"]}
            searchPlaceholder="Search opportunities..."
            enableRecentSearches
            viewSwitcher={
              <span>
                <OpportunityViewSwitcher view={view} onViewChange={handleViewChange} />
              </span>
            }
            overflowActions={<ExportMenuItem />}
            primaryAction={<QuickAddButton />}
            emptyState={
              <OpportunityEmpty>
                <OpportunityArchivedList />
              </OpportunityEmpty>
            }
            filteredEmptyState={
              <>
                <ListNoResults />
                <OpportunityArchivedList />
              </>
            }
            loadingSkeleton={<ListSkeleton rows={8} columns={5} />}
          >
            <OpportunityListViews
              view={view}
              openSlideOver={openSlideOver}
              isSlideOverOpen={isOpen}
              slideOverId={slideOverId}
              closeSlideOver={closeSlideOver}
            />
          </ListPageLayout>
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
    </>
  );
};

/**
 * OpportunityListViews - Renders the active view (kanban/list/campaign/principal)
 * inside ListPageLayout. Handles stage filter persistence and archived list.
 *
 * CRITICAL: h-full + min-h-0 + overflow-hidden enables scroll in child components
 */
const OpportunityListViews = ({
  view,
  openSlideOver,
  isSlideOverOpen,
  slideOverId,
  closeSlideOver,
}: {
  view: OpportunityView;
  openSlideOver: (id: number, mode?: "view" | "edit") => void;
  isSlideOverOpen: boolean;
  slideOverId: number | null;
  closeSlideOver: () => void;
}) => {
  const { filterValues } = useListContext();

  // Monitor stage filter changes and update localStorage preferences
  useEffect(() => {
    if (filterValues?.stage && Array.isArray(filterValues.stage)) {
      saveStagePreferences(filterValues.stage);
    }
  }, [filterValues?.stage]);

  return (
    <div className="flex h-full min-h-0 w-full flex-1 flex-col overflow-hidden">
      {view === "kanban" ? (
        <OpportunityListContent
          openSlideOver={openSlideOver}
          slideOverId={slideOverId}
          closeSlideOver={closeSlideOver}
        />
      ) : view === "campaign" ? (
        <CampaignGroupedList openSlideOver={openSlideOver} />
      ) : view === "principal" ? (
        <PrincipalGroupedList openSlideOver={openSlideOver} />
      ) : (
        <OpportunityRowListView openSlideOver={openSlideOver} isSlideOverOpen={isSlideOverOpen} />
      )}
      <OpportunityArchivedList />
    </div>
  );
};

export default OpportunityList;
