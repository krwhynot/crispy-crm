import { useState } from "react";
import { useUpdate, useNotify, RecordContextProvider } from "ra-core";
import { Form } from "react-admin";
import { ReferenceField } from "@/components/admin/reference-field";
import { TextField } from "@/components/admin/text-field";
import { TextInput } from "@/components/admin/text-input";
import { SelectInput } from "@/components/admin/select-input";
import { ReferenceInput } from "@/components/admin/reference-input";
import { AutocompleteInput } from "@/components/admin/autocomplete-input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AsideSection } from "@/components/ui";
import { PRODUCT_STATUSES, PRODUCT_CATEGORIES } from "../validation/products";

interface Product {
  id: number;
  name: string;
  sku: string;
  description?: string | null;
  category: string;
  status: "active" | "discontinued" | "coming_soon";
  principal_id: number;
  distributor_id?: number | null;
  certifications?: string[] | null;
  allergens?: string[] | null;
  ingredients?: string | null;
  nutritional_info?: Record<string, any> | null;
  marketing_description?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  created_by?: number | null;
  updated_by?: number | null;
}

interface ProductDetailsTabProps {
  record: Product;
  mode: "view" | "edit";
  onModeToggle?: () => void;
}

/**
 * Details tab for ProductSlideOver.
 *
 * **View Mode**: Displays core product fields:
 * - Name, SKU
 * - Description
 * - Category (badge)
 * - Status (badge with semantic colors)
 * - Principal Organization (link)
 *
 * **Edit Mode**: Full form with save/cancel buttons
 */
export function ProductDetailsTab({ record, mode, onModeToggle }: ProductDetailsTabProps) {
  const [update] = useUpdate();
  const notify = useNotify();
  const [isSaving, setIsSaving] = useState(false);

  // Handle save in edit mode
  const handleSave = async (data: Partial<Product>) => {
    setIsSaving(true);
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
    } finally {
      setIsSaving(false);
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
          <div className="space-y-6">
            <div className="space-y-4">
              <TextInput source="name" label="Product Name" />
              <TextInput source="sku" label="SKU" />
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
      <div className="space-y-6">
        {/* Product Info Section */}
        <AsideSection title="Product Details">
          <Card>
            <CardContent className="p-4 space-y-3">
              <div>
                <h3 className="text-lg font-semibold">{record.name}</h3>
                {record.sku && <p className="text-sm text-muted-foreground">SKU: {record.sku}</p>}
              </div>

              {record.description && (
                <div>
                  <p className="text-sm whitespace-pre-wrap">{record.description}</p>
                </div>
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
            </CardContent>
          </Card>
        </AsideSection>

        {/* Principal Section */}
        <AsideSection title="Principal/Supplier">
          <Card>
            <CardContent className="p-4">
              <ReferenceField source="principal_id" reference="organizations" link="show">
                <TextField source="name" className="font-medium" />
              </ReferenceField>
            </CardContent>
          </Card>
        </AsideSection>
      </div>
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
