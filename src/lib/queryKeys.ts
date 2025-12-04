/**
 * Query Key Factory for Custom TanStack Query Hooks
 *
 * IMPORTANT: This file is for custom hooks that bypass React Admin's data layer.
 *
 * DO NOT use these keys with React Admin hooks (useGetList, useUpdate, useCreate, etc.)
 * React Admin auto-generates query keys internally following the pattern:
 *   [resource, 'getList', { pagination, sort, filter, meta }]
 *   [resource, 'getOne', { id, meta }]
 *   [resource, 'getMany', { ids, meta }]
 *
 * USE CASES for this factory:
 * - Dashboard aggregation queries (useKPIMetrics, useTeamActivities)
 * - Custom report generation
 * - Direct TanStack Query hooks outside React Admin's data flow
 * - Edge Functions that return non-standard data shapes
 *
 * Enables type-safe, hierarchical keys for surgical cache invalidation.
 *
 * @see https://tkdodo.eu/blog/effective-react-query-keys
 * @see https://github.com/lukemorales/query-key-factory
 */

// Type for filter objects
type FilterValue = string | number | boolean | null | undefined | Record<string, unknown>;

export const queryKeys = {
  // Activities
  activities: {
    all: ["activities"] as const,
    lists: () => [...queryKeys.activities.all, "list"] as const,
    list: (filters?: FilterValue) => [...queryKeys.activities.lists(), { filters }] as const,
    details: () => [...queryKeys.activities.all, "detail"] as const,
    detail: (id: number | string) => [...queryKeys.activities.details(), id] as const,
    log: (organizationId?: number | string) => [...queryKeys.activities.all, "log", organizationId] as const,
  },

  // Opportunities
  opportunities: {
    all: ["opportunities"] as const,
    lists: () => [...queryKeys.opportunities.all, "list"] as const,
    list: (filters?: FilterValue) => [...queryKeys.opportunities.lists(), { filters }] as const,
    details: () => [...queryKeys.opportunities.all, "detail"] as const,
    detail: (id: number | string) => [...queryKeys.opportunities.details(), id] as const,
    byPrincipal: (principalId: number | string) => [...queryKeys.opportunities.all, "byPrincipal", principalId] as const,
    byOrganization: (orgId: number | string) => [...queryKeys.opportunities.all, "byOrganization", orgId] as const,
  },

  // Contacts
  contacts: {
    all: ["contacts"] as const,
    lists: () => [...queryKeys.contacts.all, "list"] as const,
    list: (filters?: FilterValue) => [...queryKeys.contacts.lists(), { filters }] as const,
    details: () => [...queryKeys.contacts.all, "detail"] as const,
    detail: (id: number | string) => [...queryKeys.contacts.details(), id] as const,
    byOrganization: (orgId: number | string) => [...queryKeys.contacts.all, "byOrganization", orgId] as const,
  },

  // Organizations
  organizations: {
    all: ["organizations"] as const,
    lists: () => [...queryKeys.organizations.all, "list"] as const,
    list: (filters?: FilterValue) => [...queryKeys.organizations.lists(), { filters }] as const,
    details: () => [...queryKeys.organizations.all, "detail"] as const,
    detail: (id: number | string) => [...queryKeys.organizations.details(), id] as const,
  },

  // Tasks
  tasks: {
    all: ["tasks"] as const,
    lists: () => [...queryKeys.tasks.all, "list"] as const,
    list: (filters?: FilterValue) => [...queryKeys.tasks.lists(), { filters }] as const,
    details: () => [...queryKeys.tasks.all, "detail"] as const,
    detail: (id: number | string) => [...queryKeys.tasks.details(), id] as const,
    myTasks: (salesId: number | string) => [...queryKeys.tasks.all, "myTasks", salesId] as const,
  },

  // Products
  products: {
    all: ["products"] as const,
    lists: () => [...queryKeys.products.all, "list"] as const,
    list: (filters?: FilterValue) => [...queryKeys.products.lists(), { filters }] as const,
    details: () => [...queryKeys.products.all, "detail"] as const,
    detail: (id: number | string) => [...queryKeys.products.details(), id] as const,
    byPrincipal: (principalId: number | string) => [...queryKeys.products.all, "byPrincipal", principalId] as const,
  },

  // Sales/Users
  sales: {
    all: ["sales"] as const,
    lists: () => [...queryKeys.sales.all, "list"] as const,
    details: () => [...queryKeys.sales.all, "detail"] as const,
    detail: (id: number | string) => [...queryKeys.sales.details(), id] as const,
    current: () => [...queryKeys.sales.all, "current"] as const,
  },

  // Audit Trail
  auditTrail: {
    all: ["audit_trail"] as const,
    byRecord: (tableName: string, recordId: number | string) =>
      [...queryKeys.auditTrail.all, tableName, recordId] as const,
  },

  // Dashboard / Aggregates
  dashboard: {
    all: ["dashboard"] as const,
    principalPipeline: (filters?: FilterValue) => [...queryKeys.dashboard.all, "principalPipeline", { filters }] as const,
    teamActivities: (limit?: number) => [...queryKeys.dashboard.all, "teamActivities", limit] as const,
  },

  // Settings
  settings: {
    all: ["settings"] as const,
    digestPreference: () => [...queryKeys.settings.all, "digestPreference"] as const,
  },
} as const;

/**
 * Example usage for CUSTOM hooks:
 *
 * // Custom hook for dashboard data (bypasses React Admin):
 * const { data } = useQuery({
 *   queryKey: queryKeys.dashboard.principalPipeline({ principalId: 5 }),
 *   queryFn: () => supabase.rpc('get_principal_pipeline_stats', { principal_id: 5 })
 * });
 *
 * // Custom hook for Edge Function:
 * const { data } = useQuery({
 *   queryKey: queryKeys.dashboard.teamActivities(10),
 *   queryFn: () => supabase.functions.invoke('get-team-activity-feed')
 * });
 *
 * // Cache invalidation from mutations:
 * queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
 *
 * // WRONG - Don't use with React Admin hooks:
 * // const { data } = useGetList('opportunities', { ... }); // ❌ Uses auto-generated keys
 */
