import { formatDistance } from "date-fns";
import { Package, DollarSign, Truck, BarChart3 } from "lucide-react";
import {
  RecordContextProvider,
  ShowBase,
  useListContext,
  useRecordContext,
  useShowContext,
} from "ra-core";
import {
  Link as RouterLink,
  useLocation,
  useMatch,
  useNavigate,
} from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ReferenceManyField } from "@/components/admin/reference-many-field";
import { SortButton } from "@/components/admin/sort-button";
import { Badge } from "@/components/ui/badge";

import { ActivityLog } from "../activity/ActivityLog";
import { Status } from "../misc/Status";
import type { Product, Organization } from "../types";
import { ProductAside } from "./ProductAside";

const ProductShow = () => (
  <ShowBase>
    <ProductShowContent />
  </ShowBase>
);

const ProductShowContent = () => {
  const { record, isPending } = useShowContext<Product>();
  const navigate = useNavigate();

  // Get tab from URL or default to "overview"
  const tabMatch = useMatch("/products/:id/show/:tab");
  const currentTab = tabMatch?.params?.tab || "overview";

  const handleTabChange = (value: string) => {
    if (value === currentTab) return;
    if (value === "overview") {
      navigate(`/products/${record?.id}/show`);
      return;
    }
    navigate(`/products/${record?.id}/show/${value}`);
  };

  if (isPending || !record) return null;

  const statusColors: Record<string, string> = {
    active: "default",
    discontinued: "destructive",
    pending: "secondary",
    seasonal: "outline",
    out_of_stock: "destructive",
  };

  return (
    <div>
      <div className="relative flex justify-between mb-8">
        <div className="flex flex-row gap-8 items-start flex-1">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Package className="w-8 h-8 text-primary" />
          </div>
          <div className="flex flex-col flex-1 gap-2">
            <div className="flex items-start gap-3">
              <div className="flex-1">
                <h1 className="text-3xl font-semibold">{record.name}</h1>
                <div className="text-sm text-muted-foreground mt-1">
                  SKU: {record.sku}
                </div>
              </div>
              <div className="flex gap-2">
                {record.status && (
                  <Badge
                    variant={statusColors[record.status] as any}
                    className="text-xs"
                  >
                    {record.status}
                  </Badge>
                )}
                {record.category && (
                  <Badge variant="outline" className="text-xs">
                    {record.category.replace(/_/g, ' ')}
                  </Badge>
                )}
                {record.brand && (
                  <Badge variant="secondary" className="text-xs">
                    {record.brand}
                  </Badge>
                )}
              </div>
            </div>
            {record.description && (
              <p className="text-muted-foreground">{record.description}</p>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2">
          <Tabs value={currentTab} onValueChange={handleTabChange}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="inventory">Inventory</TabsTrigger>
              <TabsTrigger value="activity">Activity</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-6">
              <ProductOverviewTab />
            </TabsContent>

            <TabsContent value="details" className="mt-6">
              <ProductDetailsTab />
            </TabsContent>

            <TabsContent value="inventory" className="mt-6">
              <ProductInventoryTab />
            </TabsContent>

            <TabsContent value="activity" className="mt-6">
              <ProductActivityTab />
            </TabsContent>
          </Tabs>
        </div>

        <div className="col-span-1">
          <ProductAside />
        </div>
      </div>
    </div>
  );
};

const ProductOverviewTab = () => {
  const record = useRecordContext<Product>();
  if (!record) return null;

  return (
    <div className="space-y-6">
      {/* Pricing Card */}
      <Card>
        <CardContent className="pt-6">
          <h3 className="font-medium mb-4 flex items-center gap-2">
            <DollarSign className="w-4 h-4" />
            Pricing Information
          </h3>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">List Price</p>
              <p className="text-lg font-semibold">
                ${record.list_price?.toFixed(2) || "0.00"}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Cost per Unit</p>
              <p className="text-lg font-semibold">
                ${record.cost_per_unit?.toFixed(2) || "0.00"}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Margin</p>
              <p className="text-lg font-semibold">
                {record.list_price && record.cost_per_unit
                  ? `${(
                      ((record.list_price - record.cost_per_unit) /
                        record.list_price) *
                      100
                    ).toFixed(1)}%`
                  : "N/A"}
              </p>
            </div>
          </div>
          {record.map_price && (
            <div className="mt-4 pt-4 border-t">
              <p className="text-sm text-muted-foreground">MAP Price</p>
              <p className="text-lg font-semibold">
                ${record.map_price.toFixed(2)}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Product Information Card */}
      <Card>
        <CardContent className="pt-6">
          <h3 className="font-medium mb-4 flex items-center gap-2">
            <Package className="w-4 h-4" />
            Product Information
          </h3>
          <div className="grid grid-cols-2 gap-4">
            {record.category && (
              <div>
                <p className="text-sm text-muted-foreground">Category</p>
                <p className="font-medium">{record.category.replace(/_/g, ' ')}</p>
              </div>
            )}
            {record.subcategory && (
              <div>
                <p className="text-sm text-muted-foreground">Subcategory</p>
                <p className="font-medium">{record.subcategory}</p>
              </div>
            )}
            {record.brand && (
              <div>
                <p className="text-sm text-muted-foreground">Brand</p>
                <p className="font-medium">{record.brand}</p>
              </div>
            )}
            {record.upc && (
              <div>
                <p className="text-sm text-muted-foreground">UPC</p>
                <p className="font-medium">{record.upc}</p>
              </div>
            )}
            {record.unit_of_measure && (
              <div>
                <p className="text-sm text-muted-foreground">Unit of Measure</p>
                <p className="font-medium">{record.unit_of_measure}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const ProductDetailsTab = () => {
  const record = useRecordContext<Product>();
  if (!record) return null;

  return (
    <div className="space-y-6">
      {/* Description Card */}
      {record.description && (
        <Card>
          <CardContent className="pt-6">
            <h3 className="font-medium mb-4">Description</h3>
            <p className="text-muted-foreground whitespace-pre-wrap">
              {record.description}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Specifications Card */}
      <Card>
        <CardContent className="pt-6">
          <h3 className="font-medium mb-4">Specifications</h3>
          <div className="space-y-3">
            {record.sku && (
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">SKU</span>
                <span className="text-sm font-medium">{record.sku}</span>
              </div>
            )}
            {record.upc && (
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">UPC/Barcode</span>
                <span className="text-sm font-medium">{record.upc}</span>
              </div>
            )}
            {record.unit_of_measure && (
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Unit of Measure</span>
                <span className="text-sm font-medium">{record.unit_of_measure}</span>
              </div>
            )}
            {record.category && (
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Category</span>
                <span className="text-sm font-medium">{record.category.replace(/_/g, ' ')}</span>
              </div>
            )}
            {record.subcategory && (
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Subcategory</span>
                <span className="text-sm font-medium">{record.subcategory}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const ProductInventoryTab = () => {
  const record = useRecordContext<Product>();
  if (!record) return null;

  return (
    <div className="space-y-6">
      {/* Inventory Settings Card */}
      <Card>
        <CardContent className="pt-6">
          <h3 className="font-medium mb-4 flex items-center gap-2">
            <Truck className="w-4 h-4" />
            Inventory Settings
          </h3>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Min Order Quantity</p>
              <p className="text-lg font-semibold">
                {record.min_order_quantity || "1"}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Units per Case</p>
              <p className="text-lg font-semibold">
                {record.units_per_case || "N/A"}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Lead Time</p>
              <p className="text-lg font-semibold">
                {record.lead_time_days ? `${record.lead_time_days} days` : "N/A"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stock Information */}
      <Card>
        <CardContent className="pt-6">
          <h3 className="font-medium mb-4 flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Stock Information
          </h3>
          <div className="text-center py-8 text-muted-foreground">
            <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Stock tracking not yet implemented</p>
            <p className="text-sm mt-1">Inventory levels will be displayed here</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const ProductActivityTab = () => {
  const record = useRecordContext<Product>();
  if (!record) return null;

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-6">
          <h3 className="font-medium mb-4">Activity Log</h3>
          <div className="text-center py-8 text-muted-foreground">
            <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No activity recorded yet</p>
            <p className="text-sm mt-1">Product-related activities will appear here</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export { ProductShow };
export default ProductShow;