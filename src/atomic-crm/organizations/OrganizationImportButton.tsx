import { Button } from "@/components/admin/AdminButton";
import { Upload } from "lucide-react";
import { useState } from "react";
import { OrganizationImportDialog } from "./OrganizationImportDialog";

export const OrganizationImportButton = () => {
  const [modalOpen, setModalOpen] = useState(false);

  const handleOpenModal = () => {
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
  };

  return (
    <>
      <AdminButton
        variant="outline"
        onClick={handleOpenModal}
        className="flex items-center gap-2 cursor-pointer"
      >
        <Upload /> Import
      </AdminButton>
      <OrganizationImportDialog open={modalOpen} onClose={handleCloseModal} />
    </>
  );
};
