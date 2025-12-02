import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, X } from "lucide-react";

interface Permission {
  name: string;
  rep: boolean;
  manager: boolean;
  admin: boolean;
}

interface PermissionCategory {
  category: string;
  permissions: Permission[];
}

const PERMISSIONS: PermissionCategory[] = [
  {
    category: "Records",
    permissions: [
      { name: "View all contacts", rep: true, manager: true, admin: true },
      { name: "Edit own records", rep: true, manager: true, admin: true },
      { name: "Edit team records", rep: false, manager: true, admin: true },
      { name: "Delete records", rep: false, manager: false, admin: true },
    ],
  },
  {
    category: "Opportunities",
    permissions: [
      { name: "View all opportunities", rep: true, manager: true, admin: true },
      { name: "Create opportunities", rep: true, manager: true, admin: true },
      { name: "Edit any opportunity", rep: false, manager: true, admin: true },
      { name: "Archive opportunities", rep: false, manager: true, admin: true },
    ],
  },
  {
    category: "Administration",
    permissions: [
      { name: "View user list", rep: false, manager: true, admin: true },
      { name: "Create users", rep: false, manager: false, admin: true },
      { name: "Modify user roles", rep: false, manager: false, admin: true },
      { name: "Remove users", rep: false, manager: false, admin: true },
    ],
  },
];

interface RolePermissionsMatrixProps {
  currentRole: "admin" | "manager" | "rep";
}

export function RolePermissionsMatrix({ currentRole }: RolePermissionsMatrixProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">Your Role:</span>
        <Badge variant="outline" className="capitalize">
          {currentRole}
        </Badge>
      </div>

      <div className="space-y-4">
        {PERMISSIONS.map((category) => (
          <Card key={category.category}>
            <CardHeader>
              <CardTitle className="text-base">{category.category}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {category.permissions.map((permission) => {
                  const isAllowed = permission[currentRole];
                  return (
                    <div
                      key={permission.name}
                      className="flex items-center justify-between py-2 border-b last:border-b-0"
                    >
                      <span className="text-sm">{permission.name}</span>
                      {isAllowed ? (
                        <Check className="h-4 w-4 text-success" />
                      ) : (
                        <X className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
