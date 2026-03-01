import React from "react";
import { buttonVariants } from "@/components/ui/button.constants";
import { Plus } from "lucide-react";
import {
  useCanAccess,
  Translate,
  useCreatePath,
  useResourceContext,
  useGetResourceLabel,
  useTranslate,
} from "ra-core";
import { Link } from "react-router-dom";
import type { VariantProps } from "class-variance-authority";

type ButtonVariant = VariantProps<typeof buttonVariants>["variant"];

export interface CreateButtonProps {
  label?: string;
  resource?: string;
  variant?: ButtonVariant;
  dataTutorial?: string;
}

export const CreateButton = ({
  label,
  resource: targetResource,
  variant = "default",
  dataTutorial,
}: CreateButtonProps) => {
  const resource = useResourceContext();
  const createPath = useCreatePath();
  const resourceName = targetResource ?? resource;
  const translate = useTranslate();
  const getResourceLabel = useGetResourceLabel();
  const singularLabel = resourceName ? getResourceLabel(resourceName, 1) : "";

  let displayLabel: string;
  let i18nKey: string;
  if (label) {
    // Explicit label — preserves current i18nKey=label behavior exactly
    displayLabel = label;
    i18nKey = label;
  } else if (singularLabel) {
    // Synthesize from localized verb + resource label
    const createVerb = translate("ra.action.create");
    displayLabel = `${createVerb} ${singularLabel}`;
    i18nKey = `resources.${resourceName}.action.create`;
  } else {
    // Bare fallback
    displayLabel = translate("ra.action.create");
    i18nKey = "ra.action.create";
  }

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
    <Link
      className={buttonVariants({ variant })}
      to={link}
      onClick={stopPropagation}
      data-tutorial={dataTutorial}
    >
      <Plus />
      <Translate i18nKey={i18nKey}>{displayLabel}</Translate>
    </Link>
  );
};

// useful to prevent click bubbling in a datagrid with rowClick
const stopPropagation = (e: React.MouseEvent) => e.stopPropagation();
