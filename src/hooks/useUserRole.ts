import { useGetIdentity, type Identifier } from "react-admin";

export type UserRole = "admin" | "manager" | "rep";

export interface UserIdentity {
  id: Identifier;
  fullName: string;
  avatar?: string;
  role: UserRole;
}

/**
 * Hook to access the current user's role and role-based permissions
 *
 * @example
 * ```tsx
 * const { role, isAdmin, isManager, isManagerOrAdmin } = useUserRole();
 *
 * if (isAdmin) {
 *   return <DeleteButton />;
 * }
 * ```
 */
export const useUserRole = () => {
  const { data: identity, isLoading } = useGetIdentity<UserIdentity>();

  const role = identity?.role || "rep";

  return {
    role,
    isAdmin: role === "admin",
    isManager: role === "manager",
    isRep: role === "rep",
    isManagerOrAdmin: role === "admin" || role === "manager",
    isLoading,
  };
};
