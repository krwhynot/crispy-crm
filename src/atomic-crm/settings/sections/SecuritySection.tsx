import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Key, Shield } from "lucide-react";
import { useGetIdentity } from "ra-core";
import { RolePermissionsMatrix } from "../RolePermissionsMatrix";

interface SecuritySectionProps {
  onPasswordChange: () => void;
}

export function SecuritySection({ onPasswordChange }: SecuritySectionProps) {
  const { data: identity } = useGetIdentity();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Security
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <Key className="h-4 w-4" />
              <Label>Password</Label>
            </div>
            <p className="text-sm text-muted-foreground">Change your account password</p>
          </div>
          <Button variant="outline" onClick={onPasswordChange} className="min-h-[44px]">
            Change Password
          </Button>
        </div>

        <div className="border-t pt-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Account Role</Label>
              <p className="text-sm text-muted-foreground">Your access level in the system</p>
            </div>
            <Badge variant="outline" className="capitalize">
              {identity?.role || "rep"}
            </Badge>
          </div>
        </div>

        <div className="border-t pt-4">
          <div className="space-y-2 mb-4">
            <Label>Role Permissions</Label>
            <p className="text-sm text-muted-foreground">
              What you can do with your current role
            </p>
          </div>
          <RolePermissionsMatrix currentRole={identity?.role || "rep"} />
        </div>
      </CardContent>
    </Card>
  );
}
