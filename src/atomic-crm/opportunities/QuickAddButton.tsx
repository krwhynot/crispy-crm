import { useState } from "react";
import { useCanAccess } from "ra-core";
import { Plus } from "lucide-react";
import { AdminButton } from "@/components/admin/AdminButton";
import { QuickAddDialog } from "./QuickAddDialog";

/**
 * Quick Add Button Component
 *
 * Button that opens the Quick Add Dialog for rapid booth visitor data entry.
 * Manages the dialog open/close state internally.
 * Designed for placement in the opportunities list header.
 *
 * RBAC: Hidden when user lacks create permission on opportunities.
 */
export const QuickAddButton = () => {
  const [open, setOpen] = useState(false);
  const { canAccess, isPending } = useCanAccess({
    resource: "opportunities",
    action: "create",
  });

  if (isPending || !canAccess) return null;

  return (
    <>
      <AdminButton
        onClick={() => setOpen(true)}
        variant="default"
        size="default"
      >
        <Plus aria-hidden="true" /> Add Opportunity
      </AdminButton>
      <QuickAddDialog open={open} onOpenChange={setOpen} />
    </>
  );
};
