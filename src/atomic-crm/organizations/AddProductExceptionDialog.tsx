import { useState } from "react";
import { useCreate, useNotify, useGetIdentity } from "react-admin";
import { AlertTriangle, Check, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

import type { AddProductExceptionDialogProps } from "./authorization-types";

export function AddProductExceptionDialog({
  open,
  onOpenChange,
  distributorId,
  availableProducts,
  inheritedAuthorization,
  onSuccess,
}: AddProductExceptionDialogProps) {
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [isAuthorized, setIsAuthorized] = useState<string>("false");
  const [notes, setNotes] = useState("");
  const [create, { isPending }] = useCreate();
  const notify = useNotify();
  const { data: identity } = useGetIdentity();

  const handleSubmit = async () => {
    if (!selectedProductId) {
      notify("Please select a product", { type: "warning" });
      return;
    }

    try {
      await create(
        "product_distributor_authorizations",
        {
          data: {
            product_id: Number(selectedProductId),
            distributor_id: distributorId,
            is_authorized: isAuthorized === "true",
            authorization_date: new Date().toISOString().split("T")[0],
            notes: notes.trim() || null,
            created_by: identity?.id,
          },
        },
        { returnPromise: true }
      );

      notify("Product exception added", { type: "success" });
      setSelectedProductId("");
      setIsAuthorized("false");
      setNotes("");
      onSuccess();
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to add product exception";
      notify(errorMessage, { type: "error" });
    }
  };

  const handleClose = () => {
    setSelectedProductId("");
    setIsAuthorized("false");
    setNotes("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Product Exception</DialogTitle>
          <DialogDescription>
            Override the principal-level authorization for a specific product. Currently, products
            inherit:{" "}
            <Badge
              variant={inheritedAuthorization ? "default" : "destructive"}
              className="ml-1 text-xs"
            >
              {inheritedAuthorization ? "Authorized" : "Not Authorized"}
            </Badge>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="product">Product</Label>
            <Select value={selectedProductId} onValueChange={setSelectedProductId}>
              <SelectTrigger id="product" className="h-11">
                <SelectValue placeholder="Select a product..." />
              </SelectTrigger>
              <SelectContent>
                {availableProducts.length === 0 ? (
                  <SelectItem value="" disabled>
                    No products available
                  </SelectItem>
                ) : (
                  availableProducts.map((product) => (
                    <SelectItem key={product.id} value={String(product.id)}>
                      {product.name} ({product.sku})
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="authorization-status">Exception Status</Label>
            <Select value={isAuthorized} onValueChange={setIsAuthorized}>
              <SelectTrigger id="authorization-status" className="h-11">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="true">
                  <span className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-success" />
                    Authorized (Override to Allow)
                  </span>
                </SelectItem>
                <SelectItem value="false">
                  <span className="flex items-center gap-2">
                    <X className="h-4 w-4 text-destructive" />
                    Not Authorized (Override to Block)
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              <AlertTriangle className="h-3 w-3 inline mr-1" />
              This overrides the principal-level setting for this specific product only.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="exception-notes">Notes (optional)</Label>
            <Textarea
              id="exception-notes"
              placeholder="Reason for this exception..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} className="h-11">
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isPending || !selectedProductId}
            className="h-11"
          >
            {isPending ? "Adding..." : "Add Exception"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
