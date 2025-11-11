import React from "react";
import { Link } from "react-router-dom";
import { buttonVariants } from "@/components/ui/button.constants";
import { Eye } from "lucide-react";
import { Translate, useCreatePath, useRecordContext, useResourceContext } from "ra-core";

export interface ShowButtonProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  label?: string;
  icon?: React.ReactNode;
}

export const ShowButton = (props: ShowButtonProps) => {
  const resource = useResourceContext();
  const record = useRecordContext();
  const createPath = useCreatePath();
  const link = createPath({
    resource,
    type: "show",
    id: record?.id,
  });
  const { label, icon, ...rest } = props;
  return (
    <Link
      className={buttonVariants({ variant: "outline" })}
      to={link}
      onClick={stopPropagation}
      {...rest}
    >
      {icon ?? <Eye />}
      <Translate i18nKey={label ?? "ra.action.show"}>{label ?? "Show"}</Translate>
    </Link>
  );
};

// useful to prevent click bubbling in a datagrid with rowClick
const stopPropagation = (e: React.MouseEvent) => e.stopPropagation();
