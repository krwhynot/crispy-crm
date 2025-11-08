# Project Overview & Tech Stack

## 1. Project Type & Purpose

**Atomic CRM** is a full-featured, open-source Customer Relationship Management (CRM) application specifically designed for food broker sales teams. The application manages the complex relationships between sales representatives (account managers), food brands (principals), distributors/retailers (organizations), and decision-makers (contacts).

### Business Context

The CRM is built around a unique **principal-centric model** where:
- **Principals** are food brands that sales representatives represent
- **Organizations** are distributors, restaurants, and retailers who purchase from principals
- **Opportunities** represent potential sales of principal products to organizations
- **Contacts** are decision-makers at organizations
- **Account Managers** (sales reps) typically represent 3-5 principals and manage 15-20 active opportunities

### Primary Use Case

The application addresses the critical question sales reps ask daily: **"What must I do this week to move each principal forward?"** The CRM is designed to replace Excel spreadsheets with a unified system for:
- Tracking opportunities across multiple principals
- Managing tasks and follow-ups
- Logging sales activities (calls, emails, meetings)
- Generating reports grouped by principal
- Visualizing sales pipelines in Kanban boards

### Current Status

**Version:** 0.1.0
**Phase:** Pre-launch (Phase 1 complete)
**Development Status:** Active development with recent major redesign (Principal-Centric v2.0, November 2025)
**Target:** 30-day Excel replacement for small food broker teams

### Key Business Goals

1. **Excel Replacement MVP:** Enable sales teams to abandon spreadsheets within 30 days
2. **Principal-First Workflow:** Prioritize work by food brand rather than customer
3. **Activity Accountability:** Track and prove sales rep activities
4. **Mobile-Ready:** iPad-first responsive design for field sales

---

## 2. Tech Stack Overview

### Frontend Framework

**React 19.1.0** with modern concurrent features
- Type-safe development with **TypeScript 5.8.3**
- Build tool: **Vite 7.0.4** (lightning-fast HMR and optimized production builds)
- Component library: **React Admin 5.10.0** (enterprise-grade admin framework)
- Routing: **React Router DOM 6.30.1**

### UI Libraries & Design System

**Component Foundation:**
- **Radix UI** - Extensive suite of 18+ accessible, unstyled components:
  - Dialog, Dropdown Menu, Popover, Select, Avatar, Checkbox
  - Accordion, Navigation Menu, Tabs, Tooltip, Switch
  - Radio Group, Progress, Collapsible, Separator, Slot
- **shadcn-admin-kit** - Pre-built admin patterns built on Radix UI

**Styling & Theming:**
- **Tailwind CSS 4.1.11** - Utility-first CSS with custom semantic color system
- **@tailwindcss/vite** - Native Vite integration
- **next-themes** - Dark/light mode switching
- **class-variance-authority (CVA)** - Type-safe component variants
- **tailwind-merge** - Intelligent class merging without conflicts
- **clsx** - Conditional class name construction

**Design System:**
- Custom **MFB "Garden to Table"** brand (earth OKLCH colors, warm cream backgrounds)
- Semantic color variables: `--primary`, `--brand-700`, `--destructive`
- **Strict rule:** Never use hex colors directly, only CSS custom properties
- Validation script: `npm run validate:colors` enforces semantic color usage

### Backend & Database

**Supabase Ecosystem:**
- **@supabase/supabase-js 2.75.1** - PostgreSQL database with real-time capabilities
- **PostgreSQL** - Primary data store with 57 migrations
- **Row Level Security (RLS)** - Database-level authorization
- **Two-layer security model:** Both GRANT permissions AND RLS policies required
- **Edge Functions** - Serverless backend logic (email processing, webhooks)
- **Supabase Storage** - File attachments bucket
- **Supabase Auth** - Authentication with Google, Azure, Keycloak, Auth0 support

**Data Provider Integration:**
- **ra-supabase-core 3.5.1** - React Admin + Supabase adapter
- **ra-supabase-language-english** - Localization for Supabase provider
- **Unified data provider** - Single source of truth at API boundary

### State Management & Data Fetching

**Query & Cache:**
- **@tanstack/react-query 5.85.9** - Async state management with smart caching
- **lru-cache 11.2.2** - Least Recently Used cache for performance optimization
- **React Admin stores** - Built-in state management for resources

**Form Management:**
- **react-hook-form 7.62.0** - Performance-focused form library
- **@hookform/resolvers 5.1.1** - Schema validation integrations
- **Zod 4.0.5** - TypeScript-first schema validation at API boundary

### Validation Architecture

**Single Source of Truth Pattern:**
- All validation schemas in `/src/atomic-crm/validation/`
- Zod schemas define both type safety AND default values
- Form defaults extracted via `zodSchema.partial().parse({})`
- No duplicate validation logic anywhere in the codebase

```typescript
// Example: Contact validation
export const emailAndTypeSchema = z.object({
  email: z.string().email(),
  type: z.enum(["Work", "Home"]).default("Work"),
});

const contactSchema = z.object({
  first_name: z.string().min(1),
  email: z.array(emailAndTypeSchema).default([]),
});

// Form initialization
const defaultValues = contactCreateSchema.partial().parse({});
```

### Data Visualization & Charts

**Charting Libraries:**
- **@nivo/bar 0.99.0** - Declarative React charts with rich features
- **recharts 3.3.0** - Composable charting components
- **Support for:** Bar charts, line charts, pie charts, area charts
- **Use case:** Dashboard widgets, report visualizations, opportunity analytics

### Interaction & UX

**Drag & Drop:**
- **@hello-pangea/dnd 18.0.1** - Beautiful DnD (Kanban boards, list reordering)
- **Use case:** Opportunity pipeline Kanban view

**File Handling:**
- **react-dropzone 14.3.8** - Drag-and-drop file uploads
- **react-cropper 2.3.3** - Image cropping for avatars/logos
- **papaparse 5.5.3** - CSV parsing for contact imports
- **jsonexport 3.2.0** - Export data to CSV format

**Rich Interactions:**
- **cmdk 1.1.1** - Command menu (Cmd+K search interface)
- **sonner 2.0.7** - Toast notifications with elegant animations
- **vaul 1.1.2** - Drawer component for mobile-first experiences

### Icons & Assets

- **lucide-react 0.542.0** - 1000+ consistent SVG icons
- **Usage:** Unified icon system across entire application

### Utilities & Helpers

**Data Manipulation:**
- **lodash 4.17.21** - Utility functions (groupBy, debounce, etc.)
- **inflection 3.0.2** - Pluralization/singularization for resource names
- **diacritic 0.0.2** - Accent removal for search normalization
- **query-string 9.2.2** - URL query parameter parsing

**Security:**
- **dompurify 3.2.7** - XSS protection for user-generated content
- **jsonwebtoken 9.0.2** - JWT token handling

**Internationalization:**
- **ra-i18n-polyglot 5.10.0** - React Admin i18n framework
- **ra-language-english 5.10.0** - English translations

### Testing Framework

**Unit & Integration Testing:**
- **Vitest 3.2.4** - Next-generation test runner (Vite-native)
- **@vitest/ui** - Visual test UI dashboard
- **@vitest/coverage-v8** - Code coverage reports (70% minimum requirement)
- **@testing-library/react 16.3.0** - Component testing utilities
- **@testing-library/user-event 14.6.1** - User interaction simulation
- **jsdom 27.0.0** - Browser environment simulation

**End-to-End Testing:**
- **@playwright/test 1.56.1** - Cross-browser E2E testing
- **Test locations:** `tests/e2e/`, `tests/fixtures/`

**Test Commands:**
```bash
npm test                 # Watch mode (development)
npm run test:coverage    # Coverage report (70% min)
npm run test:e2e         # Playwright E2E tests
npm run test:ci          # CI pipeline tests
```

### Code Quality Tools

**Linting & Formatting:**
- **ESLint 9.22.0** - JavaScript/TypeScript linter
- **@typescript-eslint** - TypeScript-specific rules
- **eslint-plugin-react-hooks** - React Hooks best practices
- **eslint-plugin-jsx-a11y** - Accessibility linting
- **eslint-plugin-tailwindcss** - Tailwind CSS class validation
- **Prettier 3.6.2** - Code formatting

**Pre-commit Hooks:**
- **Husky 9.1.7** - Git hooks automation
- **Enforced checks:** Linting, formatting, type checking

**Visual Regression Testing:**
- **Storybook 9.1.10** - Component documentation and isolation
- **Chromatic** - Visual regression testing for UI components

### Build & Deployment

**Build Optimization:**
- **Terser 5.44.0** - JavaScript minification with aggressive compression
- **rollup-plugin-visualizer** - Bundle size analysis
- **vite-bundle-visualizer** - Interactive bundle visualization
- **Manual chunk splitting:** Optimized code splitting strategy (vendor-react, vendor-ra-core, ui-radix, charts-nivo, forms, dnd, utils, file-utils, icons)

**Deployment:**
- **gh-pages 6.3.0** - GitHub Pages deployment
- **Production target:** Vercel (root domain, not subdirectory)
- **Demo:** https://marmelab.com/atomic-crm-demo

**Performance Features:**
- Source maps disabled in production (7.7MB savings)
- Console.log stripping in production builds
- Dead code elimination
- Tree shaking for all dependencies
- Pre-bundling of heavy dependencies (React Admin, Radix UI, Supabase)

### Development Tools

**Type Generation:**
- TypeScript strict mode enabled
- Path alias: `@/*` → `src/*`
- Custom scripts: `npm run gen:types` (MCP type generation)

**Database Tools:**
- **Supabase CLI 2.51.0** - Local development database
- **57 migrations** - Complete schema version history
- **Seed data:** `supabase/seed.sql` (16 organizations, test user: admin@test.com)

**Development Scripts:**
```bash
npm run dev:local        # Reset DB + seed + dev server
npm run db:local:reset   # Reset local database
npm run db:cloud:push    # Deploy migrations to production
npx supabase migration new <name>  # Create new migration
```

---

## 3. Architecture Pattern

### React Admin Foundation

**Core Architecture:**
- Built on **React Admin 5.10.0** - Enterprise-grade framework for B2B applications
- **Resource-based routing** - Each entity (contacts, organizations, opportunities) is a "resource"
- **Convention over configuration** - Standardized CRUD patterns
- **Data provider abstraction** - Unified API for all data operations

**Application Entry Points:**
```
main.tsx → App.tsx → atomic-crm/root/CRM.tsx
                           ↓
                     Dashboard + Resources
```

### Component-Based Architecture

**Resource Structure:**
```
src/atomic-crm/<resource>/
├── index.ts              # Lazy-loaded exports
├── List.tsx             # Resource list page
├── Show.tsx             # Resource detail page
├── Edit.tsx             # Resource edit form
├── Create.tsx           # Resource creation form
└── __tests__/           # Unit tests
```

**Lazy Loading Pattern:**
```typescript
// src/atomic-crm/contacts/index.ts
const List = React.lazy(() => import("./List"));
const Show = React.lazy(() => import("./Show"));
const Edit = React.lazy(() => import("./Edit"));
const Create = React.lazy(() => import("./Create"));

export default {
  list: List,
  show: Show,
  edit: Edit,
  create: Create,
  recordRepresentation: (r) => `${r.first_name} ${r.last_name}`,
};
```

**Registration in CRM.tsx:**
```typescript
import contacts from "../contacts";

<Resource name="contacts" {...contacts} />
```

### Data Layer Architecture

**Three-Tier Pattern:**

1. **Database Layer** (PostgreSQL + Supabase)
   - Views: Computed data (e.g., `opportunities_with_principals`)
   - Triggers: Automated actions (e.g., update `updated_at` timestamps)
   - Edge Functions: Complex business logic (email processing)
   - RLS Policies: Row-level security

2. **Data Provider Layer** (`providers/supabase/unifiedDataProvider.ts`)
   - Unified interface for all CRUD operations
   - Translates React Admin calls to Supabase queries
   - Handles filtering, sorting, pagination
   - Error normalization

3. **Component Layer** (React Admin resources)
   - Uses hooks: `useGetList`, `useGetOne`, `useCreate`, `useUpdate`, `useDelete`
   - Automatic caching via React Query
   - Optimistic updates

### JSONB Arrays Pattern

**Database-First Design:**
```sql
-- Database: Store structured arrays as JSONB
email JSONB DEFAULT '[]'::jsonb
phone JSONB DEFAULT '[]'::jsonb
```

**Zod Sub-Schema Pattern:**
```typescript
// Validation: Define structure with defaults
export const emailAndTypeSchema = z.object({
  email: z.string().email(),
  type: z.enum(["Work", "Home"]).default("Work"),
});

const contactSchema = z.object({
  email: z.array(emailAndTypeSchema).default([]),
});
```

**Form Pattern:**
```typescript
// NO defaultValue in JSX - comes from Zod
<ArrayInput source="email">
  <SimpleFormIterator inline>
    <TextInput source="email" />
    <SelectInput source="type" choices={emailTypes} />
  </SimpleFormIterator>
</ArrayInput>
```

**Key Principle:** Sub-schemas define structure, `.default()` in Zod (not React), `zodSchema.partial().parse({})` for form initialization.

### Filter Registry Pattern

**Problem:** Stale filter definitions cause 400 Bad Request errors
**Solution:** Centralized filter registry

**File:** `providers/supabase/filterRegistry.ts`

```typescript
export const filterRegistry = {
  contacts: {
    first_name: 'text',
    last_name: 'text',
    email: 'array',
    organization_id: 'reference',
  },
  opportunities: {
    stage: 'select',
    principal_organization_id: 'reference',
    expected_value: 'number',
  },
};
```

**Benefits:**
- Prevents 400 errors from outdated filter UI
- Single source of truth for filterable fields
- Type safety for filter operations

### Configuration System

**Centralized Configuration:**
- **File:** `root/ConfigurationContext.tsx`
- **Customization:** Props passed to `<CRM>` component in `App.tsx`

**Customizable Options:**
```typescript
<CRM
  title="MFB Master Food Brokers"
  lightModeLogo="/logos/mfb-logo.webp"
  darkModeLogo="/logos/mfb-logo.webp"
  opportunityStages={['Prospecting', 'Qualification', 'Negotiation', 'Closed Won']}
  contactGender={['Male', 'Female', 'Non-binary', 'Prefer not to say']}
  taskTypes={['Call', 'Email', 'Meeting', 'Follow-up']}
/>
```

### Security Architecture

**Two-Layer Security Model (Critical):**

PostgreSQL requires BOTH:
1. **GRANT** - Table-level access permissions
2. **RLS Policies** - Row-level filtering

**Common Mistake:** RLS without GRANT = "permission denied" error

**Pattern for New Tables:**
```sql
CREATE TABLE my_table (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  name TEXT
);

-- Layer 1: GRANT table access
ALTER TABLE my_table ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON my_table TO authenticated;
GRANT USAGE ON SEQUENCE my_table_id_seq TO authenticated;

-- Layer 2: RLS policies for row filtering
CREATE POLICY select_my_table ON my_table
  FOR SELECT TO authenticated
  USING (true); -- Shared data: all users see all rows

-- Personal data pattern (tasks example):
CREATE POLICY select_tasks ON tasks
  FOR SELECT TO authenticated
  USING (sales_id IN (SELECT id FROM sales WHERE user_id = auth.uid()));
```

**Security Patterns:**
- **Shared resources** (contacts, organizations, products): `USING (true)`
- **Personal resources** (tasks): `USING (sales_id = current_user_id)`

---

## 4. Project Status

### Current Phase: Pre-Launch

**Version:** 0.1.0
**Phase 1:** Complete (Core CRUD operations for all resources)
**Phase 2:** In Progress (Principal-Centric Redesign v2.0)

### Recent Major Changes (Last 90 Days)

**November 5, 2025 - Principal-Centric Redesign v2.0:**
- Dashboard redesigned from 13 widgets to principal-focused table view
- 2 MVP reports added: Opportunities by Principal, Weekly Activity Summary
- 30-day Excel replacement goal established
- Design document: `docs/plans/2025-11-05-principal-centric-crm-design.md`

**October 29, 2025 - Pricing Removal:**
- Products simplified to associations only (no pricing/UOM)
- Migration: `20251028040008_remove_product_pricing_and_uom.sql`
- Products now track brand-customer relationships without financial data

**v0.2.0 - Deal → Opportunity Migration:**
- Renamed `deals` to `opportunities` throughout system
- Added multi-participant support (primary/secondary/tertiary account managers)
- Enhanced activity tracking and interaction history
- Many-to-many relationships: Contacts belong to multiple organizations

### Estimated Implementation Timeline (Current Work)

**Feature 1: Principal Dashboard** - 5-7 days
- Replaces all 13 existing dashboard widgets
- Shows principals ranked by urgency (overdue tasks, low activity)
- Table format for iPad landscape optimization

**Feature 2: Reports Module** - 4 days (MVP: 2 reports)
- Opportunities by Principal (2 days) - CRITICAL
- Weekly Activity Summary (2 days) - CRITICAL
- Pipeline Status (deferred to post-launch)

**Feature 3: Tasks + Activities** - 8-9 days
- Tasks as full resource module (not just embedded widget)
- Activity logging integration (link tasks → activities)
- Activity timeline on Organization/Contact pages

**Total Estimated Effort:** 17-20 days for Excel replacement MVP

### Database Maturity

**Migration Count:** 57 migrations
**Schema Stability:** Mature (established patterns for RLS, GRANTs, triggers)
**Seed Data:** Single source of truth in `supabase/seed.sql`
- Test user: admin@test.com / password123
- 16 sample organizations
- Complete relationship data (contacts, opportunities, tasks)

### Code Quality Metrics

**Test Coverage:** 70% minimum requirement
**Testing Stack:**
- Unit/Integration: Vitest + React Testing Library
- E2E: Playwright
- Visual Regression: Chromatic + Storybook

**Code Quality Enforcement:**
- Pre-commit hooks (Husky)
- ESLint + Prettier + TypeScript strict mode
- Custom validation: `npm run validate:colors` (semantic colors only)

### Deployment Status

**Environments:**
- **Local Development:** Supabase Docker containers
- **Cloud/Staging:** Supabase Cloud instance
- **Production Demo:** https://marmelab.com/atomic-crm-demo
- **Target Production:** Vercel (root domain deployment)

**CI/CD:**
- GitHub Actions (assumed from pre-commit hooks and CI test scripts)
- Automated testing: `npm run test:ci`
- Visual regression: Chromatic pipeline

---

## 5. Key Features

### Core CRM Features

**1. Contact Management**
- Comprehensive contact database with JSONB arrays for emails/phones
- Multiple email addresses and phone numbers per contact
- Gender tracking with customizable options
- Many-to-many relationships: Contacts can belong to multiple organizations
- Activity timeline: All interactions logged and displayed
- Import/Export: CSV import for bulk contact creation

**2. Organization Management**
- Companies/distributors/retailers as first-class entities
- Principal organizations (food brands) vs. customer organizations (buyers)
- Hierarchical relationships: Organizations contain contacts
- Activity tracking at organization level
- Custom sectors/categories (configurable via CRM props)

**3. Opportunity Pipeline**
- Full sales pipeline management (formerly "deals")
- **Multi-participant model:**
  - Primary Account Manager (required)
  - Secondary Account Manager (optional)
  - Tertiary Account Manager (optional)
- **Principal-centric:** Every opportunity linked to a food brand (principal)
- **Customizable stages:** Prospecting → Qualification → Negotiation → Closed Won
- **Expected value tracking:** Forecast revenue per opportunity
- **Kanban board view:** Drag-and-drop pipeline visualization (@hello-pangea/dnd)
- **Activity integration:** Full history of calls, emails, meetings per opportunity

**4. Task Management (Being Enhanced)**
- **Current state:** Embedded widget on opportunity pages
- **Future state (in development):** Full resource module
  - Standalone tasks list page (`/tasks`)
  - Grouping by principal, due date, or opportunity
  - Overdue task indicators
  - Quick-add task floating action button
  - Task completion → automatic activity logging
- **Assignment:** Link to opportunities and account managers
- **Priority tracking:** High/Medium/Low (deferred in MVP)

**5. Activity Tracking**
- **Activity types:** Call, Email, Meeting, Note
- **Contextual logging:** Activities linked to:
  - Opportunities (what was discussed)
  - Organizations (who was contacted)
  - Contacts (specific person interaction)
  - Tasks (what prompted the activity)
- **Timeline views:** Activity history on Organization and Contact detail pages
- **Quick logging:** Reusable component for logging from anywhere
- **Accountability:** Weekly Activity Summary report tracks rep productivity

**6. Product/Brand Management**
- Products represent food brands (principals) in simplified form
- **No pricing/UOM:** Products are associations only (as of Oct 29, 2025)
- Link products to opportunities to track which brands are being sold
- CRUD operations for product catalog

**7. Dashboard & Reporting**

**Current Dashboard (Being Redesigned):**
- 13 widgets showing various metrics
- Will be replaced with Principal-Centric Dashboard

**New Principal-Centric Dashboard (In Development):**
- **Table view:** All principals visible at once (iPad landscape optimized)
- **Priority indicators:**
  - Red: Overdue tasks OR low activity (< 3 activities/week)
  - Yellow: Tasks due in 48 hours
  - Green: All on track
- **Per-principal metrics:**
  - Task count with overdue highlights
  - Activity count this week
  - Top opportunity (highest value or closest to close)
- **Clickable navigation:** Every element links to filtered views

**Reports Module (In Development - 2 MVP Reports):**

**Report 1: Opportunities by Principal**
- Groups all opportunities by food brand
- Filters: Principal, Stage, Account Manager, Date Range
- Shows: Count, total value, individual opportunities
- CSV export for Excel users
- **Critical for Excel replacement goal**

**Report 2: Weekly Activity Summary**
- Activity counts grouped by Account Manager → Principal
- Breakdown by type: Calls, Emails, Meetings, Notes
- Low activity warnings (< 3 activities/week flagged)
- CSV export for management review

**Report 3: Pipeline Status (Deferred to Post-Launch)**
- Stage-by-stage opportunity analysis
- Conversion rates and bottleneck identification

**8. Email Integration (Inbound Email)**
- CC Atomic CRM on emails to auto-save as notes
- Captures communications automatically
- Links emails to opportunities/contacts
- Reduces manual data entry

**9. Import/Export Capabilities**
- **CSV Import:** Bulk contact creation (papaparse)
- **CSV Export:** Reports and contact lists (jsonexport)
- **vCard Export:** Removed (feature creep, not in MVP)

**10. Authentication & Authorization**
- **Auth providers supported:**
  - Email/Password (default)
  - Google OAuth
  - Azure AD
  - Keycloak
  - Auth0
- **User management:** Admin panel for user CRUD
- **Row-level security:** Database enforces data access rules
- **Two-Factor Auth:** Deferred to post-launch

**11. File Attachments**
- Supabase Storage bucket for files
- React Dropzone for drag-and-drop uploads
- React Cropper for image editing (avatars, logos)
- Accessible via Supabase Studio: `http://localhost:54323/project/default/storage/buckets/attachments`

**12. Notifications System**
- Resource registered: `notifications`
- Toast notifications via Sonner
- Real-time updates capability (Supabase subscriptions)

**13. Search Functionality**
- **Command menu:** Cmd+K interface (cmdk library)
- **Module-level search:** Filter resources within lists
- **Global search bar:** Deferred (module search sufficient for MVP)
- **Search normalization:** Diacritic removal for accent-insensitive search

**14. Customization & Theming**
- **Dark/Light mode:** Theme switcher with persistence
- **Customizable brand:** Logo, title, colors via CRM props
- **Configurable dropdowns:**
  - Opportunity stages
  - Contact gender options
  - Note statuses
  - Task types
  - Company sectors
- **Component replacement:** Any React Admin component can be overridden

**15. Responsive Design**
- **iPad-first approach:** Optimized for field sales on tablets
- **Touch targets:** Minimum 44x44px for accessibility
- **Breakpoints:** Mobile → Tablet → Desktop progression
- **Table view optimization:** Principal Dashboard designed for landscape tablets

### Developer Experience Features

**16. Type Safety**
- TypeScript strict mode across entire codebase
- Zod schemas generate both runtime validation AND TypeScript types
- Path alias: `@/*` → `src/*` for clean imports

**17. Development Tools**
- **Hot Module Replacement:** Vite's instant updates
- **Component isolation:** Storybook for UI development
- **Visual regression:** Chromatic for catching UI breakage
- **Database UI:** Supabase Studio at `http://localhost:54323`

**18. Engineering Constitution**
- **Principle 1:** NO OVER-ENGINEERING (fail fast, no circuit breakers)
- **Principle 2:** SINGLE SOURCE OF TRUTH (Supabase + Zod only)
- **Principle 3:** BOY SCOUT RULE (fix inconsistencies when editing)
- **Principle 4:** VALIDATION (Zod at API boundary only)
- **Principle 5:** FORM STATE FROM SCHEMA (`zodSchema.partial().parse({})`)
- **Principle 6:** SEMANTIC COLORS ONLY (CSS vars, never hex)
- **Principle 7:** TWO-LAYER SECURITY (GRANT + RLS both required)

---

## Summary

**Atomic CRM** is a production-ready, TypeScript-first CRM built on React 19, React Admin 5, Supabase, and Tailwind CSS 4. It leverages modern web technologies (Vite, React Query, Radix UI) to deliver a performant, accessible, and customizable application specifically designed for food broker sales teams.

The architecture emphasizes:
- **Type safety** (TypeScript + Zod)
- **Single source of truth** (Supabase as sole data provider)
- **Developer velocity** (fail-fast, no over-engineering)
- **Accessibility** (Radix UI, semantic HTML)
- **Performance** (manual chunk splitting, aggressive caching, lazy loading)

Current development focuses on the **Principal-Centric Redesign v2.0**, aiming to replace Excel spreadsheets within 30 days by answering the critical question: **"What must I do this week to move each principal forward?"**

**Tech Stack Highlights:**
- **Frontend:** React 19 + TypeScript 5.8 + Vite 7 + React Admin 5
- **UI:** Radix UI (18+ components) + Tailwind CSS 4 + Custom semantic colors
- **Backend:** Supabase (PostgreSQL + Auth + Storage + Edge Functions)
- **State:** React Query 5 + React Hook Form 7 + Zod 4
- **Testing:** Vitest 3 + Playwright + Storybook + Chromatic (70% coverage minimum)
- **Quality:** ESLint + Prettier + Husky + TypeScript strict mode

**Deployment:**
- Local: Supabase Docker (seed: admin@test.com / password123)
- Production: Vercel + Supabase Cloud
- Demo: https://marmelab.com/atomic-crm-demo

**License:** MIT (courtesy of Marmelab)
