import { Building2 } from "lucide-react";
import { RecordContextProvider, useGetList } from "ra-core";
import { ReferenceField } from "@/components/ra-wrappers/reference-field";
import { TextField } from "@/components/ra-wrappers/text-field";
import { DateField } from "@/components/ra-wrappers/date-field";
import { Card, CardContent } from "@/components/ui/card";
import { AsideSection } from "@/components/ui";
import { SidepaneEmptyState, EMPTY_STATE_CONTENT } from "@/components/layouts/sidepane";
import { DEFAULT_PAGE_SIZE } from "@/atomic-crm/constants/appConstants";

interface Product {
  id: number;
  name: string;
  principal_id: number;
  created_at?: string | null;
  updated_at?: string | null;
}

interface ProductRelationshipsTabProps {
  record: Product;
  mode: "view" | "edit";
}

/**
 * Relationships tab for ProductSlideOver.
 *
 * **Read-only tab** showing:
 * - Principal Organization (if exists)
 * - Related Opportunities (opportunities using this product)
 * - Created/Updated timestamps
 *
 * No edit mode - relationships are managed via Details tab or opportunity forms.
 */
export function ProductRelationshipsTab({ record }: ProductRelationshipsTabProps) {
  // Fetch opportunities that include this product
  const { data: opportunityProducts, isLoading: isLoadingOpportunities } = useGetList(
    "opportunity_products",
    {
      filter: { product_id_reference: record.id },
      pagination: { page: 1, perPage: DEFAULT_PAGE_SIZE },
      sort: { field: "created_at", order: "DESC" },
    }
  );

  return (
    <RecordContextProvider value={record}>
      <div className="space-y-6">
        {/* Principal Organization */}
        {record.principal_id && (
          <AsideSection title="Principal/Supplier">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Building2 className="size-4 text-muted-foreground" />
                  <ReferenceField source="principal_id" reference="organizations" link="show">
                    <TextField source="name" className="font-medium" />
                  </ReferenceField>
                </div>
              </CardContent>
            </Card>
          </AsideSection>
        )}

        {/* Related Opportunities */}
        <AsideSection title="Related Opportunities">
          <Card>
            <CardContent className="p-4">
              {isLoadingOpportunities && (
                <div className="text-sm text-muted-foreground">Loading opportunities...</div>
              )}

              {!isLoadingOpportunities &&
                (!opportunityProducts || opportunityProducts.length === 0) && (
                  <SidepaneEmptyState
                    title={EMPTY_STATE_CONTENT.relationships.title}
                    description={EMPTY_STATE_CONTENT.relationships.description}
                  />
                )}

              {!isLoadingOpportunities && opportunityProducts && opportunityProducts.length > 0 && (
                <div className="space-y-2">
                  {opportunityProducts.map(
                    (oppProduct: {
                      id: number | string;
                      opportunity_id: number;
                      notes?: string;
                    }) => (
                      <div
                        key={oppProduct.id}
                        className="border-b border-border pb-2 last:border-0 last:pb-0"
                      >
                        <RecordContextProvider value={oppProduct}>
                          <ReferenceField
                            source="opportunity_id"
                            reference="opportunities"
                            link="show"
                          >
                            <TextField source="name" className="text-sm font-medium" />
                          </ReferenceField>
                          {oppProduct.notes && (
                            <p className="text-xs text-muted-foreground mt-1">{oppProduct.notes}</p>
                          )}
                        </RecordContextProvider>
                      </div>
                    )
                  )}
                  {opportunityProducts.length > 5 && (
                    <div className="text-xs text-muted-foreground pt-2">
                      Showing {opportunityProducts.length} opportunit
                      {opportunityProducts.length === 1 ? "y" : "ies"}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </AsideSection>

        {/* Metadata */}
        <AsideSection title="Metadata">
          <div className="space-y-2">
            {record.created_at && (
              <div className="text-sm">
                <span className="text-muted-foreground">Created on </span>
                <DateField
                  source="created_at"
                  options={{ year: "numeric", month: "long", day: "numeric" }}
                />
              </div>
            )}

            {record.updated_at && (
              <div className="text-sm">
                <span className="text-muted-foreground">Last updated on </span>
                <DateField
                  source="updated_at"
                  options={{ year: "numeric", month: "long", day: "numeric" }}
                />
              </div>
            )}
          </div>
        </AsideSection>
      </div>
    </RecordContextProvider>
  );
}
