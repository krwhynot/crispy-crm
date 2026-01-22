import { useState } from "react";
import { useCreate, useNotify, useGetIdentity } from "react-admin";

import { Button } from "@/components/admin/AdminButton";
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

import type { AddPrincipalDialogProps } from "./authorization-types";

export function AddPrincipalDialog({
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
          <AdminButton variant="outline" onClick={handleClose} className="h-11">
            Cancel
          </AdminButton>
          <AdminButton
            onClick={handleSubmit}
            disabled={isPending || !selectedPrincipalId}
            className="h-11"
          >
            {isPending ? "Adding..." : "Add Authorization"}
          </AdminButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
