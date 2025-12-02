import { useEffect, useState } from "react";
import { CreateButton } from "@/components/admin/create-button";
import { ExportButton } from "@/components/admin/export-button";
import { List } from "@/components/admin/list";
import { Breadcrumb, BreadcrumbItem, BreadcrumbPage } from "@/components/admin/breadcrumb";
import { FloatingCreateButton } from "@/components/admin/FloatingCreateButton";
import { QuickAddButton } from "./quick-add/QuickAddButton";
import { StandardListLayout } from "@/components/layouts/StandardListLayout";
import { ListSkeleton } from "@/components/ui/list-skeleton";

import { Translate, useGetIdentity, useListContext, useGetResourceLabel } from "ra-core";
import { Link } from "react-router-dom";

import { TopToolbar } from "../layout/TopToolbar";
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
import { OpportunityListFilter } from "./OpportunityListFilter";

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
  const getResourceLabel = useGetResourceLabel();
  const resourceLabel = getResourceLabel("opportunities", 2);
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
      <StandardListLayout filterComponent={<OpportunityListFilter />}>
        <List
          perPage={100}
          filter={{
            "deleted_at@is": null,
          }}
          title={false}
          sort={{ field: "created_at", order: "DESC" }}
          actions={<OpportunityActions view={view} onViewChange={handleViewChange} />}
          pagination={null}
        >
          <Breadcrumb>
            <BreadcrumbItem>
              <Link to="/">
                <Translate i18nKey="ra.page.dashboard">Home</Translate>
              </Link>
            </BreadcrumbItem>
            <BreadcrumbPage>{resourceLabel}</BreadcrumbPage>
          </Breadcrumb>
          <OpportunityLayout view={view} openSlideOver={openSlideOver} isSlideOverOpen={isOpen} />
          <FloatingCreateButton />
        </List>
      </StandardListLayout>

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

const OpportunityLayout = ({
  view,
  openSlideOver,
  isSlideOverOpen,
}: {
  view: OpportunityView;
  openSlideOver: (id: number, mode?: "view" | "edit") => void;
  isSlideOverOpen: boolean;
}) => {
  const { data, isPending, filterValues } = useListContext();
  const hasFilters = filterValues && Object.keys(filterValues).length > 0;

  // Monitor stage filter changes and update localStorage preferences
  useEffect(() => {
    if (filterValues?.stage && Array.isArray(filterValues.stage)) {
      saveStagePreferences(filterValues.stage);
    }
  }, [filterValues?.stage]);

  if (isPending) return null;
  if (!data?.length && !hasFilters)
    return (
      <>
        <OpportunityEmpty>
          <OpportunityArchivedList />
        </OpportunityEmpty>
      </>
    );

  return (
    <div className="w-full">
      {view === "kanban" ? (
        <OpportunityListContent openSlideOver={openSlideOver} />
      ) : view === "campaign" ? (
        <CampaignGroupedList openSlideOver={openSlideOver} />
      ) : (
        <OpportunityRowListView openSlideOver={openSlideOver} isSlideOverOpen={isSlideOverOpen} />
      )}
      <OpportunityArchivedList />
    </div>
  );
};

const OpportunityActions = ({
  view,
  onViewChange,
}: {
  view: OpportunityView;
  onViewChange: (view: OpportunityView) => void;
}) => {
  return (
    <TopToolbar>
      <OpportunityViewSwitcher view={view} onViewChange={onViewChange} />
      <ExportButton />
      <QuickAddButton />
      <CreateButton label="New Opportunity" />
    </TopToolbar>
  );
};

export default OpportunityList;
