import {
  AutocompleteInput,
  CreateButton,
  ExportButton,
  List,
  ReferenceInput,
  FilterButton,
  SearchInput,
  SelectInput,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbPage,
} from "@/components/admin";
import {
  Translate,
  useGetIdentity,
  useListContext,
  useGetResourceLabel,
} from "ra-core";
import { Link } from "react-router-dom";

import { useConfigurationContext } from "../root/ConfigurationContext";
import { TopToolbar } from "../layout/TopToolbar";
import { OpportunityArchivedList } from "./OpportunityArchivedList";
import { OpportunityEmpty } from "./OpportunityEmpty";
import { OpportunityListContent } from "./OpportunityListContent";
import { OnlyMineInput } from "./OnlyMineInput";
import { OPPORTUNITY_STAGE_CHOICES } from "./stageConstants";

const OpportunityList = () => {
  const { identity } = useGetIdentity();
  const getResourceLabel = useGetResourceLabel();
  const resourceLabel = getResourceLabel("opportunities", 2);
  const { opportunityCategories } = useConfigurationContext();

  if (!identity) return null;

  const opportunityFilters = [
    <SearchInput source="q" alwaysOn />,
    <ReferenceInput source="customer_organization_id" reference="organizations">
      <AutocompleteInput label={false} placeholder="Customer Organization" />
    </ReferenceInput>,
    <SelectInput
      source="category"
      emptyText="Category"
      choices={opportunityCategories.map((type) => ({ id: type, name: type }))}
    />,
    <SelectInput
      source="priority"
      emptyText="Priority"
      choices={[
        { id: 'low', name: 'Low' },
        { id: 'medium', name: 'Medium' },
        { id: 'high', name: 'High' },
        { id: 'critical', name: 'Critical' }
      ]}
    />,
    <SelectInput
      source="stage"
      emptyText="Stage"
      choices={OPPORTUNITY_STAGE_CHOICES}
    />,
    <OnlyMineInput source="sales_id" alwaysOn />,
  ];

  return (
    <List
      perPage={100}
      filter={{
        "deleted_at@is": null,
      }}
      title={false}
      sort={{ field: "index", order: "DESC" }}
      filters={opportunityFilters}
      actions={<OpportunityActions />}
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
      <OpportunityLayout />
    </List>
  );
};

const OpportunityLayout = () => {
  const { data, isPending, filterValues } = useListContext();
  const hasFilters = filterValues && Object.keys(filterValues).length > 0;

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
      <OpportunityListContent />
      <OpportunityArchivedList />
    </div>
  );
};

const OpportunityActions = () => {
  return (
    <TopToolbar>
      <FilterButton />
      <ExportButton />
      <CreateButton label="New Opportunity" />
    </TopToolbar>
  );
};

export default OpportunityList;