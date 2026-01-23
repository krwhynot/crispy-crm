import { useRef } from "react";
import { useUpdate, useNotify, RecordContextProvider } from "ra-core";
import { useQueryClient } from "@tanstack/react-query";
import { useFormContext } from "react-hook-form";
import { Form } from "react-admin";
import { productKeys } from "@/atomic-crm/queryKeys";
import { ReferenceField } from "@/components/ra-wrappers/reference-field";
import { TextField } from "@/components/ra-wrappers/text-field";
import { TextInput } from "@/components/ra-wrappers/text-input";
import { SelectInput } from "@/components/ra-wrappers/select-input";
import { ReferenceInput } from "@/components/ra-wrappers/reference-input";
import { AutocompleteInput } from "@/components/ra-wrappers/autocomplete-input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  SidepaneSection,
  SidepaneMetadata,
  DirtyStateTracker,
} from "@/components/layouts/sidepane";
import { PRODUCT_STATUSES, PRODUCT_CATEGORIES } from "../validation/products";
import { formatFieldLabel } from "@/atomic-crm/utils";

const DISTRIBUTOR_CODE_LABELS: Record<string, string> = {
  usf_code: "US Foods",
  sysco_code: "Sysco",
  gfs_code: "GFS",
  pfg_code: "PFG",
  greco_code: "Greco",
  gofo_code: "GOFO",
  rdp_code: "RDP",
  wilkens_code: "Wilkens",
};

interface Product {
  id: number;
  name: string;
  description?: string | null;
  category: string;
  status: "active" | "discontinued" | "coming_soon";
  principal_id: number;
  certifications?: string[] | null;
  allergens?: string[] | null;
  ingredients?: string | null;
  nutritional_info?: Record<string, any> | null;
  marketing_description?: string | null;
  usf_code?: string | null;
  sysco_code?: string | null;
  gfs_code?: string | null;
  pfg_code?: string | null;
  greco_code?: string | null;
  gofo_code?: string | null;
  rdp_code?: string | null;
  wilkens_code?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  created_by?: number | null;
  updated_by?: number | null;
}

interface ProductDetailsTabProps {
  record: Product;
  mode: "view" | "edit";
  onModeToggle?: () => void;
  onDirtyChange?: (isDirty: boolean) => void;
}

/**
 * Helper component that must be rendered INSIDE a Form to access form context.
 * Uses a ref to expose getValues() to the parent component's handleSave.
 */
function FormValuesProvider({
  getValuesRef,
  onDirtyChange,
}: {
  getValuesRef: React.MutableRefObject<(() => Record<string, unknown>) | null>;
  onDirtyChange?: (isDirty: boolean) => void;
}) {
  const { getValues } = useFormContext();
  getValuesRef.current = getValues;
  return <DirtyStateTracker onDirtyChange={onDirtyChange} />;
}

function hasDistributorCodes(record: Record<string, unknown>): boolean {
  return Object.keys(DISTRIBUTOR_CODE_LABELS).some((key) => record[key as keyof typeof record]);
}

/**
 * Details tab for ProductSlideOver.
 *
 * **View Mode**: Displays core product fields:
 * - Name
 * - Description
 * - Category (badge)
 * - Status (badge with semantic colors)
 * - Principal Organization (link)
 *
 * **Edit Mode**: Full form with save/cancel buttons
 */
export function ProductDetailsTab({
  record,
  mode,
  onModeToggle,
  onDirtyChange,
}: ProductDetailsTabProps) {
  const [update] = useUpdate();
  const notify = useNotify();
  const queryClient = useQueryClient();
  // Ref to access form's getValues() from outside the Form context
  const getValuesRef = useRef<(() => Record<string, unknown>) | null>(null);

  // Handle save in edit mode
  const handleSave = async (formData: Partial<Product>) => {
    try {
      // Get ALL current form values using the ref (not just dirty fields)
      const allFormValues = getValuesRef.current?.() ?? formData;
      const completeData = { ...allFormValues };

      await update("products", {
        id: record.id,
        data: completeData,
        previousData: record,
      });
      queryClient.invalidateQueries({ queryKey: productKeys.all });
      notify("Product updated successfully", { type: "success" });
      onModeToggle?.();
    } catch (error: unknown) {
      notify("Error updating product", { type: "error" });
      console.error("Save error:", error);
    }
  };

  if (mode === "edit") {
    // Transform categories and statuses for SelectInput
    const productCategories = PRODUCT_CATEGORIES.map((category) => ({
      id: category,
      name: formatFieldLabel(category),
    }));

    const productStatuses = PRODUCT_STATUSES.map((status) => ({
      id: status,
      name: formatFieldLabel(status),
    }));

    const handleCreateCategory = (categoryName?: string) => {
      if (!categoryName) return;
      return { id: categoryName, name: categoryName };
    };

    return (
      <RecordContextProvider value={record}>
        <Form id="slide-over-edit-form" onSubmit={handleSave} record={record}>
          <FormValuesProvider getValuesRef={getValuesRef} onDirtyChange={onDirtyChange} />
          <div className="space-y-6">
            <div className="space-y-4">
              <TextInput source="name" label="Product Name" />
              <TextInput source="description" label="Description" multiline rows={3} />

              <AutocompleteInput
                source="category"
                label="Category"
                choices={productCategories}
                onCreate={handleCreateCategory}
                createItemLabel="Add custom category: %{item}"
              />

              <SelectInput source="status" label="Status" choices={productStatuses} />

              <ReferenceInput
                source="principal_id"
                reference="organizations"
                label="Principal/Supplier"
                filter={{ organization_type: "principal" }}
              >
                <AutocompleteInput optionText="name" />
              </ReferenceInput>
            </div>
          </div>
        </Form>
      </RecordContextProvider>
    );
  }

  // View mode - display all product fields
  return (
    <RecordContextProvider value={record}>
      <ScrollArea className="h-full">
        <div className="px-6 py-4">
          {/* Product Info Section */}
          <SidepaneSection label="Product">
            <div className="space-y-3">
              <h3 className="text-lg font-semibold">{record.name}</h3>

              {record.description && (
                <p className="text-sm whitespace-pre-wrap">{record.description}</p>
              )}

              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Category:</span>
                <Badge variant="outline">{formatFieldLabel(record.category)}</Badge>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Status:</span>
                <StatusBadge status={record.status} />
              </div>
            </div>
          </SidepaneSection>

          {/* Principal Section - uses variant="list" for relationship card */}
          <SidepaneSection label="Principal/Supplier" variant="list" showSeparator>
            <div className="p-2">
              <ReferenceField source="principal_id" reference="organizations" link="show">
                <TextField source="name" className="font-medium" />
              </ReferenceField>
            </div>
          </SidepaneSection>

          {/* Distributor Codes Section */}
          {hasDistributorCodes(record) && (
            <SidepaneSection label="Distributor Codes" showSeparator>
              <div className="grid grid-cols-2 gap-2 p-3 bg-muted/50 rounded-md">
                {Object.entries(DISTRIBUTOR_CODE_LABELS).map(([field, label]) => {
                  const value = record[field as keyof typeof record];
                  if (!value) return null;
                  return (
                    <div key={field} className="flex justify-between">
                      <span className="text-sm text-muted-foreground">{label}:</span>
                      <span className="text-sm font-mono">{value}</span>
                    </div>
                  );
                })}
              </div>
            </SidepaneSection>
          )}

          {/* Metadata - created/updated timestamps */}
          <SidepaneMetadata createdAt={record.created_at} updatedAt={record.updated_at} />
        </div>
      </ScrollArea>
    </RecordContextProvider>
  );
}

/**
 * StatusBadge - Display product status with semantic colors
 */
function StatusBadge({ status }: { status: string }) {
  let variant: "default" | "secondary" | "destructive" | "outline" = "default";

  switch (status) {
    case "active":
      variant = "default";
      break;
    case "discontinued":
      variant = "destructive";
      break;
    case "coming_soon":
      variant = "secondary";
      break;
    default:
      variant = "outline";
  }

  return <Badge variant={variant}>{formatFieldLabel(status)}</Badge>;
}
