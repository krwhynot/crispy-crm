-- ============================================================================
-- RLS Policy Documentation - Phase 1 Security Remediation
-- ============================================================================
--
-- Migration Purpose: Add documentation comments to tables and RLS policies
-- NO FUNCTIONAL CHANGES - only adds descriptive comments
--
-- Security Model: Single-Tenant Trusted Team
-- - All authenticated users can view/modify shared data (intentional)
-- - Authentication boundary prevents external access
-- - Compensating controls: audit trails, soft-deletes, rate limiting
--
-- See /docs/SECURITY_MODEL.md for complete security documentation
--
-- Date: 2025-11-08
-- Context: Phase 1 security remediation after security audit
-- ============================================================================

-- ============================================================================
-- TABLE COMMENTS: Document Security Model
-- ============================================================================

COMMENT ON TABLE public.contacts IS
'Customer contact information.
RLS Policy: Shared access (all authenticated users can view/modify).
Rationale: Team collaboration requires full visibility into customer relationships.
Protection: Authentication boundary + audit trail + soft-deletes.
See /docs/SECURITY_MODEL.md for details.';

COMMENT ON TABLE public.organizations IS
'Customer organizations, principals, and distributors.
RLS Policy: Shared access (all authenticated users can view/modify).
Rationale: Sales team needs visibility into all customer accounts.
Protection: Authentication boundary + audit trail + soft-deletes.
See /docs/SECURITY_MODEL.md for details.';

COMMENT ON TABLE public.opportunities IS
'Sales opportunities and deals.
RLS Policy: Shared access (all authenticated users can view/modify).
Rationale: Coordination requires team-wide visibility to avoid duplicate outreach.
Protection: Authentication boundary + audit trail + soft-deletes.
See /docs/SECURITY_MODEL.md for details.';

COMMENT ON TABLE public.tasks IS
'Personal task management.
RLS Policy: Creator-only access (users see only their own tasks).
Rationale: Tasks are individual to-do items, not team-shared data.
Implementation: created_by matches current user''s sales.id.
See /docs/SECURITY_MODEL.md for details.';

COMMENT ON TABLE public.activities IS
'Team activities and customer interactions.
RLS Policy: Shared access (all authenticated users can view/modify).
Rationale: Activity log shows team collaboration history.
Protection: Authentication boundary + audit trail + soft-deletes.
See /docs/SECURITY_MODEL.md for details.';

COMMENT ON TABLE public.products IS
'Product catalog for opportunities.
RLS Policy: Shared access (all authenticated users can view/modify).
Rationale: Product catalog is shared resource for entire team.
Protection: Authentication boundary + audit trail + soft-deletes.
See /docs/SECURITY_MODEL.md for details.';

COMMENT ON TABLE public."contactNotes" IS
'Notes attached to contacts.
RLS Policy: Shared access (all authenticated users can view/modify).
Rationale: Notes provide context for entire team when working with contacts.
Protection: Authentication boundary + audit trail + soft-deletes.
See /docs/SECURITY_MODEL.md for details.';

COMMENT ON TABLE public."opportunityNotes" IS
'Notes attached to opportunities.
RLS Policy: Shared access (all authenticated users can view/modify).
Rationale: Notes provide context for entire team when working with opportunities.
Protection: Authentication boundary + audit trail + soft-deletes.
See /docs/SECURITY_MODEL.md for details.';

COMMENT ON TABLE public.sales IS
'Sales team members and authentication.
Contains is_admin field for role-based features.
RLS Policy: Shared access (users can see all team members).
Rationale: Team roster visibility for collaboration and assignment.
See /docs/SECURITY_MODEL.md for details.';

COMMENT ON TABLE public.opportunity_products IS
'Junction table linking opportunities to products.
RLS Policy: Shared access (all authenticated users can view/modify).
Protection: Soft-deletes enabled (deleted_at column).
See /docs/SECURITY_MODEL.md for details.';

COMMENT ON TABLE public.notifications IS
'User notifications for overdue tasks and activities.
RLS Policy: Personal access (users see only their own notifications).
Protection: Soft-deletes enabled, automatic cleanup after 30 days.
See /docs/SECURITY_MODEL.md for details.';

-- ============================================================================
-- POLICY COMMENTS: Document Intent and Rationale
-- ============================================================================

COMMENT ON POLICY authenticated_select_contacts ON public.contacts IS
'Intentional shared access for team collaboration.
Protected by authentication boundary - only employees with valid credentials can access.
Compensating controls: audit trail tracks all reads, soft-deletes prevent permanent loss.';

COMMENT ON POLICY authenticated_insert_contacts ON public.contacts IS
'All authenticated users can create contacts.
Audit trail tracks creator via created_by field.';

COMMENT ON POLICY authenticated_update_contacts ON public.contacts IS
'All authenticated users can update any contact.
Audit trail tracks modifications with before/after values.';

COMMENT ON POLICY authenticated_delete_contacts ON public.contacts IS
'All authenticated users can delete contacts (soft-delete).
Deletes set deleted_at timestamp, enabling recovery.
Audit trail logs deletion with user ID.';

COMMENT ON POLICY authenticated_select_opportunities ON public.opportunities IS
'Intentional shared access for team collaboration.
Prevents duplicate outreach by providing visibility into all opportunities.
Protected by authentication boundary + audit trail.';

COMMENT ON POLICY authenticated_insert_opportunities ON public.opportunities IS
'All authenticated users can create opportunities.
Audit trail tracks creator via created_by field.';

COMMENT ON POLICY authenticated_update_opportunities ON public.opportunities IS
'All authenticated users can update any opportunity.
Enables collaboration without ownership barriers.
Audit trail tracks modifications.';

COMMENT ON POLICY authenticated_delete_opportunities ON public.opportunities IS
'All authenticated users can delete opportunities (soft-delete).
Deletes set deleted_at timestamp, enabling recovery.';

COMMENT ON POLICY authenticated_select_organizations ON public.organizations IS
'Intentional shared access for team collaboration.
Sales team needs visibility into all customer accounts and principals.
Protected by authentication boundary + audit trail.';

COMMENT ON POLICY authenticated_insert_organizations ON public.organizations IS
'All authenticated users can create organizations.
Audit trail tracks creator.';

COMMENT ON POLICY authenticated_update_organizations ON public.organizations IS
'All authenticated users can update any organization.
Audit trail tracks modifications.';

COMMENT ON POLICY authenticated_delete_organizations ON public.organizations IS
'All authenticated users can delete organizations (soft-delete).
Deletes set deleted_at timestamp, enabling recovery.';

COMMENT ON POLICY authenticated_select_tasks ON public.tasks IS
'Creator-only access for personal task management.
Users can only see tasks where created_by matches their sales.id.
Tasks are personal to-do lists, not shared team data.';

COMMENT ON POLICY authenticated_insert_tasks ON public.tasks IS
'Users can only create tasks for themselves.
Enforces created_by matches current user''s sales.id.';

COMMENT ON POLICY authenticated_update_tasks ON public.tasks IS
'Users can only update their own tasks.
Personal task management with no team visibility.';

COMMENT ON POLICY authenticated_delete_tasks ON public.tasks IS
'Users can only delete their own tasks (soft-delete).
Deletes set deleted_at timestamp, enabling recovery.';

COMMENT ON POLICY authenticated_select_activities ON public.activities IS
'Intentional shared access for team activity visibility.
Activity log shows collaboration history across entire team.';

COMMENT ON POLICY authenticated_insert_activities ON public.activities IS
'All authenticated users can create activities.
Audit trail tracks creator.';

COMMENT ON POLICY authenticated_update_activities ON public.activities IS
'All authenticated users can update any activity.
Audit trail tracks modifications.';

COMMENT ON POLICY authenticated_delete_activities ON public.activities IS
'All authenticated users can delete activities (soft-delete).
Deletes set deleted_at timestamp, enabling recovery.';

COMMENT ON POLICY authenticated_select_products ON public.products IS
'Intentional shared access for product catalog.
Product catalog is shared resource for entire sales team.';

COMMENT ON POLICY authenticated_insert_products ON public.products IS
'All authenticated users can create products.
Product catalog managed by entire team.';

COMMENT ON POLICY authenticated_update_products ON public.products IS
'All authenticated users can update any product.
Audit trail tracks modifications.';

COMMENT ON POLICY authenticated_delete_products ON public.products IS
'All authenticated users can delete products (soft-delete).
Deletes set deleted_at timestamp, enabling recovery.';

COMMENT ON POLICY authenticated_select_sales ON public.sales IS
'All authenticated users can see all team members.
Team roster visibility enables assignment and collaboration.';

-- ============================================================================
-- COLUMN COMMENTS: Document Key Security Fields
-- ============================================================================

COMMENT ON COLUMN public.sales.is_admin IS
'Role-based access control flag.
Currently minimal usage (mostly for future expansion).
Future use: Can restrict delete operations to admins only if needed.
Example: (SELECT is_admin FROM sales WHERE user_id = auth.uid()) = true';

COMMENT ON COLUMN public.sales.disabled IS
'Account disabled flag for offboarding.
Disabled users cannot authenticate even if auth.users record exists.
Set to true when employee leaves company.';

COMMENT ON COLUMN public.contacts.deleted_at IS
'Soft-delete timestamp.
NULL = active record, NOT NULL = deleted record.
Enables recovery from accidental deletes.
Filtered in application queries: WHERE deleted_at IS NULL';

COMMENT ON COLUMN public.opportunities.deleted_at IS
'Soft-delete timestamp.
NULL = active record, NOT NULL = deleted record.
Enables recovery from accidental deletes.';

COMMENT ON COLUMN public.organizations.deleted_at IS
'Soft-delete timestamp.
NULL = active record, NOT NULL = deleted record.
Enables recovery from accidental deletes.';

COMMENT ON COLUMN public.tasks.deleted_at IS
'Soft-delete timestamp.
NULL = active record, NOT NULL = deleted record.
Enables recovery from accidental deletes.';

COMMENT ON COLUMN public.activities.deleted_at IS
'Soft-delete timestamp.
NULL = active record, NOT NULL = deleted record.
Enables recovery from accidental deletes.';

COMMENT ON COLUMN public.products.deleted_at IS
'Soft-delete timestamp.
NULL = active record, NOT NULL = deleted record.
Enables recovery from accidental deletes.';

-- ============================================================================
-- HELPER FUNCTION COMMENTS
-- ============================================================================

COMMENT ON FUNCTION public.get_current_user_sales_id() IS
'Helper function to get current user''s sales record ID.
Returns sales.id for the authenticated user (auth.uid()).
Used in RLS policies for owner-based access control.';

COMMENT ON FUNCTION public.get_current_user_company_id() IS
'Placeholder for future multi-tenant expansion.
Currently returns NULL - no company isolation implemented.
To enable multi-tenant:
1. Add sales.company_id column
2. Update this function to return actual company_id
3. Replace USING (true) policies with company_id checks
See /docs/SECURITY_MODEL.md for expansion path.';

-- ============================================================================
-- MIGRATION SUMMARY
-- ============================================================================
--
-- Changes Made:
-- - Added table comments documenting RLS policy model
-- - Added policy comments explaining intent and rationale
-- - Added column comments for key security fields
-- - Added helper function comments
--
-- NO FUNCTIONAL CHANGES - only documentation
--
-- Next Steps:
-- 1. Review /docs/SECURITY_MODEL.md for complete context
-- 2. Apply migration: npx supabase db push
-- 3. Verify comments in database: \d+ contacts (in psql)
--
-- Related Migrations:
-- - 20251029024045_fix_rls_policies_company_isolation.sql (current RLS policies)
-- - 20251103232837_create_audit_trail_system.sql (audit logging)
-- - 20251108051117_add_soft_delete_columns.sql (soft-delete columns)
--
-- ============================================================================
