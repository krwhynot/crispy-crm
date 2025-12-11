import { UserList } from "../../admin/users";

/**
 * Users management section for Settings page
 * Admin-only: Shows team member list with invite/edit capabilities
 */
export const UsersSection = () => {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-medium">Team Management</h3>
        <p className="text-sm text-muted-foreground">
          Manage team members, roles, and permissions
        </p>
      </div>
      <UserList />
    </div>
  );
};
