import { useState } from "react";
import { List, Datagrid, TextField, EmailField, DateField, useRefresh } from "react-admin";
import { UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RoleBadgeField } from "./components/RoleBadgeField";
import { StatusField } from "./components/StatusField";
import { UserInviteForm } from "./UserInviteForm";

export const UserList = () => {
  const [inviteOpen, setInviteOpen] = useState(false);
  const refresh = useRefresh();

  const handleInviteSuccess = () => {
    setInviteOpen(false);
    refresh();
  };

  return (
    <>
      <List
        title={<h1>Team Management</h1>}
        resource="sales"
        actions={
          <Button
            onClick={() => setInviteOpen(true)}
            className="h-11 px-4"
            aria-label="Invite team member"
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Invite
          </Button>
        }
        sort={{ field: "created_at", order: "DESC" }}
        perPage={25}
      >
        <Datagrid rowClick="edit" bulkActionButtons={false}>
          <TextField source="first_name" label="First Name" />
          <TextField source="last_name" label="Last Name" />
          <EmailField source="email" />
          <RoleBadgeField source="role" />
          <StatusField source="disabled" />
          <DateField source="created_at" label="Joined" />
        </Datagrid>
      </List>

      <UserInviteForm
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        onSuccess={handleInviteSuccess}
      />
    </>
  );
};
