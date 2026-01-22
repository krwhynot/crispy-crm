import { AdminButton } from "@/components/admin/AdminButton";
import { Upload } from "lucide-react";
import { useState } from "react";
import { ContactImportDialog } from "./ContactImportDialog";

export const ContactImportButton = () => {
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
      <ContactImportDialog open={modalOpen} onClose={handleCloseModal} />
    </>
  );
};
