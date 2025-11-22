# Unified Design System Rollout - Architecture Reference

This document provides high-level architectural context for implementing the unified design system across all six resources (Contacts, Organizations, Opportunities, Tasks, Sales, Products). The rollout transforms inconsistent list/detail views into a cohesive system using `StandardListLayout`, `ResourceSlideOver`, and `PremiumDatagrid` components with premium interactive effects.

## Architecture Overview

The unified design system builds on three pillars: (1) **React Admin's headless core** for data fetching and state management, (2) **shadcn/ui design system** with Tailwind v4 semantic tokens, and (3) **Supabase views** for optimized data delivery. Resources currently use mixed patterns (card grids, tables, Kanban boards, accordion groups) with inconsistent filters (sidebar vs inline vs none). The rollout standardizes on: sidebar filters (256px, sticky) + main content area with tables + slide-over panels (40vw, 480-720px) for view/edit + full-page create forms (max-w-4xl, centered).

## Relevant Files

### Core Design System Files
- `/src/index.css`: Tailwind v4 configuration via `@theme inline`, 150+ OKLCH color tokens, spacing system (desktop-optimized), elevation system (3-tier warm shadows), utility classes (@layer utilities), tag colors
- `/src/lib/design-system/accessibility.ts`: focusRing constant (3px ring), srOnly utility, useAriaAnnounce hook, useKeyboardNavigation hook, WCAG compliance helpers
- `/src/lib/design-system/spacing.ts`: TOUCH_TARGET_MIN (44px), TOUCH_TARGET_STANDARD (48px), validateTouchTarget function, spacing constants

### Existing List View Implementations
- `/src/atomic-crm/contacts/ContactList.tsx`: Card-based rows with sidebar filters (w-52), premium hover effects (border reveal, shadow-md, -translate-y-0.5), stretched link pattern with z-indexed checkboxes/buttons
- `/src/atomic-crm/organizations/OrganizationList.tsx`: Dual view (grid + table), view switcher with localStorage persistence, grid cards (h-[200px], group hover for edit button reveal)
- `/src/atomic-crm/opportunities/OpportunityList.tsx`: Triple view (Kanban + Campaign + Row list), drag-and-drop (@hello-pangea/dnd), FilterPresetsBar + FilterChipsPanel, view preferences persisted
- `/src/atomic-crm/tasks/TaskList.tsx`: Grouped accordion (by principal), collapsible groups with ChevronDown rotation animation, pending task count badges, "show completed" toggle
- `/src/atomic-crm/sales/SalesList.tsx`: Simple DataTable with inline search only, no sidebar filters, minimal styling, no premium effects
- `/src/atomic-crm/products/ProductList.tsx`: Grid view with sidebar filters, similar to organizations grid pattern (h-[200px] cards, translate + scale hover)

### Filter Components
- `/src/atomic-crm/contacts/ContactListFilter.tsx`: Sidebar filter with FilterCategory sections, ToggleFilterButton for multi-select, SidebarActiveFilters display
- `/src/atomic-crm/filters/FilterCategory.tsx`: Collapsible filter sections with icons, used across multiple resources
- `/src/atomic-crm/hooks/useFilterCleanup.tsx`: Registry validation hook, removes stale filters from localStorage
- `/src/atomic-crm/providers/supabase/filterRegistry.ts`: Whitelisted filterable fields per resource, prevents 400 errors from invalid filter keys

### Existing Detail View Implementations
- `/src/atomic-crm/contacts/ContactShow.tsx`: Full-page with ResponsiveGrid (main + aside), tabs (Details/Notes/Activities), URL-based tab routing
- `/src/atomic-crm/opportunities/OpportunityShow.tsx`: Full-page with tabs (Details/Notes & Activity/Change Log), similar ResponsiveGrid pattern
- `/src/atomic-crm/dashboard/v2/components/RightSlideOver.tsx`: **REFERENCE IMPLEMENTATION** - 40vw width (min 480px, max 720px), Sheet component from shadcn/ui, tabs (Details/History/Files), ESC key handling, real-time stage updates

### Form Components
- `/src/components/admin/tabbed-form/TabbedFormInputs.tsx`: Main tabbed form container, automatic error count per tab (from React Hook Form state), memoized error calculations
- `/src/components/admin/tabbed-form/TabTriggerWithErrors.tsx`: Tab trigger with error badge (displays count when > 0)
- `/src/components/admin/tabbed-form/TabPanel.tsx`: Tab content wrapper with semantic styling
- `/src/atomic-crm/contacts/ContactCreate.tsx`: Example create form with tabbed inputs, Form component with defaultValues from Zod schema
- `/src/atomic-crm/opportunities/OpportunityCreate.tsx`: Complex create form with ReferenceArrayInput for contacts, explicit array initialization

### Validation Schemas
- `/src/atomic-crm/validation/contacts.ts`: contactSchema, emailAndTypeSchema (JSONB array sub-schema), phoneNumberAndTypeSchema, personalInfoTypeSchema, validateContactForm function
- `/src/atomic-crm/validation/opportunities.ts`: opportunitySchema with .default() values (stage='new_lead', priority='medium', estimated_close_date=+30 days), contact_ids array handling
- `/src/atomic-crm/validation/task.ts`: taskSchema with getTaskDefaultValues helper, priority/type defaults
- `/src/atomic-crm/validation/organizations.ts`: organizationSchema, parent eligibility validation (PARENT_ELIGIBLE_TYPES), canBeParent/canHaveParent helpers
- `/src/atomic-crm/validation/index.ts`: Central export point for all validation schemas

### Data Layer
- `/src/atomic-crm/providers/supabase/unifiedDataProvider.ts`: 1,068 lines, processForDatabase pipeline (Validate FIRST → Transform SECOND), custom methods (salesCreate, archiveOpportunity, getActivityLog), soft delete support
- `/src/atomic-crm/providers/supabase/authProvider.ts`: Supabase auth integration, session management
- `/src/components/admin/list.tsx`: React Admin List wrapper (ListBase from ra-core), uses custom ListView
- `/src/components/admin/create.tsx`: React Admin Create wrapper, uses Form component
- `/src/components/admin/edit.tsx`: React Admin Edit wrapper, uses Form component

### UI Primitives (shadcn/ui)
- `/src/components/ui/card.tsx`: Card component with elevation-1 shadow, semantic colors (--stroke-card border, --text-title for CardTitle), data-slot attributes, sub-components (CardHeader, CardContent, CardFooter)
- `/src/components/ui/button.tsx`: Button variants via CVA (default, destructive, outline, secondary, ghost, link), all 48px tall (WCAG 2.5.5), 3px focus ring
- `/src/components/ui/sheet.tsx`: Slide-over panel (Radix Dialog variant), used in Dashboard V2 RightSlideOver
- `/src/components/ui/tabs.tsx`: Radix Tabs wrapper, used in show views and forms

### Resource Registration
- `/src/atomic-crm/root/CRM.tsx`: Main CRM component, Resource registration with lazy-loaded modules, ConfigurationProvider wrapper
- `/src/atomic-crm/contacts/index.ts`: Example module export pattern (lazy-loaded list/show/edit/create, recordRepresentation function)

## Relevant Tables

### Core Tables (All Soft Delete)
- **contacts**: JSONB arrays (email, phone), organization_id FK, tags BIGINT[], search_tsv, first_seen/last_seen timestamps
- **organizations**: organization_type enum, parent_organization_id (2-level hierarchy), context_links JSONB, priority A/B/C/D
- **opportunities**: stage/status enums, contact_ids BIGINT[], customer/principal/distributor organization FKs, index for Kanban ordering
- **tasks**: priority enum, type enum, completed boolean, opportunity_id/contact_id/sales_id FKs
- **sales**: role enum (admin/manager/rep), administrator computed column (GENERATED ALWAYS AS role='admin'), disabled boolean
- **products**: category enum (changed to TEXT), status enum, principal_id FK, certifications/allergens TEXT[], nutritional_info JSONB

### Views (All `security_invoker = true`)
- **contacts_summary**: Denormalized company_name from organizations LEFT JOIN
- **organizations_summary**: Pre-aggregated nb_opportunities, nb_contacts, last_opportunity_activity
- **opportunities_summary**: Denormalized organization names + products JSONB array (aggregated from opportunity_products junction table)
- **principal_opportunities**: Dashboard V2 hierarchy view, pre-calculates health_status (active/cooling/at_risk based on days_since_activity)
- **priority_tasks**: Dashboard V2 pre-filtered tasks (incomplete AND (due_date <= +7 days OR priority IN (high, critical)))
- **products_summary**: Denormalized principal_name

### Junction Tables
- **opportunity_contacts**: Many-to-many (opportunities ↔ contacts), role field, is_primary flag
- **opportunity_products**: Many-to-many (opportunities ↔ products), product_name/category denormalized, aggregated into opportunities_summary.products JSONB

## Relevant Patterns

**Premium Interactive Card**: Border transparent → visible on hover, shadow-sm → shadow-md elevation, motion-safe:hover:-translate-y-0.5 lift, active:scale-[0.98] press feedback, focus-within:ring-2 ring-offset-2 accessibility. Currently inline in ContactListContent, OrganizationCard, ProductCard - needs extraction to `.interactive-card` utility class. Example: `/src/components/ui/card-elevation.stories.tsx:18-32`

**Filter Sidebar Pattern**: Fixed w-64 (256px) width, sticky positioning (top-[var(--spacing-section)]), card-container wrapper with p-2, collapsible FilterCategory sections, always-visible SearchInput at top, SidebarActiveFilters conditional display, "Clear all filters" button when active. Applied in: ContactListFilter, OrganizationListFilter, ProductListFilter, TaskListFilter. Implementation: `/src/atomic-crm/contacts/ContactListFilter.tsx:10-45`

**JSONB Array Form Pattern**: Sub-schema for array items (emailAndTypeSchema with .default("Work") type), main schema with .default([]) array, ArrayInput + SimpleFormIterator (inline, disableReordering, disableClear), NO defaultValue in form components (comes from Zod). Used for: contacts.email/phone, organizations.context_links, products.certifications/allergens. Example: `/src/atomic-crm/contacts/ContactInfoTab.tsx:12-35`

**Form State from Schema**: zodSchema.partial().parse({}) extracts defaults, merge with identity/context values (created_by, opportunity_owner_id), explicitly initialize arrays for React Hook Form tracking. Constitution Rule #5 enforcement. Example: `/src/atomic-crm/products/ProductCreate.tsx:14-18`

**Lazy Loading Pattern**: React.lazy(() => import("./ComponentName")) in index.ts, export object with list/show/edit/create keys, optional recordRepresentation function for display. Enables code splitting, optimized bundle size. Example: `/src/atomic-crm/contacts/index.ts:1-12`

**Slide-Over URL Sync**: useSlideOverState hook manages isOpen, slideOverId, mode (view/edit), URL params (?view=123 or ?edit=123), popstate listener for browser back/forward, ESC key handling, history.pushState on open, history.replaceState on mode toggle. **Fully implemented** in Dashboard V2 RightSlideOver (lines 136-238 of rollout plan). No additional code needed for new resources.

**Soft Delete Pattern**: deleted_at TIMESTAMPTZ column on all core tables, supportsSoftDelete() check in data provider, UPDATE with deleted_at=now() instead of DELETE, all views filter WHERE deleted_at IS NULL. Never show deleted records in UI. Implementation: `/src/atomic-crm/providers/supabase/unifiedDataProvider.ts:155-170`

**RLS Two-Layer Security**: GRANT SELECT/INSERT/UPDATE/DELETE at table level, then CREATE POLICY for row-level filtering. Admin-only UPDATE/DELETE on shared resources (contacts, organizations, opportunities, products) prevents non-admin modifications. Personal visibility for tasks (sales_id filtering). All views use security_invoker=true. Migration: `20251108213039_fix_rls_policies_role_based_access.sql`

**View-Based Data Delivery**: Summary views eliminate N+1 queries (organizations_summary pre-aggregates counts, contacts_summary denormalizes company_name), dashboard views pre-calculate metrics (principal_opportunities health_status, priority_tasks pre-filtering), JSONB aggregation for related data (opportunities_summary.products array from junction table). All use LEFT JOIN to preserve orphaned records.

**Validation Error Formatting**: Zod parse in validateResourceForm, catch ZodError, format as { message: "Validation failed", errors: { fieldName: "Error message" } } for React Admin inline display, throw formatted errors. Single validation point at API boundary only. Example: `/src/atomic-crm/validation/contacts.ts:245-260`

## Relevant Docs

**docs/plans/2025-11-16-unified-design-system-rollout.md**: You _must_ read this when working on Phase 1 foundation components (StandardListLayout, ResourceSlideOver, PremiumDatagrid, useSlideOverState hook), Phase 2 Contacts pilot (ContactList refactor, ContactSlideOver tabs, routing updates), Phase 3 resource migrations (Tasks, Sales, Organizations, Products, Opportunities with Kanban preservation), Phase 4 polish (accessibility audit, performance optimization, visual consistency pass). Contains complete component APIs, acceptance criteria, testing requirements, migration checklists.

**docs/plans/2025-11-16-unified-design-system-cleanup-strategy.md**: You _must_ read this when working on cleanup tasks (removing deprecated Show components, cleaning up unused filter implementations, consolidating view switchers, standardizing empty states, removing legacy card patterns). Phase-locked cleanup cadence ensures deprecated code is removed WITH each milestone, not after. Contains specific search queries and deletion targets per phase.

**docs/claude/engineering-constitution.md**: You _must_ read this when working on validation (single source of truth at API boundary), form state (derived from Zod schemas via .partial().parse({})), error handling (fail-fast, no circuit breakers), semantic colors (CSS variables only, never hex), Boy Scout Rule (fix inconsistencies when touching files, convert type to interface).

**docs/architecture/design-system.md**: You _must_ read this when working on color system (OKLCH tokens, semantic mappings, tag colors), spacing system (CSS custom properties, desktop-optimized density), elevation system (3-tier warm shadows, avatar micro-elevation), typography (text hierarchy with warm tints), touch targets (WCAG 2.5.5 minimum 44px, standard 48px).

**docs/architecture/database-schema.md**: You _must_ read this when working on JSONB fields (email/phone arrays, context_links, nutritional_info), computed columns (sales.administrator from role enum), RLS policies (admin-only modifications, personal task visibility), view definitions (security_invoker enforcement), soft deletes (deleted_at filtering), junction tables (opportunity_contacts, opportunity_products).

**docs/architecture/component-library.md**: You _must_ read this when working on React Admin wrappers (List/Create/Edit/Show), shadcn/ui primitives (Card, Button, Sheet, Tabs), custom components (TabbedFormInputs, FilterCategory, FloatingCreateButton), field components (BadgeField, ReferenceField), bulk actions toolbar.

**docs/architecture/api-design.md**: You _must_ read this when working on data provider methods (getList, getOne, create, update), validation pipeline (Validate FIRST → Transform SECOND), error handling (Zod error formatting for React Admin), custom operations (salesCreate, archiveOpportunity, getActivityLog), storage operations (file upload with 10MB limit).

**docs/supabase/WORKFLOW.md**: You _must_ read this when working on database migrations (npx supabase migration new, dry-run validation, cloud deployment), schema changes (GRANT + RLS two-layer security), view modifications (security_invoker requirement), seed data (admin@test.com test user, 16 organizations, trigger-based sales record creation).

**docs/dashboard-v2-migration.md**: You _must_ read this when working on slide-over patterns (RightSlideOver reference implementation), keyboard shortcuts (/, 1-3, H, Esc), filter sidebar collapse (CSS Grid parent control, rail toggle), responsive design (desktop-first 1440px+, WCAG AA compliance), view preferences (localStorage persistence).

**.claude/skills/crispy-design-system/SKILL.md**: You _must_ read this when working on Tailwind v4 utilities (semantic color enforcement, spacing token usage, @theme inline syntax), responsive patterns (mobile/iPad/desktop breakpoints), accessibility requirements (focus rings, ARIA attributes, keyboard navigation), design system compliance (no hardcoded hex/pixels, touch target validation).

**docs/plans/2025-11-10-tabbed-form-implementation-plan.md**: You _must_ read this when working on tabbed forms (TabbedFormInputs usage, error tracking per tab, field organization), form validation (error count badges, inline error display), tab configuration (key/label/fields/content structure).

**docs/internal-docs/color-theming-architecture.docs.md**: You _must_ read this when working on color tokens (150+ OKLCH semantic variables, light/dark mode support), brand colors (forest green hue 142°, paper cream background), state colors (success/warning/info/error complete 8-token systems), chart colors (earth-tone palette), tag colors (12 high-contrast pairs).
