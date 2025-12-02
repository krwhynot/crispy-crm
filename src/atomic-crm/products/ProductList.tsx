import { FunctionField } from "react-admin";
import { List } from "@/components/admin/list";
import { TextField } from "@/components/admin/text-field";
import { ReferenceField } from "@/components/admin/reference-field";
import { CreateButton } from "@/components/admin/create-button";
import { SortButton } from "@/components/admin/sort-button";
import { FloatingCreateButton } from "@/components/admin/FloatingCreateButton";
import { StandardListLayout } from "@/components/layouts/StandardListLayout";
import { PremiumDatagrid } from "@/components/admin/PremiumDatagrid";
import { TopToolbar } from "../layout/TopToolbar";
import { useSlideOverState } from "@/hooks/useSlideOverState";
import { useListKeyboardNavigation } from "@/hooks/useListKeyboardNavigation";
import { useFilterCleanup } from "../hooks/useFilterCleanup";
import { Badge } from "@/components/ui/badge";
import { ProductListFilter } from "./ProductListFilter";
import { ProductSlideOver } from "./ProductSlideOver";

/**
 * ProductListActions - TopToolbar with sort and create actions
 * Follows established pattern from ContactList and OrganizationList
 */
const ProductListActions = () => (
  <TopToolbar>
    <SortButton fields={["name", "sku", "category", "status"]} />
    <CreateButton />
  </TopToolbar>
);

export const ProductList = () => {
  const { slideOverId, isOpen, mode, openSlideOver, closeSlideOver, toggleMode } =
    useSlideOverState();

  // Clean up stale cached filters from localStorage
  useFilterCleanup("products");

  // Keyboard navigation for list rows
  const { focusedIndex } = useListKeyboardNavigation({
    onSelect: (id) => openSlideOver(Number(id), "view"),
    enabled: !isOpen,
  });

  return (
    <>
      <List actions={<ProductListActions />}>
        <StandardListLayout resource="products" filterComponent={<ProductListFilter />}>
          <PremiumDatagrid
            onRowClick={(id) => openSlideOver(Number(id), "view")}
            focusedIndex={focusedIndex}
          >
            <TextField source="name" label="Product Name" />
            <TextField source="sku" label="SKU" />

            <FunctionField
              label="Category"
              render={(record: any) => (
                <Badge variant="outline">
                  {record.category
                    .split("_")
                    .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
                    .join(" ")}
                </Badge>
              )}
            />

            <FunctionField
              label="Status"
              render={(record: any) => <StatusBadge status={record.status} />}
            />

            <ReferenceField
              source="principal_id"
              reference="organizations"
              label="Principal"
              link={false}
            >
              <TextField source="name" />
            </ReferenceField>

            <FunctionField
              label="Certifications"
              render={(record: any) => (
                <div className="flex gap-1 flex-wrap">
                  {record.certifications?.slice(0, 3).map((cert: string, index: number) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {cert}
                    </Badge>
                  ))}
                  {record.certifications && record.certifications.length > 3 && (
                    <Badge variant="secondary" className="text-xs">
                      +{record.certifications.length - 3}
                    </Badge>
                  )}
                </div>
              )}
              cellClassName="hidden lg:table-cell"
              headerClassName="hidden lg:table-cell"
            />
          </PremiumDatagrid>
        </StandardListLayout>
        <FloatingCreateButton />
      </List>
      <ProductSlideOver
        recordId={slideOverId}
        isOpen={isOpen}
        mode={mode}
        onClose={closeSlideOver}
        onModeToggle={toggleMode}
      />
    </>
  );
};

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

export default ProductList;
