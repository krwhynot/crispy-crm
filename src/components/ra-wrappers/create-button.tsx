import React from "react";
import { buttonVariants } from "@/components/ui/button.constants";
import { Plus } from "lucide-react";
import { useCanAccess, Translate, useCreatePath, useResourceContext } from "ra-core";
import { Link } from "react-router-dom";

export interface CreateButtonProps {
  label?: string;
  resource?: string;
}

export const CreateButton = ({ label, resource: targetResource }: CreateButtonProps) => {
  const resource = useResourceContext();
  const createPath = useCreatePath();
  const resourceName = targetResource ?? resource;

  // RBAC: Only show button if user can create this resource
  const { canAccess, isPending } = useCanAccess({
    resource: resourceName,
    action: "create",
  });

  if (isPending || !canAccess) return null;

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
