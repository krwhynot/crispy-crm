import { AlertTriangle, Clock, FileWarning } from "lucide-react";
import { useWatch } from "react-hook-form";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/admin/AdminButton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useDistributorAuthorization } from "./useDistributorAuthorization";
import type { Identifier } from "ra-core";

/**
 * Warning banner displayed when the selected distributor is not authorized
 * to sell the selected principal's products.
 *
 * This is a "soft warning" - it alerts the user but doesn't block the action.
 * Users can acknowledge and proceed, as there may be legitimate reasons
 * (e.g., pursuing new authorization).
 *
 * Three warning states:
 * 1. No authorization record exists
 * 2. Authorization record exists but is_authorized = false
 * 3. Authorization record is expired
 *
 * @example
 * // In OpportunityRelationshipsTab, after the distributor selector:
 * <DistributorAuthorizationWarning />
 */
export function DistributorAuthorizationWarning() {
  // Watch form values for reactive updates
  const principalId = useWatch({ name: "principal_organization_id" }) as Identifier | undefined;
  const distributorId = useWatch({ name: "distributor_organization_id" }) as Identifier | undefined;

  // Check authorization status
  const {
    isAuthorized,
    hasAuthorizationRecord,
    isExpired,
    hasBothSelected,
    isLoading,
    distributorName,
    principalName,
  } = useDistributorAuthorization(principalId, distributorId);

  // Don't render if:
  // - Both not selected (nothing to check)
  // - Still loading
  // - Authorization is valid
  if (!hasBothSelected || isLoading || isAuthorized) {
    return null;
  }

  // Determine the specific warning message
  const getWarningContent = () => {
    if (isExpired) {
      return {
        icon: <Clock className="h-4 w-4 text-warning" />,
        title: "Authorization Expired",
        message: (
          <>
            <strong>{distributorName || "This distributor"}</strong>&apos;s authorization to carry{" "}
            <strong>{principalName || "this principal"}</strong>&apos;s products has expired.
          </>
        ),
        dialogTitle: "Proceed with Expired Authorization?",
        dialogDescription: (
          <>
            The authorization for <strong>{distributorName}</strong> to distribute{" "}
            <strong>{principalName}</strong> products has expired. This may mean the distributor is
            no longer carrying these products, or the authorization needs to be renewed.
          </>
        ),
      };
    }

    if (hasAuthorizationRecord) {
      // Record exists but is_authorized = false
      return {
        icon: <FileWarning className="h-4 w-4 text-warning" />,
        title: "Authorization Inactive",
        message: (
          <>
            <strong>{distributorName || "This distributor"}</strong> has an inactive authorization
            record for <strong>{principalName || "this principal"}</strong>&apos;s products.
          </>
        ),
        dialogTitle: "Proceed with Inactive Authorization?",
        dialogDescription: (
          <>
            <strong>{distributorName}</strong> has an authorization record for{" "}
            <strong>{principalName}</strong>, but it is marked as inactive. This typically means the
            distributor previously carried these products but no longer does.
          </>
        ),
      };
    }

    // No authorization record at all
    return {
      icon: <AlertTriangle className="h-4 w-4 text-warning" />,
      title: "Distributor Not Authorized",
      message: (
        <>
          <strong>{distributorName || "This distributor"}</strong> is not currently authorized to
          carry <strong>{principalName || "this principal"}</strong>&apos;s products.
        </>
      ),
      dialogTitle: "Proceed Without Authorization?",
      dialogDescription: (
        <>
          No authorization record exists between <strong>{distributorName}</strong> and{" "}
          <strong>{principalName}</strong>. This may indicate the distributor doesn&apos;t carry
          this principal&apos;s products, or a new authorization relationship is being pursued.
        </>
      ),
    };
  };

  const content = getWarningContent();

  return (
    <Alert className="border-warning/50 bg-warning-subtle mt-3">
      {content.icon}
      <AlertTitle className="text-warning-strong">{content.title}</AlertTitle>
      <AlertDescription className="text-warning">
        <p className="mb-2">{content.message}</p>
        <p className="text-sm mb-3">
          You can still create this opportunity, but the distribution channel may need to be
          established or verified.
        </p>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <AdminButton
              variant="outline"
              size="sm"
              className="border-warning text-warning hover:bg-warning-subtle"
            >
              I Understand, Continue
            </AdminButton>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{content.dialogTitle}</AlertDialogTitle>
              <AlertDialogDescription asChild>
                <div className="space-y-3">
                  <p>{content.dialogDescription}</p>
                  <div className="p-3 bg-muted rounded-md">
                    <p className="text-sm font-medium text-foreground mb-1">Consider:</p>
                    <ul className="text-sm list-disc list-inside space-y-1">
                      <li>Contacting the principal to verify distribution options</li>
                      <li>Selecting a different authorized distributor</li>
                      <li>Creating the opportunity anyway if pursuing new authorization</li>
                    </ul>
                  </div>
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Go Back</AlertDialogCancel>
              <AlertDialogAction className="bg-warning hover:bg-warning-strong">
                Yes, Create Anyway
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </AlertDescription>
    </Alert>
  );
}
