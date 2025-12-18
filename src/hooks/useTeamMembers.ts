import { useGetList } from "ra-core";

export interface TeamMember {
  id: number;
  fullName: string;
  firstName: string;
  lastName: string;
  role: "admin" | "manager" | "rep";
}

export interface UseTeamMembersReturn {
  teamMembers: TeamMember[];
  isLoading: boolean;
  error: Error | null;
}

export const useTeamMembers = (): UseTeamMembersReturn => {
  const { data, isLoading, error } = useGetList("sales", {
    pagination: { page: 1, perPage: 100 },
    sort: { field: "first_name", order: "ASC" },
    filter: { disabled: false, deleted_at: null },
  });

  const teamMembers: TeamMember[] = data
    ? data.map((sale) => ({
        id: sale.id as number,
        fullName: `${sale.first_name} ${sale.last_name}`,
        firstName: sale.first_name as string,
        lastName: sale.last_name as string,
        role: (sale.role || "rep") as "admin" | "manager" | "rep",
      }))
    : [];

  return {
    teamMembers,
    isLoading,
    error: error || null,
  };
};
