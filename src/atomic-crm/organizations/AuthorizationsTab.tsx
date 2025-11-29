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
 */

import { useState } from "react";
import { Building2, Plus, Trash2, Calendar, MapPin, FileText } from "lucide-react";
import {
  useGetList,
  useCreate,
  useDelete,
  useNotify,
  useRefresh,
  useGetIdentity,
  RaRecord,
} from "react-admin";
import { format } from "date-fns";

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
import type { DistributorAuthorizationWithNames } from "../validation/distributorAuthorizations";

interface AuthorizationsTabProps {
  distributorId: string | number;
}

interface PrincipalOrganization extends RaRecord {
  name: string;
  organization_type: string;
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
  // Joined from organizations table
  principal?: PrincipalOrganization;
}

export function AuthorizationsTab({ distributorId }: AuthorizationsTabProps) {
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [removeAuth, setRemoveAuth] = useState<AuthorizationWithPrincipal | null>(null);
  const notify = useNotify();
  const refresh = useRefresh();

  // Fetch authorizations for this distributor
  const {
    data: authorizations,
    isPending,
    error,
  } = useGetList<AuthorizationWithPrincipal>("distributor_principal_authorizations", {
    filter: { distributor_id: distributorId, deleted_at: null },
    sort: { field: "created_at", order: "DESC" },
    pagination: { page: 1, perPage: 100 },
  });

  // Fetch principal organizations for the add dialog
  const { data: principals } = useGetList<PrincipalOrganization>("organizations", {
    filter: { organization_type: "principal", deleted_at: null },
    sort: { field: "name", order: "ASC" },
    pagination: { page: 1, perPage: 200 },
  });

  // Get list of already authorized principal IDs
  const authorizedPrincipalIds = new Set(authorizations?.map((a) => a.principal_id) || []);

  // Filter available principals (not already authorized)
  const availablePrincipals = principals?.filter((p) => !authorizedPrincipalIds.has(Number(p.id)));

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
    return (
      <div className="text-center py-8 text-destructive">Failed to load authorizations</div>
    );
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
        <Button variant="outline" size="sm" onClick={() => setAddDialogOpen(true)}>
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

function EmptyState({ onAddClick }: { onAddClick: () => void }) {
  return (
    <div className="text-center py-12 border border-dashed border-border rounded-lg">
      <Building2 className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
      <h3 className="text-lg font-medium mb-2">No Authorized Principals</h3>
      <p className="text-sm text-muted-foreground mb-4">
        Add principals that are authorized to sell through this distributor.
      </p>
      <Button variant="outline" onClick={onAddClick}>
        <Plus className="h-4 w-4 mr-1" />
        Add First Principal
      </Button>
    </div>
  );
}

interface AuthorizationCardProps {
  authorization: AuthorizationWithPrincipal;
  onRemove: () => void;
}

function AuthorizationCard({ authorization, onRemove }: AuthorizationCardProps) {
  // We need to fetch the principal name since it's not joined
  const { data: principal } = useGetList<PrincipalOrganization>("organizations", {
    filter: { id: authorization.principal_id },
    pagination: { page: 1, perPage: 1 },
  });

  const principalName = principal?.[0]?.name || `Principal #${authorization.principal_id}`;
  const isExpired =
    authorization.expiration_date && new Date(authorization.expiration_date) < new Date();
  const isActive = authorization.is_authorized && !isExpired;

  return (
    <div className="flex gap-4 p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors">
      {/* Icon */}
      <div className="flex-shrink-0 mt-1">
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
          <Building2 className="h-5 w-5 text-primary" />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Header */}
        <div className="flex items-start justify-between mb-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium">{principalName}</span>
            <Badge variant={isActive ? "default" : "secondary"}>
              {isActive ? "Active" : isExpired ? "Expired" : "Inactive"}
            </Badge>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
            onClick={onRemove}
            title="Remove authorization"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>

        {/* Details */}
        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mt-2">
          {authorization.authorization_date && (
            <div className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              <span>Since {format(new Date(authorization.authorization_date), "MMM d, yyyy")}</span>
            </div>
          )}
          {authorization.expiration_date && (
            <div className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              <span
                className={isExpired ? "text-destructive" : ""}
              >
                {isExpired ? "Expired" : "Expires"}{" "}
                {format(new Date(authorization.expiration_date), "MMM d, yyyy")}
              </span>
            </div>
          )}
          {authorization.territory_restrictions && authorization.territory_restrictions.length > 0 && (
            <div className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" />
              <span>{authorization.territory_restrictions.join(", ")}</span>
            </div>
          )}
        </div>

        {/* Notes */}
        {authorization.notes && (
          <div className="flex items-start gap-1 mt-2 text-sm">
            <FileText className="h-3.5 w-3.5 mt-0.5 text-muted-foreground" />
            <span className="text-foreground/80">{authorization.notes}</span>
          </div>
        )}
      </div>
    </div>
  );
}

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
  const [create, { isLoading }] = useCreate();
  const notify = useNotify();
  const { identity } = useGetIdentity();

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
    } catch (error: any) {
      notify(error?.message || "Failed to add authorization", { type: "error" });
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
              <SelectTrigger id="principal">
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
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading || !selectedPrincipalId}>
            {isLoading ? "Adding..." : "Add Authorization"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

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
  const [deleteOne, { isLoading }] = useDelete();
  const notify = useNotify();

  // Fetch principal name for display
  const { data: principal } = useGetList<PrincipalOrganization>("organizations", {
    filter: authorization ? { id: authorization.principal_id } : {},
    pagination: { page: 1, perPage: 1 },
  });

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
          onError: (error: any) => {
            notify(error?.message || "Failed to remove authorization", { type: "error" });
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
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={isLoading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isLoading ? "Removing..." : "Remove"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export default AuthorizationsTab;
