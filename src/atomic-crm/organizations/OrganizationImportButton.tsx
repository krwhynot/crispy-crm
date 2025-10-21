import { Button } from "@/components/ui/button";
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
      <Button
        variant="outline"
        onClick={handleOpenModal}
        className="flex items-center gap-2 cursor-pointer"
      >
        <Upload /> Import
      </Button>
      <OrganizationImportDialog open={modalOpen} onClose={handleCloseModal} />
    </>
  );
};
