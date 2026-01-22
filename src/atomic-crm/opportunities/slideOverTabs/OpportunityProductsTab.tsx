import { useState } from "react";
import { useGetList, Form, useUpdate, ReferenceArrayInput, useDataProvider } from "react-admin";
import { useSafeNotify } from "@/atomic-crm/hooks/useSafeNotify";
import type { Identifier } from "react-admin";
import { useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { activityKeys } from "@/atomic-crm/queryKeys";
import { AutocompleteArrayInput } from "@/components/ra-wrappers/autocomplete-array-input";
import { AdminButton } from "@/components/admin/AdminButton";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Package } from "lucide-react";
import {
  DirtyStateTracker,
  EMPTY_STATE_CONTENT,
  SidepaneEmptyState,
  SidepaneSection,
} from "@/components/layouts/sidepane";
import {
  AUTOCOMPLETE_DEBOUNCE_MS,
  shouldRenderSuggestions,
} from "@/atomic-crm/utils/autocompleteDefaults";
import { Card } from "@/components/ui/card";
import type { Opportunity } from "@/atomic-crm/types";

interface OpportunityProduct {
  id: Identifier;
  product_id_reference: Identifier;
  notes?: string | null;
  created_at: string;
}

interface ProductRecord {
  id: Identifier;
  name: string;
  category?: string;
}

interface ProductFormData {
  product_ids: Identifier[];
}

interface OpportunityProductsTabProps {
  record: Opportunity;
  mode: "view" | "edit";
  onModeToggle?: () => void;
  onDirtyChange?: (isDirty: boolean) => void;
  /** Whether this tab is currently active - controls data fetching */
  isActiveTab: boolean;
}

export function OpportunityProductsTab({
  record,
  mode,
  onModeToggle,
  onDirtyChange,
  isActiveTab,
}: OpportunityProductsTabProps) {
  const [update] = useUpdate();
  const { success, error: notifyError } = useSafeNotify();
  const dataProvider = useDataProvider();
  const queryClient = useQueryClient();
  const [isSaving, setIsSaving] = useState(false);

  // Fetch junction table data for view mode - only when tab is active AND in view mode
  const { data: junctionRecords, isLoading } = useGetList<OpportunityProduct>(
    "opportunity_products",
    {
      filter: { opportunity_id: record.id },
      pagination: { page: 1, perPage: 100 },
      sort: { field: "created_at", order: "DESC" },
    },
    { enabled: isActiveTab && mode === "view" }
  );

  // Fetch product details for view mode - only when tab is active
  const productIds = junctionRecords?.map((jr) => jr.product_id_reference) || [];
  const { data: products } = useGetList<ProductRecord>(
    "products",
    {
      filter: { id: productIds },
      pagination: { page: 1, perPage: 100 },
    },
    { enabled: isActiveTab && mode === "view" && productIds.length > 0 }
  );

  const handleSave = async (data: ProductFormData) => {
    setIsSaving(true);
    try {
      // Convert product_ids array to products_to_sync format
      const productsToSync = (data.product_ids || []).map((productId) => ({
        product_id_reference: productId,
        notes: null,
      }));

      await update(
        "opportunities",
        {
          id: record.id,
          data: { products_to_sync: productsToSync },
          previousData: record,
        },
        {
          onSuccess: async () => {
            success("Products updated successfully");

            try {
              const productCount = data.product_ids?.length ?? 0;
              const subject =
                productCount === 0
                  ? "Products cleared from opportunity"
                  : `Product lineup updated (${productCount} product${productCount === 1 ? "" : "s"})`;

              await dataProvider.create("activities", {
                data: {
                  activity_type: "interaction",
                  type: "note",
                  subject,
                  activity_date: new Date().toISOString(),
                  opportunity_id: record.id,
                  organization_id: record.customer_organization_id,
                },
              });

              queryClient.invalidateQueries({ queryKey: activityKeys.all });
            } catch (error: unknown) {
              console.error("Failed to create product update activity:", error);
              notifyError(
                error,
                "Failed to log activity. Please manually add a note for this product change."
              );
            }

            if (onModeToggle) {
              onModeToggle();
            }
          },
          onError: (error: Error) => {
            notifyError(error, "Couldn't update products. Please try again.");
          },
        }
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (onModeToggle) {
      onModeToggle();
    }
  };

  if (mode === "edit") {
    // Get current product IDs from junction table
    const currentProductIds = productIds;

    return (
      <Form
        defaultValues={{ product_ids: currentProductIds }}
        onSubmit={handleSave}
        className="space-y-4"
      >
        <DirtyStateTracker onDirtyChange={onDirtyChange} />
        <ReferenceArrayInput source="product_ids" reference="products">
          <AutocompleteArrayInput
            label="Products"
            optionText="name"
            filterToQuery={(searchText: string) => ({ q: searchText })}
            debounce={AUTOCOMPLETE_DEBOUNCE_MS}
            shouldRenderSuggestions={shouldRenderSuggestions}
            helperText="Search and select products for this opportunity"
          />
        </ReferenceArrayInput>

        <div className="flex gap-2 pt-4">
          <AdminButton type="submit" disabled={isSaving} className="flex-1">
            {isSaving ? "Saving..." : "Save Changes"}
          </AdminButton>
          <AdminButton type="button" variant="outline" onClick={handleCancel} disabled={isSaving}>
            Cancel
          </AdminButton>
        </div>
      </Form>
    );
  }

  // View mode
  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />
        ))}
      </div>
    );
  }

  if (!junctionRecords || junctionRecords.length === 0) {
    return (
      <ScrollArea className="h-full">
        <div className="px-6 py-4">
          <SidepaneSection label="Products">
            <SidepaneEmptyState
              title={EMPTY_STATE_CONTENT.products.title}
              description={EMPTY_STATE_CONTENT.products.description}
              action={{
                label: EMPTY_STATE_CONTENT.products.actionLabel,
                onClick: () => onModeToggle?.(),
              }}
            />
          </SidepaneSection>
        </div>
      </ScrollArea>
    );
  }

  // Create a map of junction data by product_id
  const junctionMap = new Map(junctionRecords.map((jr) => [jr.product_id_reference, jr]));

  return (
    <ScrollArea className="h-full">
      <div className="px-6 py-4">
        <SidepaneSection label="Products" variant="list">
          <div className="space-y-2">
            {products?.map((product) => {
              const junctionData = junctionMap.get(product.id);

              return (
                <Card
                  key={product.id}
                  className="p-3 bg-muted/30 border-0 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    {/* Icon */}
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <Package className="w-5 h-5 text-primary" />
                    </div>

                    {/* Product info */}
                    <div className="flex-1 min-w-0">
                      <Link
                        to={`/products?view=${product.id}`}
                        className="text-base font-medium hover:underline block"
                      >
                        {product.name}
                      </Link>

                      {product.category && (
                        <div className="mt-2">
                          <Badge variant="outline" className="text-xs">
                            {product.category}
                          </Badge>
                        </div>
                      )}

                      {junctionData?.notes && (
                        <p className="text-sm text-muted-foreground mt-2 italic">
                          {junctionData.notes}
                        </p>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </SidepaneSection>
      </div>
    </ScrollArea>
  );
}
