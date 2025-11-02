import { useListContext } from "ra-core";
import { DataTable } from "@/components/admin/data-table";
import { DateField } from "@/components/admin/date-field";
import { ReferenceField } from "@/components/admin/reference-field";
import { TextField } from "@/components/admin/text-field";
import { Badge } from "@/components/ui/badge";
import { formatDistance } from "date-fns";
import type { Opportunity } from "../types";
import { getOpportunityStageLabel, getStageColor } from "./stageConstants";

export const OpportunityTableView = () => {
  const { data: opportunities, isPending } = useListContext<Opportunity>();

  if (isPending) return null;

  return (
    <DataTable
      data={opportunities}
      bulkActionButtons={false}
      className="bg-card"
    >
      <DataTable.Col
        source="name"
        label="Opportunity"
        render={(record: Opportunity) => (
          <div className="flex flex-col">
            <span className="font-medium">{record.name}</span>
            <div className="flex gap-2 mt-1">
              {record.nb_interactions !== undefined && record.nb_interactions > 0 && (
                <Badge variant="outline" className="text-xs px-1.5 py-0">
                  {record.nb_interactions} interaction{record.nb_interactions !== 1 ? 's' : ''}
                </Badge>
              )}
              {record.last_interaction_date && (
                <span className="text-xs text-muted-foreground">
                  Last: {formatDistance(new Date(record.last_interaction_date), new Date(), { addSuffix: true })}
                </span>
              )}
            </div>
          </div>
        )}
      />

      <DataTable.Col source="customer_organization_id" label="Customer">
        <ReferenceField
          source="customer_organization_id"
          reference="organizations"
          link="show"
        >
          <TextField source="name" />
        </ReferenceField>
      </DataTable.Col>

      <DataTable.Col source="principal_organization_id" label="Principal">
        <ReferenceField
          source="principal_organization_id"
          reference="organizations"
          link={false}
        >
          <TextField source="name" />
        </ReferenceField>
      </DataTable.Col>

      <DataTable.Col
        source="stage"
        label="Stage"
        render={(record: Opportunity) => (
          <Badge
            className={`${getStageColor(record.stage)} border-0`}
          >
            {getOpportunityStageLabel(record.stage)}
          </Badge>
        )}
      />

      <DataTable.Col
        source="priority"
        label="Priority"
        render={(record: Opportunity) => (
          <Badge
            variant={
              record.priority === 'critical' ? 'destructive' :
              record.priority === 'high' ? 'default' :
              record.priority === 'medium' ? 'secondary' :
              'outline'
            }
          >
            {record.priority}
          </Badge>
        )}
      />

      <DataTable.Col source="opportunity_owner_id" label="Owner">
        <ReferenceField
          source="opportunity_owner_id"
          reference="sales"
          link={false}
        >
          <div className="flex flex-col">
            <span className="text-sm">
              <TextField source="first_name" /> <TextField source="last_name" />
            </span>
          </div>
        </ReferenceField>
      </DataTable.Col>

      <DataTable.Col source="estimated_close_date" label="Est. Close">
        <DateField source="estimated_close_date" />
      </DataTable.Col>

      <DataTable.Col
        source="created_at"
        label="Created"
        render={(record: Opportunity) => (
          <span className="text-xs text-muted-foreground">
            {formatDistance(new Date(record.created_at), new Date(), { addSuffix: true })}
          </span>
        )}
      />
    </DataTable>
  );
};