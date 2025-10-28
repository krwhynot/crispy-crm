import { Package, BarChart3 } from "lucide-react";
import {
  ShowBase,
  useRecordContext,
  useShowContext,
} from "ra-core";
import {
  useMatch,
  useNavigate,
} from "react-router-dom";
import type { VariantProps } from "class-variance-authority";

import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import type { badgeVariants } from "@/components/ui/badge";
import { Badge } from "@/components/ui/badge";

import type { Product } from "../types";
import { ProductAside } from "./ProductAside";

type BadgeVariant = VariantProps<typeof badgeVariants>["variant"];

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

  const statusColors: Record<string, BadgeVariant> = {
    active: "default",
    discontinued: "destructive",
    coming_soon: "secondary",
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
                <div className="text-sm text-[color:var(--text-subtle)] mt-1">
                  SKU: {record.sku}
                </div>
              </div>
              <div className="flex gap-2">
                {record.status && (
                  <Badge
                    variant={statusColors[record.status]}
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
              <p className="text-[color:var(--text-subtle)]">{record.description}</p>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2">
          <Tabs value={currentTab} onValueChange={handleTabChange}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="activity">Activity</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-6">
              <ProductOverviewTab />
            </TabsContent>

            <TabsContent value="details" className="mt-6">
              <ProductDetailsTab />
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
      {/* Product Information Card */}
      <Card>
        <CardContent className="p-6">
          <h3 className="font-medium mb-4 flex items-center gap-2">
            <Package className="w-4 h-4" />
            Product Information
          </h3>
          <div className="grid grid-cols-2 gap-4">
            {record.category && (
              <div>
                <p className="text-sm text-[color:var(--text-subtle)]">Category</p>
                <p className="font-medium">{record.category.replace(/_/g, ' ')}</p>
              </div>
            )}
            {record.subcategory && (
              <div>
                <p className="text-sm text-[color:var(--text-subtle)]">Subcategory</p>
                <p className="font-medium">{record.subcategory}</p>
              </div>
            )}
            {record.brand && (
              <div>
                <p className="text-sm text-[color:var(--text-subtle)]">Brand</p>
                <p className="font-medium">{record.brand}</p>
              </div>
            )}
            {record.upc && (
              <div>
                <p className="text-sm text-[color:var(--text-subtle)]">UPC</p>
                <p className="font-medium">{record.upc}</p>
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
          <CardContent className="p-6">
            <h3 className="font-medium mb-4">Description</h3>
            <p className="text-[color:var(--text-subtle)] whitespace-pre-wrap">
              {record.description}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Specifications Card */}
      <Card>
        <CardContent className="p-6">
          <h3 className="font-medium mb-4">Specifications</h3>
          <div className="space-y-3">
            {record.sku && (
              <div className="flex justify-between">
                <span className="text-sm text-[color:var(--text-subtle)]">SKU</span>
                <span className="text-sm font-medium">{record.sku}</span>
              </div>
            )}
            {record.upc && (
              <div className="flex justify-between">
                <span className="text-sm text-[color:var(--text-subtle)]">UPC/Barcode</span>
                <span className="text-sm font-medium">{record.upc}</span>
              </div>
            )}
            {record.category && (
              <div className="flex justify-between">
                <span className="text-sm text-[color:var(--text-subtle)]">Category</span>
                <span className="text-sm font-medium">{record.category.replace(/_/g, ' ')}</span>
              </div>
            )}
            {record.subcategory && (
              <div className="flex justify-between">
                <span className="text-sm text-[color:var(--text-subtle)]">Subcategory</span>
                <span className="text-sm font-medium">{record.subcategory}</span>
              </div>
            )}
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
        <CardContent className="p-6">
          <h3 className="font-medium mb-4">Activity Log</h3>
          <div className="text-center py-8 text-[color:var(--text-subtle)]">
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