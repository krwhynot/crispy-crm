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
import { Plus } from "lucide-react";
import { useGetList, useRefresh, useDelete, useNotify } from "react-admin";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

// Import extracted components
import {
  type AuthorizationsTabProps,
  type AuthorizationWithPrincipal,
  type PrincipalOrganization,
} from "./authorization-types";
import { AuthorizationsEmptyState } from "./AuthorizationsEmptyState";
import { AuthorizationCard } from "./AuthorizationCard";
import { AddPrincipalDialog } from "./AddPrincipalDialog";
import { RemoveConfirmDialog } from "./RemoveConfirmDialog";

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
  const [deleteOne, { isPending: isDeleting }] = useDelete();
  const notify = useNotify();

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

  // Fetch principal name for the remove dialog
  const { data: principalForRemove } = useGetList<PrincipalOrganization>(
    "organizations",
    {
      filter: removeAuth ? { id: removeAuth.principal_id } : {},
      pagination: { page: 1, perPage: 1 },
    },
    { enabled: !!removeAuth }
  );

  const principalNameForRemove =
    principalForRemove?.[0]?.name || (removeAuth ? `Principal #${removeAuth.principal_id}` : "");

  // Handler for removing authorization
  const handleRemoveAuthorization = async () => {
    if (!removeAuth) return;

    try {
      await deleteOne(
        "distributor_principal_authorizations",
        { id: removeAuth.id },
        {
          onSuccess: () => {
            notify(`Removed authorization for ${principalNameForRemove}`, { type: "success" });
            refresh();
            setRemoveAuth(null);
          },
          onError: (error: unknown) => {
            const errorMessage =
              error instanceof Error ? error.message : "Failed to remove authorization";
            notify(errorMessage, { type: "error" });
          },
        }
      );
    } catch (error: unknown) {
      // ERR-002 FIX: Log error with context before notifying user
      console.error(
        "[AuthorizationsTab] Failed to remove authorization:",
        error instanceof Error ? error.message : String(error)
      );
      notify("Failed to remove authorization. Please try again.", { type: "error" });
    }
  };

  // Guard: No distributor selected
  if (!distributorId) {
    return <div className="text-center py-8 text-muted-foreground">No distributor selected</div>;
  }

  // Loading state
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

  // Error state
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
        <AuthorizationsEmptyState onAddClick={() => setAddDialogOpen(true)} />
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
      <RemoveConfirmDialog
        open={!!removeAuth}
        title="Remove Principal Authorization?"
        description={
          <>
            Remove authorization for <strong>{principalNameForRemove}</strong>? This distributor
            will no longer be able to carry products from this principal.
          </>
        }
        onClose={() => setRemoveAuth(null)}
        onConfirm={handleRemoveAuthorization}
        isPending={isDeleting}
      />
    </div>
  );
}

export default AuthorizationsTab;
