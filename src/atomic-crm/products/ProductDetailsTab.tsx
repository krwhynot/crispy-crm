import { useUpdate, useNotify, RecordContextProvider } from "ra-core";
import { Form } from "react-admin";
import { ReferenceField } from "@/components/admin/reference-field";
import { TextField } from "@/components/admin/text-field";
import { TextInput } from "@/components/admin/text-input";
import { SelectInput } from "@/components/admin/select-input";
import { ReferenceInput } from "@/components/admin/reference-input";
import { AutocompleteInput } from "@/components/admin/autocomplete-input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  SidepaneSection,
  SidepaneMetadata,
  DirtyStateTracker,
} from "@/components/layouts/sidepane";
import { PRODUCT_STATUSES, PRODUCT_CATEGORIES } from "../validation/products";

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

  // Handle save in edit mode
  const handleSave = async (data: Partial<Product>) => {
    try {
      await update("products", {
        id: record.id,
        data,
        previousData: record,
      });
      notify("Product updated successfully", { type: "success" });
      onModeToggle?.(); // Return to view mode after successful save
    } catch (error) {
      notify("Error updating product", { type: "error" });
      console.error("Save error:", error);
    }
  };

  if (mode === "edit") {
    // Transform categories and statuses for SelectInput
    const productCategories = PRODUCT_CATEGORIES.map((category) => ({
      id: category,
      name: category
        .split("_")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" "),
    }));

    const productStatuses = PRODUCT_STATUSES.map((status) => ({
      id: status,
      name: status
        .split("_")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" "),
    }));

    const handleCreateCategory = (categoryName?: string) => {
      if (!categoryName) return;
      return { id: categoryName, name: categoryName };
    };

    return (
      <RecordContextProvider value={record}>
        <Form id="slide-over-edit-form" onSubmit={handleSave} record={record}>
          <DirtyStateTracker onDirtyChange={onDirtyChange} />
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
                <Badge variant="outline">
                  {record.category
                    .split("_")
                    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                    .join(" ")}
                </Badge>
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

  return (
    <Badge variant={variant}>
      {status
        .split("_")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ")}
    </Badge>
  );
}
