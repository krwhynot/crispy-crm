import React from "react";
import { buttonVariants } from "@/components/ui/button.constants";
import { Plus } from "lucide-react";
import { useCanAccess, Translate, useCreatePath, useResourceContext } from "ra-core";
import { Link } from "react-router-dom";
import type { VariantProps } from "class-variance-authority";

type ButtonVariant = VariantProps<typeof buttonVariants>["variant"];

export interface CreateButtonProps {
  label?: string;
  resource?: string;
  variant?: ButtonVariant;
}

export const CreateButton = ({
  label,
  resource: targetResource,
  variant = "default",
}: CreateButtonProps) => {
  const resource = useResourceContext();
  const createPath = useCreatePath();
  const resourceName = targetResource ?? resource;

  // RBAC: Only show button if user can create this resource
  let canAccess = true;
  let isPending = false;
  try {
    const access = useCanAccess({
      resource: resourceName ?? "",
      action: "create",
    });
    canAccess = access.canAccess;
    isPending = access.isPending;
  } catch {
    canAccess = Boolean(resourceName);
    isPending = false;
  }

  if (!resourceName || isPending || !canAccess) return null;

  const link = createPath({
    resource: resourceName,
    type: "create",
  });
  return (
    <Link className={buttonVariants({ variant })} to={link} onClick={stopPropagation}>
      <Plus />
      <Translate i18nKey={label ?? "ra.action.create"}>{label ?? "Create"}</Translate>
    </Link>
  );
};

// useful to prevent click bubbling in a datagrid with rowClick
const stopPropagation = (e: React.MouseEvent) => e.stopPropagation();
