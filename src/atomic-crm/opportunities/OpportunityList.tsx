import { useEffect, useState } from "react";
import { CreateButton } from "@/components/admin/create-button";
import { ExportButton } from "@/components/admin/export-button";
import { List } from "@/components/admin/list";
import { FilterButton } from "@/components/admin/filter-form";
import { Breadcrumb, BreadcrumbItem, BreadcrumbPage } from "@/components/admin/breadcrumb";

import {
  Translate,
  useGetIdentity,
  useListContext,
  useGetResourceLabel,
} from "ra-core";
import { Link } from "react-router-dom";

import { TopToolbar } from "../layout/TopToolbar";
import { OpportunityArchivedList } from "./OpportunityArchivedList";
import { OpportunityEmpty } from "./OpportunityEmpty";
import { OpportunityListContent } from "./OpportunityListContent";
import { OpportunityRowListView } from "./OpportunityRowListView";
import { OpportunityViewSwitcher, type OpportunityView } from "./OpportunityViewSwitcher";
import { FilterChipsPanel } from "../filters/FilterChipsPanel";
import { useOpportunityFilters } from "../filters/useOpportunityFilters";
import { saveStagePreferences } from "../filters/opportunityStagePreferences";

// Helper functions for view preference persistence
const OPPORTUNITY_VIEW_KEY = 'opportunity.view.preference';

const getViewPreference = (): OpportunityView => {
  const saved = localStorage.getItem(OPPORTUNITY_VIEW_KEY);
  return (saved === 'list' || saved === 'kanban') ? saved : 'kanban';
};

const saveViewPreference = (view: OpportunityView) => {
  localStorage.setItem(OPPORTUNITY_VIEW_KEY, view);
};

const OpportunityList = () => {
  const { identity } = useGetIdentity();
  const getResourceLabel = useGetResourceLabel();
  const resourceLabel = getResourceLabel("opportunities", 2);
  const opportunityFilters = useOpportunityFilters();
  const [view, setView] = useState<OpportunityView>(getViewPreference);

  const handleViewChange = (newView: OpportunityView) => {
    setView(newView);
    saveViewPreference(newView);
  };

  if (!identity) return null;

  return (
    <List
      perPage={100}
      filter={{
        "deleted_at@is": null,
      }}
      title={false}
      sort={{ field: "created_at", order: "DESC" }}
      filters={opportunityFilters}
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
      <FilterChipsPanel className="mb-4" />
      <OpportunityLayout view={view} />
    </List>
  );
};

const OpportunityLayout = ({ view }: { view: OpportunityView }) => {
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
      {view === 'kanban' ? <OpportunityListContent /> : <OpportunityRowListView />}
      <OpportunityArchivedList />
    </div>
  );
};

const OpportunityActions = ({ view, onViewChange }: { view: OpportunityView; onViewChange: (view: OpportunityView) => void }) => {
  return (
    <TopToolbar>
      <OpportunityViewSwitcher view={view} onViewChange={onViewChange} />
      <FilterButton />
      <ExportButton />
      <CreateButton label="New Opportunity" />
    </TopToolbar>
  );
};

export default OpportunityList;
