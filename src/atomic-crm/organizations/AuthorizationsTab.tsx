/**
 * AuthorizationsTab - Displays and manages principal authorizations for distributor organizations
 *
 * This tab shows which principals (food manufacturers) are authorized to sell
 * through this distributor. Part of MFB's three-party business model:
 * Principal → Distributor → Customer/Operator
 *
 * Features:
 * - List of authorized principals with status badges
 * - Add new principal authorization via dialog
 * - Remove authorization with confirmation
 * - Territory restrictions and notes display
 * - Product-level exceptions (expand to see/manage per-product overrides)
 *
 * @see docs/PRD.md Section 4.3 - Distributor Authorization Model
 */

import { useState } from "react";
import {
  Building2,
  Plus,
  AlertTriangle,
  Check,
  X,
} from "lucide-react";
import type { RaRecord } from "react-admin";
import {
  useGetList,
  useCreate,
  useDelete,
  useNotify,
  useRefresh,
  useGetIdentity,
} from "react-admin";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import type { TabComponentProps } from "@/components/layouts/ResourceSlideOver";
import { AuthorizationCard } from "./components/AuthorizationCard";

// =====================================================
// Types
// =====================================================

interface AuthorizationsTabProps extends Partial<TabComponentProps> {
  /** For standalone use outside slide-over */
  distributorId?: string | number;
}

interface PrincipalOrganization extends RaRecord {
  name: string;
  organization_type: string;
}

interface Product extends RaRecord {
  id: number;
  name: string;
  sku: string;
  principal_id: number;
  category?: string;
  status?: string;
}

interface AuthorizationWithPrincipal extends RaRecord {
  id: number;
  distributor_id: number;
  principal_id: number;
  is_authorized: boolean;
  authorization_date: string | null;
  expiration_date: string | null;
  territory_restrictions: string[] | null;
  notes: string | null;
  created_at: string;
  principal?: PrincipalOrganization;
}

interface ProductAuthorization extends RaRecord {
  id: number;
  product_id: number;
  distributor_id: number;
  is_authorized: boolean;
  authorization_date: string | null;
  expiration_date: string | null;
  territory_restrictions: string[] | null;
  notes: string | null;
  special_pricing: Record<string, unknown> | null;
  created_at: string;
}

// =====================================================
// Main Component
// =====================================================

export function AuthorizationsTab({
  record,
  distributorId: propDistributorId,
  isActiveTab = true,
}: AuthorizationsTabProps) {
  // Support both slide-over usage (record prop) and standalone usage (distributorId prop)
  const distributorId = record?.id ?? propDistributorId;

  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [removeAuth, setRemoveAuth] = useState<AuthorizationWithPrincipal | null>(null);
  const refresh = useRefresh();

  // Fetch authorizations for this distributor (only when tab is active)
  const {
    data: authorizations,
    isPending,
    error,
  } = useGetList<AuthorizationWithPrincipal>(
    "distributor_principal_authorizations",
    {
      filter: { distributor_id: distributorId, deleted_at: null },
      sort: { field: "created_at", order: "DESC" },
      pagination: { page: 1, perPage: 100 },
    },
    { enabled: isActiveTab && !!distributorId }
  );

  // Fetch principal organizations for the add dialog
  const { data: principals } = useGetList<PrincipalOrganization>(
    "organizations",
    {
      filter: { organization_type: "principal", deleted_at: null },
      sort: { field: "name", order: "ASC" },
      pagination: { page: 1, perPage: 200 },
    },
    { enabled: isActiveTab && addDialogOpen }
  );

  // Get list of already authorized principal IDs
  const authorizedPrincipalIds = new Set(authorizations?.map((a) => a.principal_id) || []);

  // Filter available principals (not already authorized)
  const availablePrincipals = principals?.filter((p) => !authorizedPrincipalIds.has(Number(p.id)));

  if (!distributorId) {
    return <div className="text-center py-8 text-muted-foreground">No distributor selected</div>;
  }

  if (isPending) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="p-4 border border-border rounded-lg">
            <Skeleton className="h-4 w-32 mb-2" />
            <Skeleton className="h-3 w-full mb-1" />
            <Skeleton className="h-3 w-3/4" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return <div className="text-center py-8 text-destructive">Failed to load authorizations</div>;
  }

  const authorizationsList = authorizations || [];

  return (
    <div className="space-y-4">
      {/* Header with Add button */}
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">
          {authorizationsList.length === 0
            ? "No authorized principals"
            : `${authorizationsList.length} authorized principal${authorizationsList.length !== 1 ? "s" : ""}`}
        </p>
        <Button variant="outline" size="sm" onClick={() => setAddDialogOpen(true)} className="h-11">
          <Plus className="h-4 w-4 mr-1" />
          Add Principal
        </Button>
      </div>

      {/* Authorizations List */}
      {authorizationsList.length === 0 ? (
        <EmptyState onAddClick={() => setAddDialogOpen(true)} />
      ) : (
        <div className="space-y-3">
          {authorizationsList.map((auth) => (
            <AuthorizationCard
              key={auth.id}
              authorization={auth}
              distributorId={Number(distributorId)}
              onRemove={() => setRemoveAuth(auth)}
            />
          ))}
        </div>
      )}

      {/* Add Principal Dialog */}
      <AddPrincipalDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        distributorId={distributorId}
        availablePrincipals={availablePrincipals || []}
        onSuccess={() => {
          refresh();
          setAddDialogOpen(false);
        }}
      />

      {/* Remove Confirmation Dialog */}
      <RemoveAuthorizationDialog
        authorization={removeAuth}
        onClose={() => setRemoveAuth(null)}
        onSuccess={() => {
          refresh();
          setRemoveAuth(null);
        }}
      />
    </div>
  );
}

// =====================================================
// Empty State
// =====================================================

function EmptyState({ onAddClick }: { onAddClick: () => void }) {
  return (
    <div className="text-center py-12 border border-dashed border-border rounded-lg">
      <Building2 className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
      <h3 className="text-lg font-medium mb-2">No Authorized Principals</h3>
      <p className="text-sm text-muted-foreground mb-4">
        Add principals that are authorized to sell through this distributor.
      </p>
      <Button variant="outline" onClick={onAddClick} className="h-11">
        <Plus className="h-4 w-4 mr-1" />
        Add First Principal
      </Button>
    </div>
  );
}

// =====================================================
// Product Exceptions Section (within expanded card)
// =====================================================

interface ProductExceptionsSectionProps {
  authorization: AuthorizationWithPrincipal;
  distributorId: number;
  products: Product[];
  productAuths: ProductAuthorization[];
  isLoading: boolean;
}

function ProductExceptionsSection({
  authorization,
  distributorId,
  products,
  productAuths,
  isLoading,
}: ProductExceptionsSectionProps) {
  const [addExceptionOpen, setAddExceptionOpen] = useState(false);
  const [removeException, setRemoveException] = useState<ProductAuthorization | null>(null);
  const refresh = useRefresh();

  // Map product IDs to their authorizations
  const productAuthMap = new Map(productAuths.map((pa) => [pa.product_id, pa]));

  // Products with explicit exceptions
  const productsWithExceptions = products.filter((p) => productAuthMap.has(Number(p.id)));

  // Products available to add exceptions (not already overridden)
  const productsWithoutExceptions = products.filter((p) => !productAuthMap.has(Number(p.id)));

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
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setAddExceptionOpen(true)}
            className="h-11 text-xs"
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Exception
          </Button>
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
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-11 w-11 p-0 text-muted-foreground hover:text-destructive"
                    onClick={() => setRemoveException(productAuth)}
                    title="Remove exception"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Product Exception Dialog */}
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

      {/* Remove Product Exception Dialog */}
      <RemoveProductExceptionDialog
        productAuth={removeException}
        products={products}
        onClose={() => setRemoveException(null)}
        onSuccess={() => {
          refresh();
          setRemoveException(null);
        }}
      />
    </div>
  );
}

// =====================================================
// Add Principal Dialog
// =====================================================

interface AddPrincipalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  distributorId: string | number;
  availablePrincipals: PrincipalOrganization[];
  onSuccess: () => void;
}

function AddPrincipalDialog({
  open,
  onOpenChange,
  distributorId,
  availablePrincipals,
  onSuccess,
}: AddPrincipalDialogProps) {
  const [selectedPrincipalId, setSelectedPrincipalId] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [create, { isPending }] = useCreate();
  const notify = useNotify();
  const { data: identity } = useGetIdentity();

  const handleSubmit = async () => {
    if (!selectedPrincipalId) {
      notify("Please select a principal", { type: "warning" });
      return;
    }

    try {
      await create(
        "distributor_principal_authorizations",
        {
          data: {
            distributor_id: Number(distributorId),
            principal_id: Number(selectedPrincipalId),
            is_authorized: true,
            authorization_date: new Date().toISOString().split("T")[0],
            notes: notes.trim() || null,
            created_by: identity?.id,
          },
        },
        { returnPromise: true }
      );

      notify("Principal authorization added", { type: "success" });
      setSelectedPrincipalId("");
      setNotes("");
      onSuccess();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Failed to add authorization";
      notify(errorMessage, { type: "error" });
    }
  };

  const handleClose = () => {
    setSelectedPrincipalId("");
    setNotes("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Authorized Principal</DialogTitle>
          <DialogDescription>
            Select a principal to authorize for selling through this distributor.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="principal">Principal</Label>
            <Select value={selectedPrincipalId} onValueChange={setSelectedPrincipalId}>
              <SelectTrigger id="principal" className="h-11">
                <SelectValue placeholder="Select a principal..." />
              </SelectTrigger>
              <SelectContent>
                {availablePrincipals.length === 0 ? (
                  <SelectItem value="" disabled>
                    No principals available
                  </SelectItem>
                ) : (
                  availablePrincipals.map((principal) => (
                    <SelectItem key={principal.id} value={String(principal.id)}>
                      {principal.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea
              id="notes"
              placeholder="Add any notes about this authorization..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} className="h-11">
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isPending || !selectedPrincipalId}
            className="h-11"
          >
            {isPending ? "Adding..." : "Add Authorization"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// =====================================================
// Add Product Exception Dialog
// =====================================================

interface AddProductExceptionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  distributorId: number;
  availableProducts: Product[];
  inheritedAuthorization: boolean;
  onSuccess: () => void;
}

function AddProductExceptionDialog({
  open,
  onOpenChange,
  distributorId,
  availableProducts,
  inheritedAuthorization,
  onSuccess,
}: AddProductExceptionDialogProps) {
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [isAuthorized, setIsAuthorized] = useState<string>("false"); // Override to NOT authorized by default
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

// =====================================================
// Remove Authorization Dialog
// =====================================================

interface RemoveAuthorizationDialogProps {
  authorization: AuthorizationWithPrincipal | null;
  onClose: () => void;
  onSuccess: () => void;
}

function RemoveAuthorizationDialog({
  authorization,
  onClose,
  onSuccess,
}: RemoveAuthorizationDialogProps) {
  const [deleteOne, { isPending }] = useDelete();
  const notify = useNotify();

  // Fetch principal name for display
  const { data: principal } = useGetList<PrincipalOrganization>(
    "organizations",
    {
      filter: authorization ? { id: authorization.principal_id } : {},
      pagination: { page: 1, perPage: 1 },
    },
    { enabled: !!authorization }
  );

  const principalName =
    principal?.[0]?.name || (authorization ? `Principal #${authorization.principal_id}` : "");

  const handleConfirm = async () => {
    if (!authorization) return;

    try {
      await deleteOne(
        "distributor_principal_authorizations",
        { id: authorization.id },
        {
          onSuccess: () => {
            notify(`Removed authorization for ${principalName}`, { type: "success" });
            onSuccess();
          },
          onError: (error: unknown) => {
            const errorMessage =
              error instanceof Error ? error.message : "Failed to remove authorization";
            notify(errorMessage, { type: "error" });
          },
        }
      );
    } catch {
      notify("Failed to remove authorization. Please try again.", { type: "error" });
    }
  };

  return (
    <AlertDialog open={!!authorization} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Remove Principal Authorization?</AlertDialogTitle>
          <AlertDialogDescription>
            Remove authorization for <strong>{principalName}</strong>? This distributor will no
            longer be able to carry products from this principal.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="h-11">Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={isPending}
            className="h-11 bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isPending ? "Removing..." : "Remove"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// =====================================================
// Remove Product Exception Dialog
// =====================================================

interface RemoveProductExceptionDialogProps {
  productAuth: ProductAuthorization | null;
  products: Product[];
  onClose: () => void;
  onSuccess: () => void;
}

function RemoveProductExceptionDialog({
  productAuth,
  products,
  onClose,
  onSuccess,
}: RemoveProductExceptionDialogProps) {
  const [deleteOne, { isPending }] = useDelete();
  const notify = useNotify();

  const product = products.find((p) => Number(p.id) === productAuth?.product_id);
  const productName = product?.name || (productAuth ? `Product #${productAuth.product_id}` : "");

  const handleConfirm = async () => {
    if (!productAuth) return;

    try {
      await deleteOne(
        "product_distributor_authorizations",
        { id: productAuth.id },
        {
          onSuccess: () => {
            notify(`Removed exception for ${productName}`, { type: "success" });
            onSuccess();
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

  return (
    <AlertDialog open={!!productAuth} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Remove Product Exception?</AlertDialogTitle>
          <AlertDialogDescription>
            Remove the exception for <strong>{productName}</strong>? This product will revert to the
            principal-level authorization setting.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="h-11">Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={isPending}
            className="h-11 bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isPending ? "Removing..." : "Remove Exception"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export default AuthorizationsTab;
