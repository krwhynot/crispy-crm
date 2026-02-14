import { Upload } from "lucide-react";
import { useState } from "react";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { OrganizationImportDialog } from "./OrganizationImportDialog";

export function OrganizationImportMenuItem() {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <DropdownMenuItem onSelect={() => setModalOpen(true)}>
        <Upload className="size-4" />
        Import CSV
      </DropdownMenuItem>
      <OrganizationImportDialog open={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  );
}
