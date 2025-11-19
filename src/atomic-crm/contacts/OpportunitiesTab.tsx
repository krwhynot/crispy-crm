import { useShowContext, useGetList, useGetMany } from 'ra-core';
import { Datagrid, FunctionField, ReferenceField, TextField, NumberField, ListContextProvider } from 'react-admin';
import { Link } from 'react-router-dom';
import { StageBadgeWithHealth } from './StageBadgeWithHealth';
import type { Contact } from '../types';

export function OpportunitiesTab() {
  const { record: contact, isPending } = useShowContext<Contact>();

  // Step 1: Fetch junction records
  const { data: junctionRecords, isLoading: junctionLoading } = useGetList(
    'opportunity_contacts',
    {
      filter: { contact_id: contact?.id },
      pagination: { page: 1, perPage: 50 },
      sort: { field: 'created_at', order: 'DESC' }
    },
    { enabled: !!contact?.id }
  );

  // Step 2: Extract opportunity IDs
  const opportunityIds = junctionRecords?.map((jr: any) => jr.opportunity_id) || [];

  // Step 3: Fetch opportunity details using getMany (batch fetch by IDs)
  const { data: opportunities, isLoading: oppsLoading } = useGetMany(
    'opportunities',
    { ids: opportunityIds },
    { enabled: opportunityIds.length > 0 }
  );

  const isLoading = isPending || junctionLoading || oppsLoading;

  if (isPending || !contact) return null;

  if (isLoading) {
    return <div>Loading opportunities...</div>;
  }

  if (!junctionRecords || junctionRecords.length === 0) {
    return <div>No opportunities linked yet</div>;
  }

  // Merge junction data with opportunities
  const linkedOpportunities = junctionRecords.map((junction: any) => {
    const opp = opportunities?.find((o: any) => o.id === junction.opportunity_id);
    return opp ? { ...opp, junctionId: junction.id } : null;
  }).filter(Boolean);

  const listContext = {
    data: linkedOpportunities,
    ids: linkedOpportunities.map((opp: any) => opp.id),
    total: linkedOpportunities.length,
    isLoading: false,
    isFetching: false,
  };

  return (
    <div className="space-y-4">
      <ListContextProvider value={listContext}>
        <Datagrid
          bulkActionButtons={false}
          rowClick={false}
          className="border rounded-lg"
        >
          <FunctionField
            label="Opportunity"
            render={(record: any) => (
              <Link
                to={`/opportunities/${record.id}`}
                className="font-medium text-primary hover:underline"
              >
                {record.name}
              </Link>
            )}
          />

          <ReferenceField
            source="customer_organization_id"
            reference="organizations"
            label="Customer"
          >
            <TextField source="name" />
          </ReferenceField>

          <FunctionField
            label="Stage"
            render={(record: any) => (
              <StageBadgeWithHealth
                stage={record.stage}
                health={record.health_status}
              />
            )}
          />

          <NumberField
            source="amount"
            options={{ style: 'currency', currency: 'USD' }}
          />
        </Datagrid>
      </ListContextProvider>
    </div>
  );
}
