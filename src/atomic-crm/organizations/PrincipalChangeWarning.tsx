import { useState } from "react";
import { useRecordContext, useGetList, useNotify } from "ra-core";
import { AlertCircle, Package } from "lucide-react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Organization } from "../types";

interface Product {
  id: number;
  name: string;
  sku: string;
  principal_id: number;
}

interface PrincipalChangeWarningProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  newType: string;
}

export const PrincipalChangeWarning = ({
  open,
  onClose,
  onConfirm,
  newType,
}: PrincipalChangeWarningProps) => {
  const record = useRecordContext<Organization>();
  const notify = useNotify();

  // Fetch products for this principal
  const { data: products, isLoading } = useGetList<Product>(
    "products",
    {
      filter: { principal_id: record?.id },
      pagination: { page: 1, perPage: 100 },
      sort: { field: "name", order: "ASC" },
    },
    {
      enabled: open && !!record?.id,
    }
  );

  const productCount = products?.length || 0;

  return (
    <AlertDialog open={open} onOpenChange={onClose}>
      <AlertDialogContent className="max-w-2xl">
        <AlertDialogHeader>
          <div className="flex items-center gap-2">
            <AlertCircle className="h-6 w-6 text-destructive" />
            <AlertDialogTitle>Cannot Change Organization Type</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="space-y-4">
            <p className="text-base">
              <strong>{record?.name}</strong> is currently a <strong>Principal</strong> with{" "}
              <strong>{productCount} product{productCount !== 1 ? "s" : ""}</strong> assigned.
            </p>
            <p>
              You cannot change this organization to <strong>{newType}</strong> while products are
              still assigned. Please reassign or remove these products first:
            </p>

            {isLoading ? (
              <div className="text-center py-4 text-[color:var(--text-subtle)]">
                Loading products...
              </div>
            ) : productCount > 0 ? (
              <ScrollArea className="h-[300px] rounded-md border p-4">
                <div className="space-y-2">
                  {products?.map((product) => (
                    <div
                      key={product.id}
                      className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                    >
                      <Package className="w-4 h-4 mt-0.5 text-[color:var(--text-subtle)]" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">{product.name}</p>
                        <p className="text-xs text-[color:var(--text-subtle)]">
                          SKU: {product.sku}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            ) : (
              <div className="text-center py-4 text-[color:var(--text-subtle)]">
                No products found
              </div>
            )}

            <div className="bg-amber-500/10 border border-amber-500/20 rounded-md p-3">
              <p className="text-sm font-medium">
                💡 To change this organization type:
              </p>
              <ol className="text-sm text-[color:var(--text-subtle)] mt-2 ml-4 list-decimal space-y-1">
                <li>Go to the Products page</li>
                <li>Reassign these {productCount} products to a different principal</li>
                <li>Return here to change the organization type</li>
              </ol>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
