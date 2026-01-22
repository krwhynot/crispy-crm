/**
 * ProductsTable Component
 *
 * Displays products associated with an opportunity in a table format.
 * Features:
 * - Product name (links to product detail page)
 * - Principal organization name
 * - Notes
 * - Remove button per row
 * - Empty state when no products
 */

import * as React from "react";
import { Link } from "react-router-dom";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/admin/AdminButton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Product {
  id: number | string;
  product_id_reference: number;
  product_name: string;
  product_category?: string;
  principal_name?: string;
  notes?: string;
}

interface ProductsTableProps {
  products: Product[];
  onRemove?: (productId: number | string) => void;
  isRemoving?: boolean;
}

export const ProductsTable: React.FC<ProductsTableProps> = ({
  products,
  onRemove,
  isRemoving = false,
}) => {
  const [productToDelete, setProductToDelete] = React.useState<Product | null>(null);

  const handleRemoveClick = (product: Product) => {
    setProductToDelete(product);
  };

  const handleConfirmRemove = () => {
    if (productToDelete && onRemove) {
      onRemove(productToDelete.id);
    }
    setProductToDelete(null);
  };

  const handleCancelRemove = () => {
    setProductToDelete(null);
  };

  // Empty state
  if (!products || products.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card p-8 text-center">
        <p className="text-sm text-muted-foreground">
          No products associated with this opportunity
        </p>
        <p className="text-xs text-muted-foreground mt-1">Edit the opportunity to add products</p>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[40%]">Product Name</TableHead>
              <TableHead className="w-[25%]">Principal</TableHead>
              <TableHead className="w-[30%]">Notes</TableHead>
              {onRemove && <TableHead className="w-[5%] text-right">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((product) => (
              <TableRow key={product.id}>
                <TableCell className="font-medium">
                  <Link
                    to={`/products/${product.product_id_reference}/show`}
                    className="text-primary hover:underline"
                  >
                    {product.product_name}
                  </Link>
                  {product.product_category && (
                    <span className="ml-2 text-xs text-muted-foreground">
                      ({product.product_category})
                    </span>
                  )}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {product.principal_name || "—"}
                </TableCell>
                <TableCell className="text-sm">
                  {product.notes ? (
                    <span className="text-muted-foreground">{product.notes}</span>
                  ) : (
                    <span className="text-muted-foreground italic">No notes</span>
                  )}
                </TableCell>
                {onRemove && (
                  <TableCell className="text-right">
                    <AdminButton
                      variant="ghost"
                      onClick={() => handleRemoveClick(product)}
                      disabled={isRemoving}
                      className="h-11 w-11 p-0 touch-manipulation"
                      aria-label={`Remove ${product.product_name}`}
                    >
                      <Trash2 className="h-5 w-5 text-destructive" />
                    </AdminButton>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog open={!!productToDelete} onOpenChange={(open) => !open && handleCancelRemove()}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Product</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove "{productToDelete?.product_name}" from this
              opportunity? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelRemove}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmRemove}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
