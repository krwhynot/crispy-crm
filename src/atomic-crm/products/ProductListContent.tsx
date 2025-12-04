import { RecordContextProvider, useListContext } from "ra-core";
import { Link } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from "date-fns";
import type { Product } from "../types";
import { parseDateSafely } from "@/lib/date-utils";

export const ProductListContent = () => {
  const { data: products, error, isPending } = useListContext<Product>();

  if (isPending) {
    return (
      <div className="space-y-4 p-4">
        <Skeleton className="w-full h-20" />
        <Skeleton className="w-full h-20" />
        <Skeleton className="w-full h-20" />
      </div>
    );
  }

  if (error) {
    return <div className="p-4 text-destructive">Error loading products</div>;
  }

  if (!products || products.length === 0) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        No products found. Create your first product to get started.
      </div>
    );
  }

  return (
    <div className="divide-y">
      {products.map((product) => (
        <RecordContextProvider key={product.id} value={product}>
          <Link
            to={`/products/${product.id}/show`}
            className="block p-4 hover:bg-muted transition-colors"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-4">
                  <h3 className="font-semibold text-lg">{product.name || "Untitled Product"}</h3>
                  <span className="text-sm text-muted-foreground">SKU: {product.sku || "N/A"}</span>
                </div>

                <div className="flex items-center gap-6 mt-2 text-sm text-muted-foreground">
                  <span>Principal: {product.principal_name || "N/A"}</span>
                  <span>Status: {product.status || "Active"}</span>
                </div>

                {product.description && (
                  <p className="mt-2 text-sm line-clamp-2">{product.description}</p>
                )}

                <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                  {product.last_promoted_at && parseDateSafely(product.last_promoted_at) && (
                    <span>
                      Last promoted{" "}
                      {formatDistanceToNow(parseDateSafely(product.last_promoted_at)!, {
                        addSuffix: true,
                      })}
                    </span>
                  )}
                  {product.opportunity_count !== undefined && (
                    <span>
                      {product.opportunity_count} active{" "}
                      {product.opportunity_count === 1 ? "opportunity" : "opportunities"}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </Link>
        </RecordContextProvider>
      ))}
    </div>
  );
};
