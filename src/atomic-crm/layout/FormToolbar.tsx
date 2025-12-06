import { CancelButton } from "@/components/admin/cancel-button";
import { DeleteButton } from "@/components/admin/delete-button";
import { SaveButton } from "@/components/admin/form";
import { FormToolbar as KitFormToolbar } from "@/components/admin/simple-form";

interface FormToolbarProps {
  dataTutorial?: string;
}

export const FormToolbar = ({ dataTutorial }: FormToolbarProps = {}) => (
  <KitFormToolbar className="flex md:flex flex-row justify-between gap-2">
    <DeleteButton />

    <div className="flex flex-row gap-2 justify-end">
      <CancelButton />
      <SaveButton data-tutorial={dataTutorial} />
    </div>
  </KitFormToolbar>
);
