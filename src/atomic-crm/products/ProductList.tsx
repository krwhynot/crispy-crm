import { useListContext } from "ra-core";
import { CreateButton } from "@/components/admin/create-button";
import { ExportButton } from "@/components/admin/export-button";
import { List } from "@/components/admin/list";
import { ListPagination } from "@/components/admin/list-pagination";
import { SortButton } from "@/components/admin/sort-button";
import { TopToolbar } from "../layout/TopToolbar";
import { ProductListFilter } from "./ProductListFilter";
import { ProductGridList } from "./ProductGridList";
import { ProductEmpty } from "./ProductEmpty";

export const ProductList = () => {
  return (
    <List
      title={false}
      perPage={25}
      sort={{ field: "name", order: "ASC" }}
      actions={<ProductListActions />}
      pagination={<ListPagination rowsPerPageOptions={[10, 25, 50, 100]} />}
    >
      <ProductListLayout />
    </List>
  );
};

const ProductListLayout = () => {
  const { data, isPending, filterValues } = useListContext();
  const hasFilters = filterValues && Object.keys(filterValues).length > 0;

  if (isPending) return null;
  if (!data?.length && !hasFilters) return <ProductEmpty />;

  return (
    <div className="w-full flex flex-row gap-8">
      <ProductListFilter />
      <div className="flex flex-col flex-1 gap-4">
        <ProductGridList />
      </div>
    </div>
  );
};

const ProductListActions = () => {
  return (
    <TopToolbar>
      <SortButton fields={["name", "created_at", "list_price", "sku"]} />
      <ExportButton />
      <CreateButton label="New Product" />
    </TopToolbar>
  );
};

export default ProductList;