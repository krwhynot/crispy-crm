# Constitution Violations
Generated: Sat Dec 13 11:48:25 CST 2025

## Direct Supabase Imports (should go through unifiedDataProvider)
src/atomic-crm/root/CRM.tsx:2:import { ForgotPasswordPage } from "@/components/supabase/forgot-password-page";
src/atomic-crm/root/CRM.tsx:3:import { SetPasswordPage } from "@/components/supabase/set-password-page";
src/atomic-crm/root/i18nProvider.tsx:4:import { raSupabaseEnglishMessages } from "ra-supabase-language-english";

## Retry Logic (fail-fast violation)
src/components/ResourceErrorBoundary.tsx:12: * - Allows retry without full page reload
src/atomic-crm/organizations/OrganizationType.spec.tsx:108:      queries: { retry: false },
src/atomic-crm/organizations/OrganizationType.spec.tsx:109:      mutations: { retry: false },
src/atomic-crm/organizations/OrganizationList.spec.tsx:119:      queries: { retry: false },
src/atomic-crm/organizations/OrganizationList.spec.tsx:120:      mutations: { retry: false },
src/atomic-crm/utils/levenshtein.ts:9: * without complex retry logic or circuit breakers.
src/atomic-crm/contacts/ContactImportDialog.tsx:589:   * Renders the error state with error message and retry option.
src/atomic-crm/contacts/ContactList.spec.tsx:105:      queries: { retry: false },
src/atomic-crm/contacts/ContactList.spec.tsx:106:      mutations: { retry: false },
src/atomic-crm/opportunities/hooks/useFilteredProducts.ts:17: * - Fail fast: No retry logic
src/atomic-crm/opportunities/hooks/useQuickAdd.ts:16: * - No retry logic per Engineering Constitution (fail fast)
src/atomic-crm/opportunities/hooks/useSimilarOpportunityCheck.ts:13: * - P1: Fail-fast - no retry logic or circuit breakers

## Circuit Breaker Patterns (fail-fast violation)
src/atomic-crm/utils/levenshtein.ts:9: * without complex retry logic or circuit breakers.
src/atomic-crm/providers/supabase/unifiedDataProvider.errors.test.ts:5: * Following "fail fast" principle - no circuit breakers, no retries
src/atomic-crm/providers/supabase/extensions/customMethodsExtension.ts:139: * - Fail-fast approach (no circuit breakers)
src/atomic-crm/opportunities/hooks/useSimilarOpportunityCheck.ts:13: * - P1: Fail-fast - no retry logic or circuit breakers

## TypeScript 'any' Usage (type safety violation)
src/atomic-crm/organizations/OrganizationImportResult.tsx:26:  value?: any;
src/atomic-crm/organizations/OrganizationImportDialog.tsx:95:      rawRow: any[],
src/atomic-crm/organizations/OrganizationImportDialog.tsx:101:      const mappedRow: any = {};
src/atomic-crm/organizations/OrganizationImportDialog.tsx:154:      rows: any[],
src/atomic-crm/organizations/OrganizationImportDialog.tsx:319:      rows: any[],
src/atomic-crm/organizations/OrganizationImportDialog.tsx:585:    async (batch: any[]) => {
src/atomic-crm/organizations/OrganizationImportDialog.tsx:608:      } catch (error: any) {
src/atomic-crm/organizations/OrganizationImportDialog.tsx:690:      } catch (error: any) {
src/atomic-crm/organizations/OrganizationImportDialog.tsx:743:        const rows = results.data as any[];
src/atomic-crm/organizations/useOrganizationImport.tsx:28:  value?: any;
src/atomic-crm/organizations/useOrganizationImport.tsx:33:  data: any;
src/atomic-crm/organizations/useOrganizationImport.tsx:201:          } catch (error: any) {
src/atomic-crm/organizations/useOrganizationImport.tsx:232:          const value = result.value as any;
src/atomic-crm/organizations/OrganizationSlideOver.tsx:60:      countFromRecord: (record: any) => record.nb_contacts,
src/atomic-crm/organizations/OrganizationSlideOver.tsx:67:      countFromRecord: (record: any) => record.nb_opportunities,
src/atomic-crm/organizations/OrganizationSlideOver.tsx:74:      countFromRecord: (record: any) => record.nb_notes,
src/atomic-crm/organizations/OrganizationSlideOver.tsx:92:  const recordRepresentation = (record: any) => {
src/atomic-crm/organizations/OrganizationCreate.tsx:41:  onDuplicateFound: (name: string, values: any) => void;
src/atomic-crm/organizations/OrganizationCreate.tsx:138:  const parentOrgId = (location.state as any)?.record?.parent_organization_id;
src/atomic-crm/organizations/OrganizationCreate.tsx:142:  const transformValues = useCallback((values: any) => {
src/atomic-crm/organizations/OrganizationCreate.tsx:150:  const handleDuplicateFound = useCallback((_duplicateName: string, values: any) => {
src/atomic-crm/organizations/OrganizationCreate.tsx:171:          onError: (error: any) => {
src/atomic-crm/organizations/OrganizationCreate.tsx:249:  onDuplicateFound: (name: string, values: any) => void;
src/atomic-crm/organizations/organizationImport.logic.ts:114:export function validateOrganizationRow(row: any): ValidationResult {
src/atomic-crm/organizations/slideOverTabs/OrganizationContactsTab.tsx:16:  email?: any[];
src/atomic-crm/organizations/slideOverTabs/OrganizationDetailsTab.tsx:187:                      {record.context_links.map((link: any, index: number) => (
src/atomic-crm/organizations/OrganizationList.tsx:62:    const exportedOrg: any = {
src/atomic-crm/organizations/OrganizationList.tsx:103:  return jsonExport(organizations, {}, (_err: any, csv: string) => {
src/atomic-crm/organizations/OrganizationList.tsx:155:            render={(record: any) => <OrganizationTypeBadge type={record.organization_type} />}
src/atomic-crm/organizations/OrganizationList.tsx:162:            render={(record: any) => <PriorityBadge priority={record.priority} />}

## z.object Without strictObject (mass assignment risk)
src/atomic-crm/validation/rpc.ts:90:export const checkAuthorizationResponseSchema = z.object({
src/atomic-crm/validation/rpc.ts:130: * Uses z.object() to tolerate additional fields from database
src/atomic-crm/validation/rpc.ts:132:export const checkAuthorizationBatchResponseSchema = z.object({
src/atomic-crm/validation/rpc.ts:164:  // Example: process_csv_import: z.object({ ... })

## Zod Strings Without .max() (DoS risk)
src/atomic-crm/validation/operatorSegments.ts:177:  id: z.string().uuid().optional(),
src/atomic-crm/validation/operatorSegments.ts:180:  parent_id: z.string().uuid().nullable().optional(),
src/atomic-crm/validation/operatorSegments.ts:181:  created_at: z.string().optional(),
src/atomic-crm/validation/operatorSegments.ts:182:  created_by: z.string().uuid().optional(),
src/atomic-crm/validation/sales.ts:42:  id: z.union([z.string(), z.number()]).optional(),
src/atomic-crm/validation/sales.ts:45:  email: z.string().email("Must be a valid email address"),
src/atomic-crm/validation/sales.ts:46:  phone: z.string().nullish(),
src/atomic-crm/validation/sales.ts:47:  avatar_url: z.string().url("Must be a valid URL").optional().nullable(),
src/atomic-crm/validation/sales.ts:48:  user_id: z.string().uuid("Must be a valid UUID").optional(),
src/atomic-crm/validation/sales.ts:67:  created_at: z.string().optional(),
src/atomic-crm/validation/sales.ts:68:  updated_at: z.string().optional(),
src/atomic-crm/validation/sales.ts:69:  deleted_at: z.string().optional().nullable(),
src/atomic-crm/validation/segments.ts:80:  id: z.string().uuid().optional(),
src/atomic-crm/validation/segments.ts:83:  parent_id: z.string().uuid().nullable().optional(),
src/atomic-crm/validation/segments.ts:85:  created_at: z.string().optional(),
src/atomic-crm/validation/segments.ts:86:  created_by: z.string().uuid().optional(),
src/atomic-crm/validation/organizationDistributors.ts:23:    id: z.union([z.string(), z.number()]).optional(),
src/atomic-crm/validation/organizationDistributors.ts:37:    created_at: z.string().optional(),
src/atomic-crm/validation/organizationDistributors.ts:38:    updated_at: z.string().optional(),
src/atomic-crm/validation/organizationDistributors.ts:39:    deleted_at: z.string().optional().nullable(),

## Non-String Inputs Without z.coerce
src/atomic-crm/validation/quickAdd.ts:40:    product_ids: z.array(z.number()).optional().default([]),
src/atomic-crm/validation/sales.ts:42:  id: z.union([z.string(), z.number()]).optional(),
src/atomic-crm/validation/organizationDistributors.ts:23:    id: z.union([z.string(), z.number()]).optional(),
src/atomic-crm/validation/notes.ts:19:  size: z.number().positive().optional(),
src/atomic-crm/validation/notes.ts:35:    z.number().min(1, "Sales ID is required"),
src/atomic-crm/validation/notes.ts:42:  id: z.union([z.string(), z.number()]).optional(),
src/atomic-crm/validation/notes.ts:55:    z.number().min(1, "Contact ID is required"),
src/atomic-crm/validation/notes.ts:65:    z.number().min(1, "Opportunity ID is required"),
src/atomic-crm/validation/notes.ts:76:    z.number().min(1, "Organization ID is required"),
src/atomic-crm/validation/activities.ts:71:  id: z.union([z.string(), z.number()]).optional(),
src/atomic-crm/validation/activities.ts:81:  duration_minutes: z.number().int().positive().optional().nullable(),
src/atomic-crm/validation/activities.ts:84:  contact_id: z.union([z.string(), z.number()]).optional().nullable(),
src/atomic-crm/validation/activities.ts:85:  organization_id: z.union([z.string(), z.number()]).optional().nullable(),
src/atomic-crm/validation/activities.ts:86:  opportunity_id: z.union([z.string(), z.number()]).optional().nullable(),
src/atomic-crm/validation/activities.ts:108:    .array(z.union([z.string(), z.number()]))
src/atomic-crm/validation/activities.ts:117:  created_by: z.union([z.string(), z.number()]).optional().nullable(),
src/atomic-crm/validation/activities.ts:245:    opportunity_id: z.union([z.string(), z.number()]), // Required for interactions
src/atomic-crm/validation/activities.ts:526:    date: z.date().default(() => new Date()),
src/atomic-crm/validation/activities.ts:527:    duration: z.number().min(0).optional(),
src/atomic-crm/validation/activities.ts:528:    contactId: z.number().optional(),

## Form-Level Validation (should be at API boundary only)
src/atomic-crm/opportunities/components/CloseOpportunityModal.tsx:3:import { zodResolver } from "@hookform/resolvers/zod";
src/atomic-crm/opportunities/components/CloseOpportunityModal.tsx:92:    resolver: zodResolver(closeOpportunitySchema),
src/atomic-crm/opportunities/quick-add/QuickAddForm.tsx:4:import { zodResolver } from "@hookform/resolvers/zod";
src/atomic-crm/opportunities/quick-add/QuickAddForm.tsx:62:    resolver: zodResolver(quickAddSchema),
src/atomic-crm/opportunities/ActivityNoteForm.tsx:1:import { zodResolver } from "@hookform/resolvers/zod";
src/atomic-crm/opportunities/ActivityNoteForm.tsx:93:    resolver: zodResolver(activityNoteFormSchema),
src/atomic-crm/dashboard/v3/__tests__/performance.benchmark.test.tsx:436:vi.mock("@hookform/resolvers/zod", () => ({
src/atomic-crm/dashboard/v3/__tests__/performance.benchmark.test.tsx:437:  zodResolver: () => async (values: any) => ({ values, errors: {} }),
src/atomic-crm/dashboard/v3/components/__tests__/QuickLogForm.cascading.test.tsx:261:// Mock @hookform/resolvers/zod
src/atomic-crm/dashboard/v3/components/__tests__/QuickLogForm.cascading.test.tsx:262:vi.mock("@hookform/resolvers/zod", () => ({
src/atomic-crm/dashboard/v3/components/__tests__/QuickLogForm.cascading.test.tsx:263:  zodResolver: () => async (values: any) => ({ values, errors: {} }),
src/atomic-crm/dashboard/v3/components/QuickLogForm.tsx:1:import { zodResolver } from "@hookform/resolvers/zod";
src/atomic-crm/dashboard/v3/components/QuickLogForm.tsx:93:    resolver: zodResolver(activityLogSchema),

---
Agent 4 complete ✅
