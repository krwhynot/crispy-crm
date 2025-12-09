import { useRecordContext } from "react-admin";
import { Badge } from "@/components/ui/badge";
import { ROLE_COLORS, type UserRole } from "../schemas";

interface RoleBadgeFieldProps {
  source?: string;
}

export const RoleBadgeField = ({ source = "role" }: RoleBadgeFieldProps) => {
  const record = useRecordContext();
  if (!record) return null;

  const role = record[source] as UserRole;
  const colorClass = ROLE_COLORS[role] || ROLE_COLORS.rep;

  return (
    <Badge className={colorClass} variant="outline">
      {role.charAt(0).toUpperCase() + role.slice(1)}
    </Badge>
  );
};

RoleBadgeField.defaultProps = {
  label: "Role",
};
