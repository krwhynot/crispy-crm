import { useState } from "react";
import { AdminButton } from "@/components/admin/AdminButton";
import { QuickAddDialog } from "./QuickAddDialog";

/**
 * Quick Add Button Component
 *
 * Button that opens the Quick Add Dialog for rapid booth visitor data entry.
 * Manages the dialog open/close state internally.
 * Designed for placement in the opportunities list header.
 */
export const QuickAddButton = () => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <AdminButton
        onClick={() => setOpen(true)}
        variant="outline"
        size="default"
        className="min-h-[44px] min-w-[44px]" // Ensure touch target minimum
      >
        ⚡ Quick Add
      </AdminButton>
      <QuickAddDialog open={open} onOpenChange={setOpen} />
    </>
  );
};
