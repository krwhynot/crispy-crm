import React from "react";
import { buttonVariants } from "@/components/ui/button.constants";
import { Plus } from "lucide-react";
import { Translate, useCreatePath, useResourceContext } from "ra-core";
import { Link } from "react-router-dom";

export interface CreateButtonProps {
  label?: string;
  resource?: string;
}

export const CreateButton = ({ label, resource: targetResource }: CreateButtonProps) => {
  const resource = useResourceContext();
  const createPath = useCreatePath();
  const resourceName = targetResource ?? resource;
  const link = createPath({
    resource: resourceName,
    type: "create",
  });
  return (
    <Link className={buttonVariants({ variant: "outline" })} to={link} onClick={stopPropagation}>
      <Plus />
      <Translate i18nKey={label ?? "ra.action.create"}>{label ?? "Create"}</Translate>
    </Link>
  );
};

// useful to prevent click bubbling in a datagrid with rowClick
const stopPropagation = (e: React.MouseEvent) => e.stopPropagation();
