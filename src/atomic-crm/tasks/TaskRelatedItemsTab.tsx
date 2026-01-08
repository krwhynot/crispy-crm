import { RecordContextProvider } from "ra-core";
import { ReferenceField } from "@/components/admin/reference-field";
import { TextField } from "@/components/admin/text-field";
import { Card, CardContent } from "@/components/ui/card";
import { SidepaneSection, SidepaneEmptyState } from "@/components/layouts/sidepane";
import { SaleName } from "../sales/SaleName";
import { Building2, UserCircle, Target } from "lucide-react";
import type { Task } from "../types";
import { contactOptionText } from "../contacts/ContactOption";

interface TaskRelatedItemsTabProps {
  record: Task;
  mode: "view" | "edit";
}

/**
 * Related Items tab for TaskSlideOver.
 *
 * Read-only tab showing:
 * - Related Organization (if organization_id exists)
 * - Related Contact (if contact_id exists)
 * - Related Opportunity (if opportunity_id exists)
 * - Assigned Sales Rep (if sales_id exists)
 *
 * No edit mode - relationships are edited in Details tab.
 */
export function TaskRelatedItemsTab({ record }: TaskRelatedItemsTabProps) {
  const hasRelationships =
    record.organization_id || record.contact_id || record.opportunity_id || record.sales_id;

  return (
    <RecordContextProvider value={record}>
      <div className="space-y-6">
        {!hasRelationships && (
          <SidepaneEmptyState message="No related items. Add relationships in the Details tab." />
        )}

        {/* Related Organization */}
        {record.organization_id && (
          <SidepaneSection label="Related Organization">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Building2 className="size-5 text-muted-foreground" />
                  <ReferenceField source="organization_id" reference="organizations" link="show">
                    <TextField source="name" className="font-medium" />
                  </ReferenceField>
                </div>
              </CardContent>
            </Card>
          </SidepaneSection>
        )}

        {/* Related Contact */}
        {record.contact_id && (
          <SidepaneSection label="Related Contact">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <UserCircle className="size-5 text-muted-foreground" />
                  <ReferenceField source="contact_id" reference="contacts_summary" link="show">
                    <TextField source={contactOptionText} className="font-medium" />
                  </ReferenceField>
                </div>
              </CardContent>
            </Card>
          </SidepaneSection>
        )}

        {/* Related Opportunity */}
        {record.opportunity_id && (
          <SidepaneSection label="Related Opportunity">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Target className="size-5 text-muted-foreground" />
                  <ReferenceField source="opportunity_id" reference="opportunities" link="show">
                    <TextField source="title" className="font-medium" />
                  </ReferenceField>
                </div>
              </CardContent>
            </Card>
          </SidepaneSection>
        )}

        {/* Assigned Sales Rep */}
        {record.sales_id && (
          <SidepaneSection label="Assigned To">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Building2 className="size-5 text-muted-foreground" />
                  <ReferenceField source="sales_id" reference="sales" link={false}>
                    <SaleName />
                  </ReferenceField>
                </div>
              </CardContent>
            </Card>
          </SidepaneSection>
        )}
      </div>
    </RecordContextProvider>
  );
}
