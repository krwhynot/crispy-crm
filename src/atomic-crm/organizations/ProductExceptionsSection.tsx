import { useState } from "react";
import { useRefresh, useDelete, useNotify } from "react-admin";
import { Plus, Trash2, Check, X, Package } from "lucide-react";

import { Button } from "@/components/admin/AdminButton";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { parseDateSafely } from "@/lib/date-utils";

import type { ProductExceptionsSectionProps, ProductAuthorization } from "./authorization-types";
import { AddProductExceptionDialog } from "./AddProductExceptionDialog";
import { RemoveConfirmDialog } from "./RemoveConfirmDialog";

export function ProductExceptionsSection({
  authorization,
  distributorId,
  products,
  productAuths,
  isLoading,
}: ProductExceptionsSectionProps) {
  const [addExceptionOpen, setAddExceptionOpen] = useState(false);
  const [removeException, setRemoveException] = useState<ProductAuthorization | null>(null);
  const refresh = useRefresh();
  const [deleteOne, { isPending: isDeleting }] = useDelete();
  const notify = useNotify();

  const productAuthMap = new Map(productAuths.map((pa) => [pa.product_id, pa]));

  const productsWithExceptions = products.filter((p) => productAuthMap.has(Number(p.id)));

  const productsWithoutExceptions = products.filter((p) => !productAuthMap.has(Number(p.id)));

  const product = products.find((p) => Number(p.id) === removeException?.product_id);
  const productName =
    product?.name || (removeException ? `Product #${removeException.product_id}` : "");

  const handleRemoveException = async () => {
    if (!removeException) return;

    try {
      await deleteOne(
        "product_distributor_authorizations",
        { id: removeException.id },
        {
          onSuccess: () => {
            notify(`Removed exception for ${productName}`, { type: "success" });
            refresh();
            setRemoveException(null);
          },
          onError: (error: unknown) => {
            const errorMessage =
              error instanceof Error ? error.message : "Failed to remove exception";
            notify(errorMessage, { type: "error" });
          },
        }
      );
    } catch {
      notify("Failed to remove exception. Please try again.", { type: "error" });
    }
  };

  if (isLoading) {
    return (
      <div className="border-t border-border p-4 bg-muted/30">
        <Skeleton className="h-4 w-48 mb-2" />
        <Skeleton className="h-3 w-full" />
      </div>
    );
  }

  return (
    <div className="border-t border-border p-4 bg-muted/30">
      <div className="flex justify-between items-center mb-3">
        <h4 className="text-sm font-medium flex items-center gap-2">
          <Package className="h-4 w-4" />
          Product Exceptions
        </h4>
        {productsWithoutExceptions.length > 0 && (
          <AdminButton
            variant="ghost"
            size="sm"
            onClick={() => setAddExceptionOpen(true)}
            className="h-11 text-xs"
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Exception
          </AdminButton>
        )}
      </div>

      {products.length === 0 ? (
        <p className="text-sm text-muted-foreground">No products found for this principal.</p>
      ) : productsWithExceptions.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          All {products.length} product{products.length !== 1 ? "s" : ""} inherit the
          principal-level authorization.
          {productsWithoutExceptions.length > 0 &&
            " Add an exception to override for specific products."}
        </p>
      ) : (
        <div className="space-y-2">
          {productsWithExceptions.map((product) => {
            const productAuth = productAuthMap.get(Number(product.id))!;
            const isAuthorized = productAuth.is_authorized;
            const expirationDate = productAuth.expiration_date
              ? parseDateSafely(productAuth.expiration_date)
              : null;
            const isExceptionExpired = expirationDate && expirationDate < new Date();

            return (
              <div
                key={product.id}
                className="flex items-center justify-between p-3 bg-background rounded border border-border"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded flex items-center justify-center ${
                      isAuthorized && !isExceptionExpired
                        ? "bg-success/10 text-success"
                        : "bg-destructive/10 text-destructive"
                    }`}
                  >
                    {isAuthorized && !isExceptionExpired ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <X className="h-4 w-4" />
                    )}
                  </div>
                  <div>
                    <span className="text-sm font-medium">{product.name}</span>
                    <span className="text-xs text-muted-foreground ml-2">({product.sku})</span>
                    {isExceptionExpired && (
                      <Badge
                        variant="outline"
                        className="ml-2 text-xs text-destructive border-destructive"
                      >
                        Expired
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={isAuthorized ? "default" : "destructive"} className="text-xs">
                    {isAuthorized ? "Authorized" : "Not Authorized"}
                  </Badge>
                  <AdminButton
                    variant="ghost"
                    size="sm"
                    className="h-11 w-11 p-0 text-muted-foreground hover:text-destructive"
                    onClick={() => setRemoveException(productAuth)}
                    title="Remove exception"
                  >
                    <Trash2 className="h-4 w-4" />
                  </AdminButton>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <AddProductExceptionDialog
        open={addExceptionOpen}
        onOpenChange={setAddExceptionOpen}
        distributorId={distributorId}
        availableProducts={productsWithoutExceptions}
        inheritedAuthorization={authorization.is_authorized}
        onSuccess={() => {
          refresh();
          setAddExceptionOpen(false);
        }}
      />

      <RemoveConfirmDialog
        open={!!removeException}
        title="Remove Product Exception?"
        description={
          <>
            Remove the exception for <strong>{productName}</strong>? This product will revert to the
            principal-level authorization setting.
          </>
        }
        onClose={() => setRemoveException(null)}
        onConfirm={handleRemoveException}
        isPending={isDeleting}
        confirmLabel="Remove Exception"
      />
    </div>
  );
}
