# Atomic CRM - Comprehensive Codebase Analysis

**Analysis Date:** 2025-10-13
**Project Version:** 0.2.0
**Analyzer:** Claude Code (Sonnet 4.5)

---

## Executive Summary

Atomic CRM is a modern, full-featured Customer Relationship Management system built with React 19 and Supabase. The project follows a sophisticated three-tier architecture with strict engineering principles enforced through a "constitution" document. This codebase represents a production-ready CRM specifically tailored for food service sales operations, with opportunities tracking, multi-stakeholder management, and product catalog features.

**Key Metrics:**
- **Total Files:** 1,145 files
- **Code Files:** 516 files
- **Project Size:** 13MB
- **Test Coverage:** 70% baseline (statements, branches, functions, lines)
- **Languages:** TypeScript (primary), SQL, JavaScript, CSS
- **Architecture:** React Admin + Supabase + Three-tier service layer

---

## 1. Project Overview

### Project Type
**Enterprise Web Application** - Multi-user CRM system with authentication, authorization, and real-time database capabilities.

### Tech Stack Summary

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| **Frontend Framework** | React | 19.1.0 | UI framework with modern concurrent features |
| **Admin Framework** | React Admin | 5.10.0 | Enterprise admin interface with CRUD operations |
| **Build Tool** | Vite | 7.0.4 | Fast development server and production builds |
| **Language** | TypeScript | 5.8.3 | Type-safe development |
| **Styling** | Tailwind CSS | 4.1.11 | Utility-first CSS framework |
| **UI Components** | shadcn/ui | Custom | Radix UI-based component library |
| **Backend** | Supabase | 2.39.0 | PostgreSQL + Auth + Storage + Edge Functions |
| **Validation** | Zod | 4.0.5 | Schema validation at API boundaries |
| **State Management** | React Query | 5.85.9 | Server state management via React Admin |
| **Testing** | Vitest | 3.2.4 | Unit and integration testing |
| **E2E Testing** | Playwright | (via test:e2e) | End-to-end browser testing |
| **Forms** | React Hook Form | 7.62.0 | Performant form management |

### Architecture Pattern

**Modified Three-Tier with Service Layer:**

```
┌─────────────────────────────────────────────────────────────┐
│                    PRESENTATION LAYER                        │
│  - React Components (Base/Admin/Feature)                    │
│  - React Admin framework integration                         │
│  - shadcn/ui primitives                                     │
└─────────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────────┐
│                    APPLICATION LAYER                         │
│  - Unified Data Provider (React Admin interface)            │
│  - Service Layer (Business logic services)                  │
│  - Validation Service (Zod schemas)                         │
│  - Transform Service (Data normalization)                   │
└─────────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────────┐
│                      DATA LAYER                              │
│  - Supabase Client                                          │
│  - PostgreSQL Database                                       │
│  - Row Level Security (RLS)                                 │
│  - Storage Service (Avatars/Attachments)                    │
└─────────────────────────────────────────────────────────────┘
```

### Language and Version Details

- **Primary Language:** TypeScript 5.8.3
  - Strict mode enabled
  - Path aliases configured (`@/*` → `./src/*`)
  - Modular config with `tsconfig.app.json` and `tsconfig.node.json`

- **SQL:** PostgreSQL 15+ (via Supabase)
  - Extensions: uuid-ossp, pgcrypto, pg_trgm (full-text search)

- **Node.js:** 22 LTS (required per README)

### Development Status
⚠️ **NOT PRODUCTION** - Development environment only. All data is test data and can be modified/deleted.

---

## 2. Detailed Directory Structure Analysis

### Root Level Organization

```
crispy-crm/
├── .claude/              # Claude Code configuration and commands
├── .docs/                # Internal planning and research documentation
├── .github/              # GitHub Actions CI/CD workflows
├── .storybook/           # Storybook configuration for component development
├── doc/                  # User and developer documentation
├── docs/                 # API documentation and database diagrams
├── node_modules/         # NPM dependencies (ignored in git)
├── public/               # Static assets (images, logos)
├── scripts/              # Development and deployment utilities
├── src/                  # Application source code (PRIMARY)
├── supabase/             # Database migrations and Edge Functions
├── tests/                # End-to-end Playwright tests
└── dist/                 # Build output (ignored in git)
```

### .claude/ - Claude Code Configuration (147 files)

**Purpose:** Custom configuration for Claude Code AI assistant, including slash commands, agents, and workflow automation.

**Key Files:**
- `.claude/commands/` - Custom slash commands for common workflows
  - `analyze/` - Codebase analysis commands
  - `cleanup/` - Project cleanup automation
  - `execute/` - Task execution commands
  - `plan/` - Feature planning commands
  - `research/` - Research and investigation commands
  - `role/` - Role-based command execution
- `.claude/agents/` - Custom AI agent configurations
- `.claude/hooks/` - Event hooks for tool interactions
- `.claude/troubleshooting/` - System troubleshooting guides

**Connection:** Provides development workflow automation and ensures consistent coding practices across the team.

### .docs/ - Planning Documentation (100+ files)

**Purpose:** Comprehensive planning documentation for features, migrations, and architectural decisions.

**Structure:**
```
.docs/plans/
├── X-color-system-migration/        # Tailwind 4 semantic color system
├── X-consolidate-data-providers/    # Data provider consolidation
├── X-crm-migration/                 # Deal → Opportunity migration
├── X-fresh-start-migration/         # Schema clean slate approach
├── X-kanban-depth-enhancement/      # Kanban board improvements
├── X-multi-select-filters/          # Multi-select filter system
├── X-opportunity-form-enhancement/  # Opportunity form improvements
└── X-production-readiness/          # Production checklist and gaps
```

**Pattern:** Each plan folder contains:
- `requirements.md` - Feature requirements
- `parallel-plan.md` - Parallel execution strategy
- `shared.md` - Shared context for agents
- `*.docs.md` - Research findings from parallel agents
- `report.md` - Final implementation summary

**Key Insight:** The "X-" prefix indicates completed features. Active plans are without the prefix.

### src/ - Application Source Code (PRIMARY - 400+ files)

#### src/atomic-crm/ - Core Application (350+ files)

**Purpose:** Main CRM application code following feature-based organization.

**Structure by Feature:**

```
src/atomic-crm/
├── root/                    # Application bootstrap and configuration
│   ├── CRM.tsx             # Root component wrapping React Admin
│   ├── ConfigurationContext.tsx  # Global config provider
│   └── i18nProvider.ts     # Internationalization
│
├── contacts/                # Contact management
│   ├── index.ts            # Resource export for React Admin
│   ├── ContactList.tsx     # List view with filters
│   ├── ContactShow.tsx     # Detail view
│   ├── ContactEdit.tsx     # Edit form
│   ├── ContactCreate.tsx   # Create form
│   └── ContactInputs.tsx   # Shared form inputs
│
├── opportunities/           # Sales opportunities (formerly "deals")
│   ├── OpportunityList.tsx
│   ├── OpportunityShow.tsx
│   ├── OpportunityEdit.tsx
│   ├── OpportunityCreate.tsx
│   ├── OpportunityInputs.tsx
│   ├── OpportunityKanban.tsx  # Kanban board view
│   └── __tests__/         # Feature-specific tests
│
├── organizations/           # Company management
├── products/               # Product catalog
├── sales/                  # Sales recording
├── tasks/                  # Task management
├── notes/                  # Note taking system
├── tags/                   # Tagging system
│
├── providers/              # Data access layer
│   └── supabase/
│       ├── unifiedDataProvider.ts  # Unified React Admin provider
│       ├── services/       # Decomposed service layer
│       │   ├── ValidationService.ts
│       │   ├── TransformService.ts
│       │   └── StorageService.ts
│       └── supabase.ts     # Supabase client initialization
│
├── services/               # Business logic services
│   ├── sales.service.ts
│   ├── opportunities.service.ts
│   ├── activities.service.ts
│   └── junctions.service.ts
│
├── validation/             # Zod schemas (API boundary validation)
│   ├── opportunities.ts
│   ├── contacts.ts
│   ├── organizations.ts
│   ├── tasks.ts
│   ├── notes.ts
│   ├── tags.ts
│   └── products.ts
│
├── components/             # Shared feature components
├── filters/                # Reusable filter components
├── hooks/                  # Custom React hooks
├── layout/                 # Application layout components
├── dashboard/              # Dashboard and analytics
├── settings/               # Settings page
├── utils/                  # Utility functions
└── types.ts                # TypeScript type definitions
```

**Key Design Pattern - Feature Module:**
Each entity (contacts, opportunities, etc.) follows this structure:
1. `index.ts` - Resource configuration for React Admin
2. `[Entity]List.tsx` - List view with filters and bulk actions
3. `[Entity]Show.tsx` - Read-only detail view
4. `[Entity]Edit.tsx` - Edit form
5. `[Entity]Create.tsx` - Create form
6. `[Entity]Inputs.tsx` - Shared input components

Components are lazy-loaded via `React.lazy()` for performance.

#### src/components/ - UI Component Library (80+ files)

**Three-Tier Architecture:**

```
src/components/
├── ui/                      # Tier 1: Base primitives (shadcn/ui)
│   ├── button.tsx          # Radix UI Button wrapper
│   ├── input.tsx           # Styled input component
│   ├── card.tsx            # Card container
│   ├── dialog.tsx          # Modal dialog
│   ├── select.tsx          # Select dropdown
│   ├── table.tsx           # Table component
│   ├── *.stories.tsx       # Storybook stories
│   └── ...50+ components
│
├── admin/                   # Tier 2: React Admin integration
│   ├── form.tsx            # Form wrapper with validation
│   ├── text-input.tsx      # Text input with RA field
│   ├── select-input.tsx    # Select input with RA field
│   ├── boolean-input.tsx   # Boolean toggle input
│   ├── file-input.tsx      # File upload with Supabase Storage
│   ├── autocomplete-array-input.tsx  # Multi-select with array
│   ├── error.tsx           # Error boundary
│   ├── confirm.tsx         # Confirmation dialog
│   └── __tests__/          # Admin component tests
│
└── supabase/               # Tier 3: Supabase-specific components
    ├── forgot-password-page.tsx
    └── set-password-page.tsx
```

**Design Philosophy:**
1. **Base Layer (ui/)** - Pure presentational components, no business logic
2. **Admin Layer (admin/)** - React Admin integration with validation
3. **Feature Layer (atomic-crm/)** - Business logic and feature composition

#### src/tests/ - Testing Infrastructure

```
src/tests/
├── fixtures/               # Test data fixtures
│   ├── opportunities.json  # Opportunity test data
│   ├── contacts.json       # Contact test data
│   ├── auth-users.json     # Authentication test users
│   └── ...
│
├── integration/            # Integration tests
│   └── *.test.ts
│
└── utils/                  # Testing utilities
    ├── test-helpers.ts
    └── __tests__/          # Test utility tests
```

### supabase/ - Database and Backend (20+ files)

**Purpose:** Database schema, migrations, and Edge Functions for Supabase backend.

```
supabase/
├── migrations/                    # Database migrations
│   ├── 20251012000000_initial_schema.sql  # Consolidated schema
│   └── _archived/                 # Historical migrations
│       ├── pre-consolidation/     # Pre-2025 migrations
│       └── pre-squash-2025-10-12/ # Squashed migrations backup
│
├── functions/                     # Supabase Edge Functions
│   ├── _shared/                   # Shared utilities
│   ├── updatePassword/            # Password update function
│   └── users/                     # User management
│
└── templates/                     # SQL templates
```

**Migration Strategy:**
- Timestamp format: `YYYYMMDDHHMMSS_migration_name.sql`
- Consolidated schema approach (68 historical migrations squashed)
- Archived old migrations for reference
- One-way migration (no rollback in production)

### scripts/ - Development Utilities (30+ files)

**Purpose:** Automation scripts for development, deployment, and data management.

**Key Categories:**

```
scripts/
├── Migration Scripts
│   ├── migrate-production.js      # Production migration executor
│   ├── migration-dry-run.js       # Preview migrations
│   ├── migration-backup.js        # Backup before migration
│   ├── migration-rollback.js      # Rollback on failure
│   └── migration-status.js        # Check migration state
│
├── Data Management
│   ├── seed-data.js               # Insert test data
│   ├── seed-products.js           # Seed product catalog
│   ├── cache-invalidation.js      # Clear caches
│   └── search-reindex.js          # Reindex search data
│
├── Validation
│   └── validation/
│       └── run-pre-validation.js  # Pre-migration validation
│
└── Deployment
    ├── ghpages-deploy.mjs         # GitHub Pages deployment
    └── supabase-remote-init.mjs   # Remote Supabase setup
```

### public/ - Static Assets

```
public/
├── img/                   # Application images
├── logos/                 # Brand logos (light/dark mode)
└── index.html            # HTML entry point
```

### tests/ - End-to-End Tests

```
tests/
├── e2e/                   # Playwright E2E tests
├── fixtures/              # E2E test fixtures
└── simple-smoke-test.sh   # Quick smoke test script
```

### Configuration Files (Root Level)

| File | Purpose |
|------|---------|
| `package.json` | NPM dependencies and scripts (62 scripts!) |
| `vite.config.ts` | Vite build configuration |
| `vitest.config.ts` | Vitest test configuration |
| `tsconfig.json` | TypeScript configuration (modular) |
| `tsconfig.app.json` | App-specific TypeScript config |
| `tsconfig.node.json` | Node scripts TypeScript config |
| `tailwind.config.js` | Tailwind CSS 4 configuration |
| `eslint.config.js` | ESLint linting rules |
| `.prettierrc.mjs` | Prettier formatting rules |
| `.env.example` | Environment variable template |
| `CLAUDE.md` | Claude Code instructions (316 lines) |
| `README.md` | Project documentation |

---

## 3. File-by-File Breakdown

### Core Application Files

#### Entry Points

**`src/main.tsx`** (11 lines)
```typescript
// React application bootstrap
- Creates root React element
- Renders App component in StrictMode
- Minimal entry point following single responsibility
```

**`src/App.tsx`** (35 lines)
```typescript
// Application configuration wrapper
- Imports and renders CRM component
- Passes customization props (logo, title, themes, etc.)
- Example-based documentation for customization
```

**`src/atomic-crm/root/CRM.tsx`** (157 lines)
```typescript
// Main application component
- Wraps React Admin <Admin> component
- Provides ConfigurationContext for global settings
- Registers all resources (opportunities, contacts, etc.)
- Defines custom routes (settings, password reset)
- Implements telemetry (production only, opt-out available)
```

**Purpose Flow:**
```
index.html → src/main.tsx → src/App.tsx → src/atomic-crm/root/CRM.tsx
  └── Vite        └── React      └── Config      └── React Admin + Resources
```

#### Data Provider (Core Architecture)

**`src/atomic-crm/providers/supabase/unifiedDataProvider.ts`** (700+ lines)
```typescript
/**
 * THE SINGLE SOURCE OF TRUTH FOR DATA ACCESS
 *
 * Consolidates 4+ provider layers into 1 unified provider:
 * 1. Base Supabase operations (ra-supabase-core)
 * 2. Resource transformations
 * 3. Validation (Zod schemas)
 * 4. Error logging
 * 5. Soft delete support
 * 6. JSONB normalization
 * 7. Full-text search
 */

Key Methods:
- getList()       // List with filtering, sorting, pagination
- getOne()        // Single record fetch
- getMany()       // Batch fetch by IDs
- getManyReference() // Related records fetch
- create()        // Create with validation
- update()        // Update with validation
- updateMany()    // Batch update
- delete()        // Soft delete (sets deleted_at)
- deleteMany()    // Batch soft delete

Special Handling:
- sales.create()     → SalesService (complex sales recording)
- opportunities.*    → OpportunitiesService (product syncing)
- contacts.*         → JSONB array normalization
- organizations.*    → Avatar storage integration
```

#### Service Layer

**`src/atomic-crm/providers/supabase/services/`** (Tier 1 - Framework-agnostic)

1. **ValidationService.ts**
   - Validates data against Zod schemas
   - Provides detailed error messages
   - Pre-database validation layer

2. **TransformService.ts**
   - JSONB array field normalization
   - Data format transformations
   - Attachment handling

3. **StorageService.ts**
   - Supabase Storage operations
   - Avatar upload/delete
   - File attachment management

**`src/atomic-crm/services/`** (Tier 2 - Business logic)

1. **SalesService.ts**
   - Complex sales record creation
   - Opportunity closing logic
   - Contact association

2. **OpportunitiesService.ts**
   - Product syncing via junction table
   - Participant management
   - Stage transition logic

3. **ActivitiesService.ts**
   - Activity tracking
   - Interaction logging
   - Timeline generation

4. **JunctionsService.ts**
   - Many-to-many relationship management
   - Contact-organization syncing
   - Opportunity-product syncing

#### Validation Schemas

**`src/atomic-crm/validation/opportunities.ts`** (Example - 200+ lines)
```typescript
import { z } from "zod";

// Enum schemas for strict typing
export const opportunityStageSchema = z.enum([
  'new_lead', 'initial_outreach', 'sample_visit_offered',
  'awaiting_response', 'feedback_logged', 'demo_scheduled',
  'closed_won', 'closed_lost'
]);

// Main opportunity schema with defaults
export const opportunitySchema = z.object({
  name: z.string().min(1).max(255),
  stage: opportunityStageSchema.default('new_lead'),
  status: opportunityStatusSchema.default('active'),
  priority: opportunityPrioritySchema.default('medium'),
  amount: z.number().min(0).optional(),
  probability: z.number().min(0).max(100).default(50),
  expected_close_date: z.string().datetime().optional(),
  // ... 30+ more fields
});

// Form defaults extraction
export const getOpportunityDefaults = () => {
  return opportunitySchema.partial().parse({});
  // Returns: { stage: 'new_lead', status: 'active', ... }
};
```

**Pattern Applied to:**
- `contacts.ts` - Email/phone JSONB array validation
- `organizations.ts` - URL and LinkedIn validation
- `tasks.ts` - Type enum and status validation
- `notes.ts` - Contact/opportunity note validation
- `tags.ts` - Tag creation validation
- `products.ts` - Product catalog validation

### Configuration Files

#### Build & Development

**`vite.config.ts`**
```typescript
export default defineConfig({
  plugins: [
    react(),          // React plugin with Fast Refresh
    tailwindcss(),    // Tailwind CSS 4 integration
    visualizer(),     // Bundle analysis
  ],
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-admin'],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          admin: ['react-admin', 'ra-core'],
        },
      },
    },
  },
});
```

**`vitest.config.ts`**
```typescript
export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/tests/setup.ts',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      lines: 70,        // Baseline: 70%
      branches: 70,
      functions: 70,
      statements: 70,
    },
  },
});
```

**`tsconfig.json`** (Modular Configuration)
```json
{
  "references": [
    { "path": "./tsconfig.app.json" },    // App code
    { "path": "./tsconfig.node.json" }    // Build scripts
  ],
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]   // Path alias for imports
    }
  }
}
```

#### Code Quality

**`eslint.config.js`**
- React hooks rules
- TypeScript strict checks
- Tailwind CSS class ordering
- Accessibility (a11y) checks
- React refresh checks

**`.prettierrc.mjs`**
- 2-space indentation
- Single quotes
- Trailing commas
- 80 character line width

#### Styling

**`tailwind.config.js`** (Tailwind CSS 4)
```javascript
export default {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Semantic color system
        primary: 'var(--primary)',
        secondary: 'var(--secondary)',
        destructive: 'var(--destructive)',
        // ... 20+ semantic colors
      },
    },
  },
  plugins: [require('tw-animate-css')],
};
```

**`src/index.css`** (CSS Variables)
```css
:root {
  /* Light mode colors */
  --primary: 220 70% 50%;
  --destructive: 0 70% 50%;
  /* ... semantic tokens */
}

.dark {
  /* Dark mode colors */
  --primary: 220 70% 60%;
  /* ... overrides */
}
```

### Data Layer

#### Database Migration Files

**`supabase/migrations/20251012000000_initial_schema.sql`** (2000+ lines)

**Structure:**
```sql
-- SECTION 1: EXTENSIONS (3 extensions)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- SECTION 2: CUSTOM TYPES/ENUMS (15 enums)
CREATE TYPE opportunity_stage AS ENUM (...);
CREATE TYPE organization_type AS ENUM (...);
CREATE TYPE product_category AS ENUM (...);
-- ... 12 more enums

-- SECTION 3: CORE TABLES (15 tables)
CREATE TABLE companies (...);
CREATE TABLE contacts (...);
CREATE TABLE opportunities (...);
-- ... 12 more tables

-- SECTION 4: JUNCTION TABLES (3 tables)
CREATE TABLE contact_organizations (...);
CREATE TABLE opportunity_products (...);
CREATE TABLE opportunity_contacts (...);

-- SECTION 5: INDEXES (40+ indexes)
CREATE INDEX idx_opportunities_stage ON opportunities(stage);
-- ... performance indexes

-- SECTION 6: ROW LEVEL SECURITY (15 policies)
ALTER TABLE opportunities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth_access" ON opportunities
  FOR ALL USING (auth.role() = 'authenticated');
-- ... simple RLS for all tables

-- SECTION 7: FUNCTIONS & TRIGGERS (5 functions)
CREATE FUNCTION sync_contact_organizations() ...;
CREATE FUNCTION sync_opportunity_products() ...;
-- ... helper functions

-- SECTION 8: VIEWS (2 views)
CREATE VIEW contacts_summary AS ...;
CREATE VIEW opportunities_summary AS ...;
```

**Key Design Decisions:**
1. **Soft Deletes** - All tables have `deleted_at` timestamp
2. **JSONB Arrays** - Flexible email/phone storage: `[{"email":"x@y.com", "type":"work"}]`
3. **Simple RLS** - `auth.role() = 'authenticated'` (no complex multi-tenancy)
4. **Audit Fields** - All tables: `created_at`, `updated_at`, `created_by`, `updated_by`
5. **Food Service Domain** - Product categories, storage temperatures, units of measure

### Frontend/UI

#### React Admin Views (Pattern: List/Show/Edit/Create)

**Example: `src/atomic-crm/opportunities/OpportunityList.tsx`** (300+ lines)
```typescript
export const OpportunityList = () => {
  return (
    <List
      filters={<OpportunityFilters />}
      sort={{ field: 'created_at', order: 'DESC' }}
      perPage={25}
    >
      <Datagrid>
        <TextField source="name" />
        <ReferenceField source="company_id" reference="organizations" />
        <ChipField source="stage" />
        <NumberField source="amount" />
        <DateField source="expected_close_date" />
        <EditButton />
      </Datagrid>
    </List>
  );
};
```

**Kanban View:** `OpportunityKanban.tsx` (500+ lines)
- Drag-and-drop stage management
- @hello-pangea/dnd library
- Stage-based columns with opportunity cards
- Index field for ordering within columns
- Real-time updates via React Admin

#### shadcn/ui Components (50+ components)

**Base Components:** button, input, card, dialog, select, table, tabs, accordion, alert, avatar, badge, checkbox, combobox, command, dropdown-menu, form, label, navigation-menu, popover, progress, radio-group, separator, sheet, skeleton, spinner, switch, textarea, tooltip

**Storybook Integration:**
- Each component has `.stories.tsx` file
- Visual regression testing via Chromatic
- Component documentation and variants
- Accessibility testing

### Testing

#### Test Files Organization

**Unit Tests (co-located with source):**
```
src/atomic-crm/validation/__tests__/
├── contacts/
│   ├── email-validation.test.ts
│   └── phone-validation.test.ts
├── opportunities/
│   ├── stage-validation.test.ts
│   └── amount-validation.test.ts
└── organizations/
    └── url-validation.test.ts
```

**Integration Tests:**
```
src/atomic-crm/tests/
├── unifiedDataProvider.test.ts     # Data provider tests
├── dataProviderSchemaValidation.test.ts
└── dataProviderErrors.test.ts
```

**Test Patterns:**
```typescript
// Example: src/components/admin/__tests__/form.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

describe('Form Component', () => {
  it('validates required fields', async () => {
    render(<FormComponent />);

    const submitButton = screen.getByRole('button', { name: /submit/i });
    await userEvent.click(submitButton);

    expect(screen.getByText(/required/i)).toBeInTheDocument();
  });
});
```

**Coverage Requirements:**
- 70% baseline across all metrics
- Semantic selectors preferred (getByRole > data-testid)
- Flaky test policy enforced

### Documentation

**User Documentation:** `doc/user/`
- User management guide
- Importing/exporting data
- Inbound email setup

**Developer Documentation:** `doc/developer/`
- Supabase configuration
- Deployment guide
- Customization guide
- Migration creation guide
- Architecture choices

**API Documentation:** `docs/api/`
- OpenAPI specification
- Webhook migration guide
- API usage examples

**Database Documentation:** `docs/database/`
- ERD diagrams (Mermaid format)
- System context diagrams
- Relationship flow diagrams

### DevOps

**GitHub Actions:** `.github/workflows/check.yml`
```yaml
name: Check
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run lint
      - run: npm run build
      - run: npm run test:ci
```

**Deployment:**
- GitHub Pages (static hosting)
- Supabase (managed backend)
- GitHub Actions automation

---

## 4. Database Architecture Analysis

### Database Type
**PostgreSQL 15+** (via Supabase managed service)

### Connection Strategy

**Supabase Client Singleton:**
```typescript
// src/atomic-crm/providers/supabase/supabase.ts
import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  }
);
```

**Connection Management:**
- Supabase handles connection pooling (Supavisor)
- Client-side singleton pattern
- Auto-refresh for auth tokens
- Persistent sessions in localStorage

### ORM/ODM Usage

**ra-supabase-core** (React Admin integration)
- Implements React Admin DataProvider interface
- Translates RA queries to Supabase PostgREST queries
- Handles pagination, sorting, filtering
- No traditional ORM models

**Zod for Schema Validation** (not ORM)
- Type-safe schema definitions
- Runtime validation
- Replaces ORM schema definitions

### Schema Design

#### Core Tables (15 tables)

**companies** (Organizations)
```sql
CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  type organization_type DEFAULT 'prospect',
  logo_url TEXT,
  website VARCHAR(500),
  linkedin_url VARCHAR(500),
  address JSONB,
  industry VARCHAR(100),
  founded_year INTEGER,
  employee_count INTEGER,
  annual_revenue NUMERIC(15,2),
  parent_company_id UUID REFERENCES companies(id),

  -- Audit fields
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),
  deleted_at TIMESTAMPTZ,

  -- Constraints
  CONSTRAINT valid_website CHECK (website ~* '^https?://'),
  CONSTRAINT valid_employee_count CHECK (employee_count >= 0)
);
```

**contacts** (People)
```sql
CREATE TABLE contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  first_name VARCHAR(255) NOT NULL,
  last_name VARCHAR(255) NOT NULL,
  emails JSONB DEFAULT '[]',  -- [{"email":"x@y.com","type":"work","primary":true}]
  phones JSONB DEFAULT '[]',  -- [{"number":"+1234","type":"mobile"}]
  avatar_url TEXT,
  title VARCHAR(255),
  linkedin_url VARCHAR(500),
  notes TEXT,
  gender VARCHAR(50),

  -- Audit fields
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID,
  updated_by UUID,
  deleted_at TIMESTAMPTZ
);
```

**opportunities** (Sales Pipeline)
```sql
CREATE TABLE opportunities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  company_id UUID REFERENCES companies(id),
  stage opportunity_stage DEFAULT 'new_lead',
  status opportunity_status DEFAULT 'active',
  priority priority_level DEFAULT 'medium',
  amount NUMERIC(15,2) DEFAULT 0,
  probability INTEGER DEFAULT 50 CHECK (probability BETWEEN 0 AND 100),
  expected_close_date DATE,
  actual_close_date DATE,
  lead_source lead_source_type,
  category VARCHAR(100),
  description TEXT,
  next_step TEXT,
  index INTEGER DEFAULT 0,  -- For Kanban ordering

  -- Multi-stakeholder support
  primary_contact_id UUID REFERENCES contacts(id),

  -- Audit fields
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID,
  updated_by UUID,
  deleted_at TIMESTAMPTZ
);
```

**products** (Product Catalog - Food Service)
```sql
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  sku VARCHAR(100) UNIQUE,
  category product_category,
  status product_status DEFAULT 'active',
  description TEXT,
  unit_price NUMERIC(10,2),
  cost_price NUMERIC(10,2),
  unit_of_measure unit_of_measure,
  pack_size VARCHAR(100),
  storage_temperature storage_temperature,
  shelf_life_days INTEGER,
  allergens JSONB DEFAULT '[]',
  certifications JSONB DEFAULT '[]',
  image_url TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);
```

#### Junction Tables (Many-to-Many)

**contact_organizations** (Contact ↔ Company)
```sql
CREATE TABLE contact_organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  is_primary BOOLEAN DEFAULT false,
  is_decision_maker BOOLEAN DEFAULT false,
  role contact_role,
  start_date DATE,
  end_date DATE,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(contact_id, organization_id)
);

-- Trigger to sync when contact.company_id changes
CREATE TRIGGER sync_contact_org_on_contact_update
  AFTER INSERT OR UPDATE ON contacts
  FOR EACH ROW EXECUTE FUNCTION sync_contact_organizations();
```

**opportunity_products** (Opportunity ↔ Product)
```sql
CREATE TABLE opportunity_products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  opportunity_id UUID NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity NUMERIC(10,2) DEFAULT 1,
  unit_price NUMERIC(10,2),
  discount_percent NUMERIC(5,2) DEFAULT 0,
  total_price NUMERIC(15,2),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger to sync when opportunity products change
CREATE TRIGGER sync_opportunity_products_trigger
  AFTER INSERT OR UPDATE OR DELETE ON opportunity_products
  FOR EACH ROW EXECUTE FUNCTION sync_opportunity_products();
```

#### Relationships

**One-to-Many:**
- companies → contacts (via contact_organizations)
- companies → opportunities
- opportunities → activities
- opportunities → notes
- contacts → notes

**Many-to-Many:**
- contacts ↔ companies (via contact_organizations)
- opportunities ↔ products (via opportunity_products)
- opportunities ↔ contacts (via opportunity_contacts)

**Self-Referencing:**
- companies.parent_company_id → companies.id (hierarchy)

#### Indexes

**Performance Indexes (40+):**
```sql
-- Primary lookups
CREATE INDEX idx_opportunities_company ON opportunities(company_id);
CREATE INDEX idx_opportunities_stage ON opportunities(stage);
CREATE INDEX idx_opportunities_status ON opportunities(status);
CREATE INDEX idx_contacts_company ON contacts(company_id);

-- Soft delete filtering
CREATE INDEX idx_opportunities_deleted ON opportunities(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX idx_contacts_deleted ON contacts(deleted_at) WHERE deleted_at IS NULL;

-- Full-text search
CREATE INDEX idx_contacts_search ON contacts USING gin(to_tsvector('english',
  first_name || ' ' || last_name || ' ' || COALESCE(title, '')));

-- JSONB searches
CREATE INDEX idx_contacts_emails ON contacts USING gin(emails);
CREATE INDEX idx_contacts_phones ON contacts USING gin(phones);
```

#### Data Types

**Standard Types:**
- UUID (primary keys via uuid-ossp)
- VARCHAR (names, titles, URLs)
- TEXT (notes, descriptions)
- NUMERIC (money, percentages)
- INTEGER (counts, years)
- DATE/TIMESTAMPTZ (temporal data)
- BOOLEAN (flags)

**JSONB Arrays (Flexible Schema):**
```json
// contacts.emails
[
  {"email": "john@company.com", "type": "work", "primary": true},
  {"email": "john@personal.com", "type": "personal", "primary": false}
]

// contacts.phones
[
  {"number": "+1-555-1234", "type": "mobile", "primary": true},
  {"number": "+1-555-5678", "type": "office", "extension": "123"}
]

// products.allergens
["dairy", "nuts", "gluten"]

// products.certifications
[
  {"name": "Organic", "issuer": "USDA", "expires": "2025-12-31"},
  {"name": "Kosher", "issuer": "OK", "expires": null}
]
```

**Custom ENUMs (15 types):**
- opportunity_stage (8 values)
- opportunity_status (5 values)
- organization_type (7 values)
- product_category (19 values)
- product_status (6 values)
- contact_role (8 values)
- priority_level (4 values)
- activity_type (2 values)
- interaction_type (11 values)
- etc.

#### Validation Rules

**Database Constraints:**
```sql
-- Check constraints
CONSTRAINT valid_probability CHECK (probability BETWEEN 0 AND 100)
CONSTRAINT valid_amount CHECK (amount >= 0)
CONSTRAINT valid_employee_count CHECK (employee_count >= 0)
CONSTRAINT valid_website CHECK (website ~* '^https?://')

-- Unique constraints
CONSTRAINT unique_sku UNIQUE(sku)
CONSTRAINT unique_contact_org UNIQUE(contact_id, organization_id)

-- Foreign key constraints
ALL foreign keys have ON DELETE CASCADE or ON DELETE RESTRICT
```

**Application-Level Validation (Zod):**
- Email format validation
- Phone number format validation
- URL format validation (with protocol)
- LinkedIn URL validation
- Date range validation
- Numeric range validation

### Migration Strategy

**Tool:** Supabase CLI migrations

**Workflow:**
1. Create migration file: `supabase migration new feature_name`
2. Write SQL with idempotent checks
3. Test locally: `supabase db reset`
4. Apply to remote: `supabase db push`

**Version Control:**
- All migrations in `supabase/migrations/`
- Timestamp-based naming: `YYYYMMDDHHMMSS_name.sql`
- Git-tracked for team collaboration

**Consolidation Strategy:**
- 68 historical migrations squashed into `20251012000000_initial_schema.sql`
- Old migrations archived in `_archived/` folders
- One-time consolidation (October 2025)

**Rollback Procedures:**
- Manual rollback scripts (no automatic down migrations)
- Backup before major migrations: `npm run migrate:backup`
- Rollback script: `npm run migrate:rollback`

### Data Access Patterns

**Repository Pattern:**
Not used - React Admin DataProvider acts as repository abstraction

**Unified Data Provider Pattern:**
```typescript
// All CRUD operations through single provider
dataProvider.getList('opportunities', { filter, sort, pagination })
dataProvider.create('contacts', { data })
dataProvider.update('opportunities', { id, data })
dataProvider.delete('companies', { id })  // Soft delete
```

**Resource-Specific Services:**
```typescript
// Complex operations delegated to services
SalesService.create(data)           // Multi-step sale creation
OpportunitiesService.syncProducts() // Junction table syncing
ActivitiesService.track()           // Activity logging
```

**Query Optimization:**
- Automatic index usage via PostgREST
- Select only required fields
- Pagination to limit result sets
- Denormalized views for common queries (`contacts_summary`)

**Caching:**
- React Query (via React Admin) caches API responses
- Stale-while-revalidate strategy
- Optimistic updates for instant UI feedback
- Cache invalidation via `useRefresh()` hook

### Database Security

**Authentication:**
- Supabase Auth (JWT-based)
- Email/password, OAuth (Google, Azure, etc.)
- Magic links for passwordless auth
- Session persistence in localStorage

**Row Level Security (RLS):**
```sql
-- Simple authenticated-user policy on all tables
ALTER TABLE opportunities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth_access" ON opportunities
  FOR ALL USING (auth.role() = 'authenticated');
```

**Authorization Strategy:**
- ALL authenticated users can access ALL data (simple CRM, no multi-tenancy)
- Future: Can add org_id filtering for multi-tenant

**Encryption:**
- At rest: Supabase automatic encryption
- In transit: HTTPS/TLS for all connections
- Passwords: bcrypt hashing via Supabase Auth
- API keys: Anon key (public) vs Service key (private)

**SQL Injection Prevention:**
- PostgREST parameterized queries
- Supabase client escapes all inputs
- Zod validation before database calls

**Access Control:**
- Supabase dashboard: Role-based access
- Database: RLS policies
- Storage: Bucket policies

### Performance Considerations

**Query Optimization:**
```sql
-- Indexed foreign keys
CREATE INDEX idx_opportunities_company ON opportunities(company_id);

-- Filtered indexes for soft deletes
CREATE INDEX idx_deleted ON opportunities(deleted_at) WHERE deleted_at IS NULL;

-- Full-text search indexes
CREATE INDEX idx_search ON contacts USING gin(to_tsvector('english', ...));

-- JSONB indexes
CREATE INDEX idx_emails ON contacts USING gin(emails);
```

**Connection Pool:**
- Supavisor (Supabase connection pooler)
- Transaction mode pooling
- Automatic scaling

**Read/Write Splitting:**
- Not implemented (single database)
- Supabase automatic replica reads (enterprise tier)

**Performance Monitoring:**
- Supabase Dashboard: Slow query log
- MCP tool: `mcp__supabase-lite__get_advisors` for recommendations
- Database size monitoring
- Index usage statistics

### Backup and Recovery

**Backup Strategy:**
- Supabase automatic daily backups (7-day retention)
- Point-in-time recovery (PITR) available (pro tier)
- Migration-based backup: `npm run migrate:backup`

**Disaster Recovery:**
- Supabase multi-region replication (enterprise)
- Manual export: `pg_dump` via Supabase CLI
- Restore: `pg_restore` via Supabase CLI

**Data Export:**
- CSV export via React Admin UI
- JSON export via API
- SQL dump via Supabase CLI

---

## 5. API Endpoints Analysis

### API Architecture

**Backend:** Supabase PostgREST (automatic REST API)

**Base URL:** `https://[project-id].supabase.co/rest/v1/`

### Authentication Patterns

**JWT-Based Authentication:**
```typescript
// All requests include JWT token in header
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

// Token includes:
{
  sub: 'user-uuid',
  role: 'authenticated',
  exp: 1234567890
}
```

**Anonymous Key vs Service Key:**
- Anon key: Used by frontend (RLS enforced)
- Service key: Used by Edge Functions (bypass RLS)

### Discovered Endpoints

**Automatic REST Endpoints (PostgREST):**

#### Opportunities
```http
GET    /rest/v1/opportunities?select=*&deleted_at=is.null
GET    /rest/v1/opportunities?id=eq.{uuid}
POST   /rest/v1/opportunities
PATCH  /rest/v1/opportunities?id=eq.{uuid}
DELETE /rest/v1/opportunities?id=eq.{uuid}  # Sets deleted_at

# Filtering
GET /rest/v1/opportunities?stage=eq.new_lead
GET /rest/v1/opportunities?amount=gte.1000
GET /rest/v1/opportunities?company_id=eq.{uuid}

# Sorting
GET /rest/v1/opportunities?order=created_at.desc

# Pagination
GET /rest/v1/opportunities?limit=25&offset=0

# Select specific fields
GET /rest/v1/opportunities?select=id,name,amount,stage

# Join with company
GET /rest/v1/opportunities?select=*,companies(name,website)
```

#### Contacts
```http
GET    /rest/v1/contacts?select=*&deleted_at=is.null
POST   /rest/v1/contacts
PATCH  /rest/v1/contacts?id=eq.{uuid}
DELETE /rest/v1/contacts?id=eq.{uuid}

# JSONB array filtering
GET /rest/v1/contacts?emails->>0->>email=like.*@company.com
GET /rest/v1/contacts?phones=cs.{array}  # contains

# Full-text search
GET /rest/v1/contacts?or=(first_name.ilike.*john*,last_name.ilike.*john*)
```

#### Organizations (Companies)
```http
GET    /rest/v1/companies?select=*&deleted_at=is.null
POST   /rest/v1/companies
PATCH  /rest/v1/companies?id=eq.{uuid}
DELETE /rest/v1/companies?id=eq.{uuid}

# Hierarchy queries
GET /rest/v1/companies?parent_company_id=is.null  # Root companies
GET /rest/v1/companies?parent_company_id=eq.{uuid}  # Subsidiaries
```

#### Products
```http
GET    /rest/v1/products?select=*&status=eq.active
POST   /rest/v1/products
PATCH  /rest/v1/products?id=eq.{uuid}
DELETE /rest/v1/products?id=eq.{uuid}

# Category filtering
GET /rest/v1/products?category=eq.beverages
GET /rest/v1/products?storage_temperature=eq.frozen
```

#### Junction Tables
```http
# Contact-Organization relationships
GET /rest/v1/contact_organizations?contact_id=eq.{uuid}
POST /rest/v1/contact_organizations

# Opportunity-Product relationships
GET /rest/v1/opportunity_products?opportunity_id=eq.{uuid}
POST /rest/v1/opportunity_products
```

#### Views
```http
# Denormalized contact data with company names
GET /rest/v1/contacts_summary?select=*
```

#### RPC Functions
```http
POST /rest/v1/rpc/sync_contact_organizations
POST /rest/v1/rpc/sync_opportunity_products
```

### Request/Response Formats

**Request Headers:**
```http
Content-Type: application/json
Authorization: Bearer {jwt-token}
apikey: {anon-key}
Prefer: return=representation  # Return created/updated record
```

**Response Format (JSON):**
```json
// Single record
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "name": "Acme Corp Opportunity",
  "stage": "new_lead",
  "amount": 50000.00,
  "created_at": "2025-10-13T10:30:00Z"
}

// List of records
[
  { "id": "...", "name": "..." },
  { "id": "...", "name": "..." }
]

// Error response
{
  "message": "JWT expired",
  "code": "PGRST301"
}
```

**Pagination Headers:**
```http
Content-Range: 0-24/156  # Showing 0-24 of 156 total
```

### API Versioning Strategy

**No explicit versioning** - Supabase PostgREST provides stable API

**Schema Evolution Strategy:**
1. Add new columns (non-breaking)
2. Keep old columns during migration period
3. Use database views for backward compatibility
4. Deprecate old fields with warnings

### Edge Functions (Custom Endpoints)

**`supabase/functions/updatePassword/`**
```typescript
// POST /functions/v1/updatePassword
{
  "newPassword": "securepassword123"
}
// Returns: { success: true }
```

**`supabase/functions/users/`**
```typescript
// GET /functions/v1/users
// Returns: List of users with metadata
```

### Storage API

**Supabase Storage Buckets:**

**Attachments Bucket:**
```http
POST /storage/v1/object/attachments/avatars/{filename}
GET  /storage/v1/object/public/attachments/avatars/{filename}
DELETE /storage/v1/object/attachments/avatars/{filename}
```

**Upload Pattern:**
```typescript
const file = event.target.files[0];
const { data, error } = await supabase.storage
  .from('attachments')
  .upload(`avatars/${userId}/${Date.now()}-${file.name}`, file);
```

---

## 6. Architecture Deep Dive

### Overall Application Architecture

**Layered Architecture with Service Abstraction:**

```
┌─────────────────────────────────────────────────────────────────────┐
│                         PRESENTATION LAYER                          │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  React Components (Feature Layer)                            │  │
│  │  - OpportunityList, OpportunityEdit, OpportunityCreate      │  │
│  │  - ContactList, ContactEdit, ContactCreate                   │  │
│  │  - Lazy-loaded via React.lazy()                             │  │
│  └──────────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  React Admin Integration Layer                               │  │
│  │  - AdminForm, AdminTextInput, AdminSelectInput              │  │
│  │  - Validation integration, error handling                    │  │
│  └──────────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  Base UI Components (shadcn/ui)                              │  │
│  │  - Button, Input, Card, Dialog, Select                      │  │
│  │  - Radix UI primitives, styled with Tailwind               │  │
│  └──────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
                                  ↕
┌─────────────────────────────────────────────────────────────────────┐
│                       APPLICATION LAYER                              │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  React Admin Core                                            │  │
│  │  - <Admin> component wraps entire app                       │  │
│  │  - Resource registry, routing, auth                         │  │
│  └──────────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  Unified Data Provider (Single Source of Truth)             │  │
│  │  - Implements React Admin DataProvider interface            │  │
│  │  - Routes operations to appropriate services                │  │
│  │  - Handles validation, transformation, error logging        │  │
│  └──────────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  Business Logic Services (Tier 2)                           │  │
│  │  - SalesService: Complex sales operations                   │  │
│  │  - OpportunitiesService: Product syncing                    │  │
│  │  - ActivitiesService: Activity tracking                     │  │
│  │  - JunctionsService: Many-to-many management                │  │
│  └──────────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  Decomposed Services (Tier 1)                               │  │
│  │  - ValidationService: Zod schema validation                 │  │
│  │  - TransformService: Data normalization                     │  │
│  │  - StorageService: File management                          │  │
│  └──────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
                                  ↕
┌─────────────────────────────────────────────────────────────────────┐
│                          DATA LAYER                                  │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  Supabase Client (Singleton)                                 │  │
│  │  - PostgREST API client                                      │  │
│  │  - Auth management (JWT)                                     │  │
│  │  - Real-time subscriptions                                   │  │
│  │  - Storage API client                                        │  │
│  └──────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
                                  ↕
┌─────────────────────────────────────────────────────────────────────┐
│                       SUPABASE BACKEND                               │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  PostgreSQL Database                                         │  │
│  │  - 15 core tables, 3 junction tables                        │  │
│  │  - Row Level Security (RLS)                                 │  │
│  │  - Triggers, functions, views                               │  │
│  └──────────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  Supabase Auth                                               │  │
│  │  - JWT token generation                                      │  │
│  │  - OAuth providers                                           │  │
│  │  - Session management                                        │  │
│  └──────────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  Supabase Storage                                            │  │
│  │  - Attachments bucket                                        │  │
│  │  - Avatar storage                                            │  │
│  └──────────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  Edge Functions                                              │  │
│  │  - updatePassword, users                                     │  │
│  └──────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

### Data Flow and Request Lifecycle

**CREATE Operation Example:**

```
1. USER ACTION
   ↓
   User fills out OpportunityCreate form
   ↓

2. PRESENTATION LAYER
   ↓
   React Hook Form collects form data
   ↓
   Form submission triggers useCreate() hook (React Admin)
   ↓

3. APPLICATION LAYER - Data Provider
   ↓
   dataProvider.create('opportunities', { data })
   ↓
   ValidationService.validate(data, opportunitySchema)
   ├── Success → Continue
   └── Failure → Return validation errors to UI
   ↓
   TransformService.transform(data)
   ├── Normalize JSONB arrays
   ├── Handle file uploads
   └── Format dates
   ↓
   Check resource type
   ├── opportunities → OpportunitiesService.create()
   │   └── Create opportunity + sync products
   ├── sales → SalesService.create()
   │   └── Complex multi-step operation
   └── Other → Base provider

4. DATA LAYER
   ↓
   Supabase client POST request
   ↓
   POST /rest/v1/opportunities
   Headers: Authorization: Bearer {jwt}
   Body: { name, stage, amount, ... }
   ↓

5. SUPABASE BACKEND
   ↓
   PostgREST receives request
   ↓
   Validate JWT token
   ↓
   Check RLS policies
   ├── auth.role() = 'authenticated' → Allow
   └── Else → Reject
   ↓
   INSERT INTO opportunities (...)
   ↓
   Trigger: update_updated_at()
   ↓
   Return created record with ID
   ↓

6. RESPONSE FLOW
   ↓
   Supabase → Supabase Client
   ↓
   Data Provider → React Admin
   ↓
   React Query updates cache
   ↓
   UI re-renders with new data
   ↓
   Show success notification
   ↓
   Redirect to opportunity detail page
```

**COMPLEX OPERATION - Sales Creation:**

```
User clicks "Record Sale" → SalesService.create(data)
  ↓
  Step 1: Validate opportunity exists and is in closed_won stage
  ↓
  Step 2: Create sale record
  ↓
  Step 3: Update opportunity.actual_close_date
  ↓
  Step 4: Create activity record for sale
  ↓
  Step 5: Associate contacts with sale
  ↓
  All wrapped in transaction via RPC function
  ↓
  Return sale record with relations
```

### Key Design Patterns

#### 1. **Unified Data Provider Pattern**
```typescript
// Single provider instead of 4+ layers
unifiedDataProvider = {
  baseProvider +        // Supabase operations
  validation +          // Zod schemas
  transformation +      // JSONB normalization
  errorLogging +        // Debugging
  softDeletes +         // deleted_at handling
  resourceRouting       // Service delegation
}
```

#### 2. **Service Layer Pattern**
```typescript
// Decomposed services for complex operations
interface Service {
  create(data): Promise<Record>
  update(id, data): Promise<Record>
  delete(id): Promise<void>
}

// Business logic services implement this interface
class SalesService implements Service { ... }
class OpportunitiesService implements Service { ... }
```

#### 3. **Validation at Boundary Pattern**
```typescript
// Validation ONLY at API boundary (not in UI, not in DB)
// Zod schema is single source of truth
export const opportunitySchema = z.object({ ... });

// Validation happens in ValidationService before DB call
ValidationService.validate(data, opportunitySchema);
// Throws ValidationError if invalid
```

#### 4. **Form Defaults from Schema Pattern**
```typescript
// Form defaults extracted from Zod schema
const defaultValues = opportunitySchema.partial().parse({});
// Returns: { stage: 'new_lead', status: 'active', priority: 'medium' }

// Never hardcode defaults in UI
// ❌ BAD: defaultValue="new_lead"
// ✅ GOOD: defaultValues={getOpportunityDefaults()}
```

#### 5. **Soft Delete Pattern**
```typescript
// All tables have deleted_at timestamp
// DELETE operation sets deleted_at, not hard delete
DELETE FROM opportunities WHERE id = $1
→
UPDATE opportunities SET deleted_at = NOW() WHERE id = $1

// Queries filter out soft-deleted records
SELECT * FROM opportunities WHERE deleted_at IS NULL
```

#### 6. **JSONB Array Pattern**
```typescript
// Flexible schema for emails/phones
contacts.emails = [
  { email: 'x@y.com', type: 'work', primary: true },
  { email: 'z@y.com', type: 'personal', primary: false }
]

// Advantages:
// - No separate email table
// - Easy to add metadata (type, primary flag)
// - Full-text searchable with GIN index
```

#### 7. **Junction Table with Auto-Sync Pattern**
```typescript
// Many-to-many with primary key tracking
contact_organizations = {
  contact_id,
  organization_id,
  is_primary,       // Only one primary per contact
  is_decision_maker
}

// Trigger syncs when contact.company_id changes
CREATE TRIGGER sync_contact_org ON contacts
  AFTER UPDATE
  EXECUTE FUNCTION sync_contact_organizations();
```

#### 8. **Configuration Provider Pattern**
```typescript
// Global app config via Context
<ConfigurationProvider
  opportunityStages={['new_lead', 'initial_outreach', ...]}
  taskTypes={['call', 'email', 'meeting', ...]}
  contactGender={['male', 'female', 'other']}
>
  <App />
</ConfigurationProvider>

// Components access via useConfiguration() hook
const { opportunityStages } = useConfiguration();
```

#### 9. **Lazy Loading Pattern**
```typescript
// Feature components lazy-loaded
const OpportunityList = React.lazy(() => import('./OpportunityList'));
const OpportunityEdit = React.lazy(() => import('./OpportunityEdit'));

export default {
  list: OpportunityList,
  edit: OpportunityEdit,
  // ... React Admin handles loading states
};
```

#### 10. **Optimistic Updates Pattern**
```typescript
// React Query optimistic updates via React Admin
const [update] = useUpdate();

await update(
  'opportunities',
  { id, data },
  {
    optimisticResponse: { id, ...data },  // Update UI immediately
    onSuccess: () => toast.success('Saved!'),
    onError: () => toast.error('Failed!') // Rollback on error
  }
);
```

### Dependencies Between Modules

**Dependency Graph:**

```
CRM.tsx (Root)
  ├─→ React Admin (Admin framework)
  │   └─→ DataProvider (unifiedDataProvider)
  │       ├─→ Supabase Client
  │       ├─→ ValidationService → Zod Schemas
  │       ├─→ TransformService → StorageService
  │       └─→ Business Services
  │           ├─→ SalesService
  │           ├─→ OpportunitiesService
  │           ├─→ ActivitiesService
  │           └─→ JunctionsService
  │
  ├─→ Resources (Feature Modules)
  │   ├─→ opportunities/
  │   │   ├─→ OpportunityList
  │   │   ├─→ OpportunityEdit
  │   │   ├─→ OpportunityCreate
  │   │   └─→ OpportunityInputs → Admin Components
  │   ├─→ contacts/
  │   ├─→ organizations/
  │   └─→ products/
  │
  ├─→ Admin Components (Integration Layer)
  │   ├─→ Form, TextInput, SelectInput
  │   └─→ Base UI Components (shadcn/ui)
  │
  ├─→ Layout Components
  │   ├─→ Sidebar, Header, Footer
  │   └─→ Dashboard
  │
  └─→ Configuration
      ├─→ i18nProvider (Internationalization)
      ├─→ authProvider (Supabase Auth)
      └─→ ConfigurationProvider (App settings)
```

**Key Dependencies:**
- **React Admin** is the backbone (handles routing, state, CRUD)
- **Unified Data Provider** is the single point of data access
- **Zod Schemas** are the single source of validation truth
- **shadcn/ui** provides all base UI components
- **Supabase Client** is the only database interface

**Circular Dependency Prevention:**
- Services never import from components
- Components import from services (one-way)
- Validation schemas are pure (no imports from services)
- Types are in separate files

---

## 7. Environment & Setup Analysis

### Required Environment Variables

**`.env.example`:**
```bash
# Supabase Configuration (REQUIRED)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here

# Opportunity Pipeline Configuration (OPTIONAL)
OPPORTUNITY_DEFAULT_STAGE=new_lead
OPPORTUNITY_PIPELINE_STAGES=new_lead,initial_outreach,sample_visit_offered,awaiting_response,feedback_logged,demo_scheduled,closed_won,closed_lost

# Contact Configuration (OPTIONAL)
CONTACT_DEFAULT_GENDER=

# Database (Local Development)
DATABASE_URL=postgresql://postgres:postgres@localhost:54322/postgres
```

**Environment Files:**
- `.env.development` - Local development (Supabase local instance)
- `.env.local` - Local overrides (gitignored)
- `.env.production` - Production deployment

### Installation and Setup Process

**Prerequisites:**
- Node.js 22 LTS
- npm (comes with Node.js)
- Git
- Supabase CLI (for local development)

**Step-by-Step Setup:**

```bash
# 1. Clone repository
git clone https://github.com/[username]/atomic-crm.git
cd atomic-crm

# 2. Install dependencies (includes Supabase local setup)
npm install

# 3. Copy environment template
cp .env.example .env.development

# 4. Configure Supabase
# For local development:
npm run supabase:local:start
# This starts local Supabase with migrations applied

# For remote Supabase:
npm run supabase:remote:init
# Follow prompts to connect to remote project

# 5. Seed test data (optional)
npm run seed:data

# 6. Start development server
npm run dev

# 7. Open browser
# http://localhost:5173
```

**First-Time User Setup:**
1. Navigate to http://localhost:5173
2. Click "Sign Up" to create first user
3. Supabase Auth creates user account
4. Redirected to dashboard

### Development Workflow

**Daily Development:**
```bash
# Start dev server (if local Supabase is already running)
npm run dev

# Start dev server + reset local database
npm run dev:local

# Run tests in watch mode
npm test

# Check code quality
npm run lint

# Format code
npm run prettier:apply
```

**Database Changes:**
```bash
# 1. Create migration
npx supabase migration new feature_name

# 2. Write SQL in supabase/migrations/[timestamp]_feature_name.sql

# 3. Apply to local database
npx supabase db reset

# 4. Test changes
npm run dev

# 5. Generate TypeScript types
npm run supabase:generate-types

# 6. Commit migration file
git add supabase/migrations/
git commit -m "Add feature_name migration"

# 7. Deploy to remote (when ready)
npm run supabase:deploy
```

**Testing Workflow:**
```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run specific test file
npx vitest src/atomic-crm/validation/__tests__/opportunities.test.ts

# Run E2E tests
npm run test:e2e

# Open Vitest UI
npm run test:ui
```

**Feature Development Workflow:**
```bash
# 1. Create feature branch
git checkout -b feature/new-feature

# 2. Research existing patterns (use parallel agents)
# See .docs/plans/ for past examples

# 3. Plan implementation
# Create .docs/plans/new-feature/requirements.md

# 4. Database changes (if needed)
npm run supabase migration new new_feature

# 5. Implement feature
# - Add Zod schema in src/atomic-crm/validation/
# - Create feature module in src/atomic-crm/[feature]/
# - Add tests

# 6. Run tests and linting
npm run lint
npm test

# 7. Commit and push
git add .
git commit -m "feat: Add new feature"
git push origin feature/new-feature

# 8. Create pull request
gh pr create --title "Add new feature" --body "..."
```

### Production Deployment Strategy

**Hosting:**
- **Frontend:** GitHub Pages (static hosting)
- **Backend:** Supabase (managed service)

**Deployment Process:**

```bash
# 1. Build production bundle
npm run build

# 2. Deploy database migrations (if any)
npm run supabase:deploy

# 3. Deploy to GitHub Pages
npm run prod:deploy

# This runs:
# - npm run build (TypeScript check + Vite build)
# - npm run supabase:deploy (migrations + Edge Functions)
# - npm run ghpages:deploy (push dist/ to gh-pages branch)
```

**GitHub Actions CI/CD:**
```yaml
# .github/workflows/check.yml
on: [push, pull_request]
jobs:
  test:
    - npm run lint       # Code quality
    - npm run build      # TypeScript check
    - npm run test:ci    # All tests
```

**Environment Configuration:**

**Development:**
- Local Supabase instance
- Test data seeded
- Vite dev server with HMR
- Source maps enabled

**Production:**
- Remote Supabase instance
- Real production data
- Optimized bundle (minified, tree-shaken)
- No source maps

**Rollback Strategy:**
1. Revert git commit: `git revert HEAD`
2. Rebuild: `npm run build`
3. Redeploy: `npm run prod:deploy`
4. Database rollback (manual): `npm run migrate:rollback`

---

## 8. Technology Stack Breakdown

### Runtime Environment

**Node.js 22 LTS**
- ES Modules (`"type": "module"` in package.json)
- Native fetch API
- Top-level await support
- Used for: Build scripts, development server, tests

**Browser Support:**
- Modern evergreen browsers (Chrome, Firefox, Safari, Edge)
- ES2020+ features
- No IE11 support

### Frameworks and Libraries

#### Core Framework
**React 19.1.0**
- Concurrent features
- Automatic batching
- Transitions API
- Server Components (not used yet)
- Key Features Used:
  - Hooks (useState, useEffect, useContext, useMemo)
  - Concurrent rendering
  - Suspense for lazy loading
  - StrictMode for development checks

**React Admin 5.10.0**
- Enterprise admin framework
- Built on React Query
- Provides:
  - CRUD operations (List, Show, Edit, Create)
  - Routing and navigation
  - Authentication and authorization
  - Form handling
  - Data fetching and caching
  - Bulk actions
  - Export functionality
  - Filter system

#### UI Framework
**shadcn/ui (Custom)**
- Component library based on Radix UI
- Styled with Tailwind CSS
- Copy-paste components (not npm package)
- 50+ components available
- Accessible by default (ARIA, keyboard nav)

**Radix UI Primitives:**
- @radix-ui/react-dialog
- @radix-ui/react-dropdown-menu
- @radix-ui/react-select
- @radix-ui/react-tabs
- @radix-ui/react-accordion
- ... 20+ more primitives

**Tailwind CSS 4.1.11**
- Utility-first CSS
- JIT compiler
- Custom semantic color system
- Dark mode support
- Responsive design utilities
- Plugin: tw-animate-css

#### State Management
**React Query 5.85.9** (via React Admin)
- Server state management
- Automatic caching
- Background refetching
- Optimistic updates
- Request deduplication
- Pagination and infinite queries

**Local State:**
- React hooks (useState, useReducer)
- Context API for global config

#### Forms
**React Hook Form 7.62.0**
- Performant form library
- Uncontrolled components
- Built-in validation
- TypeScript support
- Used with Zod for schema validation

**@hookform/resolvers 5.1.1**
- Zod resolver integration
- Validation error mapping

#### Validation
**Zod 4.0.5**
- TypeScript-first schema validation
- Runtime type checking
- Inferred TypeScript types
- Default values extraction
- Transformation pipelines
- Error message customization

### Database Technologies

**PostgreSQL 15+** (via Supabase)
- Relational database
- JSONB support
- Full-text search (pg_trgm)
- UUID generation (uuid-ossp)
- Encryption (pgcrypto)

**Supabase 2.39.0**
- Database: PostgreSQL
- Auth: JWT-based authentication
- Storage: S3-compatible object storage
- Realtime: WebSocket subscriptions (not currently used)
- Edge Functions: Deno-based serverless functions

**ra-supabase-core 3.5.1**
- React Admin integration for Supabase
- DataProvider implementation
- AuthProvider implementation
- PostgREST query translation

### Build Tools and Bundlers

**Vite 7.0.4**
- ES modules-based dev server
- Fast HMR (Hot Module Replacement)
- Optimized production builds
- Code splitting
- Tree shaking
- Asset optimization
- Plugin system

**@vitejs/plugin-react 4.6.0**
- React Fast Refresh
- JSX transformation

**@tailwindcss/vite 4.1.11**
- Tailwind CSS 4 integration
- JIT compilation

**TypeScript 5.8.3**
- Static type checking
- No runtime overhead
- Strict mode enabled
- Path aliases

**Build Output:**
- Modern ES modules
- Code-split chunks
- Minified and compressed
- Source maps (development only)

### Testing Frameworks

**Vitest 3.2.4**
- Vite-native test runner
- Jest-compatible API
- Fast parallel execution
- ES modules support
- Coverage via v8

**@testing-library/react 16.3.0**
- Component testing
- User-centric queries
- Semantic selectors

**@testing-library/user-event 14.6.1**
- Realistic user interactions
- Event simulation

**@testing-library/jest-dom 6.6.3**
- Custom matchers
- Accessibility checks

**Playwright (E2E)**
- Browser automation
- Cross-browser testing
- Visual regression testing

**@vitest/coverage-v8 3.2.4**
- Native V8 coverage
- Fast and accurate

**jsdom 27.0.0**
- DOM simulation for tests

### Deployment Technologies

**GitHub Pages**
- Static site hosting
- Custom domain support
- HTTPS by default
- CI/CD via GitHub Actions

**GitHub Actions**
- CI/CD automation
- Run tests on push/PR
- Automated deployments

**Supabase CLI 2.45.5**
- Local development environment
- Migration management
- Function deployment
- Type generation

### Development Tools

**ESLint 9.22.0**
- JavaScript/TypeScript linting
- React-specific rules
- Accessibility rules
- Tailwind CSS ordering

**Prettier 3.6.2**
- Code formatting
- Consistent style
- Pre-commit integration

**Storybook 9.1.10**
- Component development
- Visual testing
- Documentation
- Chromatic integration for visual regression

**Chromatic 11.18.1**
- Visual regression testing
- Component snapshot testing
- CI integration

### Utility Libraries

**Data Manipulation:**
- lodash 4.17.21 - Utility functions
- inflection 3.0.2 - String inflection
- query-string 9.2.2 - URL query parsing

**Date/Time:**
- Native JavaScript Date (no moment.js or date-fns)

**File Handling:**
- papaparse 5.5.3 - CSV parsing
- jsonexport 3.2.0 - JSON to CSV export
- react-dropzone 14.3.8 - File uploads

**Image Handling:**
- react-cropper 2.3.3 - Image cropping

**Charts/Visualization:**
- @nivo/bar 0.99.0 - Bar charts

**Drag and Drop:**
- @hello-pangea/dnd 18.0.1 - Drag and drop (Kanban)

**Notifications:**
- sonner 2.0.7 - Toast notifications

**Security:**
- dompurify 3.2.7 - XSS prevention

**Testing Utilities:**
- @faker-js/faker 9.9.0 - Test data generation

---

## 9. Visual Architecture Diagrams

### High-Level System Architecture

```
┌────────────────────────────────────────────────────────────────────────┐
│                          USER INTERFACE                                 │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                    React Application (Vite)                      │  │
│  │  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌─────────────┐  │  │
│  │  │ Dashboard  │ │Opportunities│ │  Contacts  │ │Organizations│  │  │
│  │  └────────────┘ └────────────┘ └────────────┘ └─────────────┘  │  │
│  │  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌─────────────┐  │  │
│  │  │  Products  │ │   Tasks    │ │   Notes    │ │   Settings  │  │  │
│  │  └────────────┘ └────────────┘ └────────────┘ └─────────────┘  │  │
│  │                                                                  │  │
│  │  Components: shadcn/ui + Tailwind CSS                          │  │
│  └──────────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────┘
                                    ↕ HTTPS
┌────────────────────────────────────────────────────────────────────────┐
│                         APPLICATION LAYER                              │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                      React Admin Framework                       │  │
│  │  - Routing, State Management, CRUD Operations                   │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │               Unified Data Provider (Single Source)             │  │
│  │  ┌─────────────┐ ┌──────────────┐ ┌──────────────┐            │  │
│  │  │ Validation  │ │ Transformation│ │   Storage    │            │  │
│  │  │  Service    │ │    Service    │ │   Service    │            │  │
│  │  └─────────────┘ └──────────────┘ └──────────────┘            │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                  Business Logic Services                         │  │
│  │  ┌────────────┐ ┌──────────────┐ ┌─────────────┐ ┌──────────┐ │  │
│  │  │   Sales    │ │Opportunities │ │ Activities  │ │Junctions │ │  │
│  │  │  Service   │ │   Service    │ │  Service    │ │ Service  │ │  │
│  │  └────────────┘ └──────────────┘ └─────────────┘ └──────────┘ │  │
│  └──────────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────┘
                                    ↕ REST API (JWT Auth)
┌────────────────────────────────────────────────────────────────────────┐
│                        SUPABASE BACKEND                                │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                       PostgREST API                              │  │
│  │  - Automatic REST endpoints for all tables                      │  │
│  │  - Query filtering, sorting, pagination                         │  │
│  │  - JSON response format                                         │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                   PostgreSQL Database                            │  │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐           │  │
│  │  │Companies │ │ Contacts │ │Opportunities│ │ Products │           │  │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘           │  │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐           │  │
│  │  │Activities│ │  Tasks   │ │  Notes   │ │   Tags   │           │  │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘           │  │
│  │  ┌──────────────────────┐ ┌─────────────────────────┐          │  │
│  │  │contact_organizations │ │ opportunity_products    │          │  │
│  │  └──────────────────────┘ └─────────────────────────┘          │  │
│  │                                                                  │  │
│  │  Features: RLS, Triggers, Functions, Views, Indexes            │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                      Supabase Auth                               │  │
│  │  - JWT Token Generation                                         │  │
│  │  - OAuth Providers (Google, Azure, etc.)                       │  │
│  │  - Session Management                                           │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                    Supabase Storage                              │  │
│  │  - Attachments Bucket (Avatars, Files)                         │  │
│  │  - S3-compatible Object Storage                                │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                     Edge Functions (Deno)                        │  │
│  │  - updatePassword, users                                        │  │
│  └──────────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────┘
```

### Component Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                     COMPONENT HIERARCHY                              │
└─────────────────────────────────────────────────────────────────────┘

main.tsx (Entry Point)
  ↓
App.tsx (Configuration)
  ↓
CRM.tsx (Root Component)
  ├─→ ConfigurationProvider (Global Settings)
  │     ↓
  │   <Admin> (React Admin Core)
  │     ├─→ authProvider (Supabase Auth)
  │     ├─→ dataProvider (Unified Data Provider)
  │     ├─→ i18nProvider (Internationalization)
  │     ├─→ store (localStorage)
  │     │
  │     ├─→ Layout (Application Shell)
  │     │     ├─→ Sidebar (Navigation)
  │     │     ├─→ Header (Title, Actions)
  │     │     └─→ Footer
  │     │
  │     ├─→ Dashboard (Home Page)
  │     │     ├─→ WelcomeCard
  │     │     ├─→ OpportunityPipeline (Chart)
  │     │     └─→ RecentActivities
  │     │
  │     ├─→ Resources (CRUD Views)
  │     │     │
  │     │     ├─→ opportunities/
  │     │     │     ├─→ OpportunityList
  │     │     │     │     ├─→ OpportunityFilters
  │     │     │     │     ├─→ Datagrid
  │     │     │     │     └─→ OpportunityKanban
  │     │     │     ├─→ OpportunityShow
  │     │     │     │     ├─→ OpportunityHeader
  │     │     │     │     ├─→ OpportunityTabs
  │     │     │     │     └─→ ActivityTimeline
  │     │     │     ├─→ OpportunityEdit
  │     │     │     │     ├─→ AdminForm
  │     │     │     │     └─→ OpportunityInputs
  │     │     │     └─→ OpportunityCreate
  │     │     │           ├─→ AdminForm
  │     │     │           └─→ OpportunityInputs
  │     │     │
  │     │     ├─→ contacts/
  │     │     │     ├─→ ContactList
  │     │     │     ├─→ ContactShow
  │     │     │     ├─→ ContactEdit
  │     │     │     └─→ ContactCreate
  │     │     │
  │     │     ├─→ organizations/
  │     │     │     ├─→ OrganizationList
  │     │     │     ├─→ OrganizationShow
  │     │     │     ├─→ OrganizationEdit
  │     │     │     └─→ OrganizationCreate
  │     │     │
  │     │     └─→ products/
  │     │           ├─→ ProductList
  │     │           ├─→ ProductShow
  │     │           ├─→ ProductEdit
  │     │           └─→ ProductCreate
  │     │
  │     └─→ CustomRoutes
  │           ├─→ SettingsPage
  │           ├─→ ForgotPasswordPage
  │           └─→ SetPasswordPage
  │
  └─→ Shared Components (Used Across Features)
        ├─→ Admin Layer (React Admin Integration)
        │     ├─→ AdminForm
        │     ├─→ AdminTextInput
        │     ├─→ AdminSelectInput
        │     ├─→ AdminBooleanInput
        │     ├─→ AdminFileInput
        │     └─→ AdminAutocompleteArrayInput
        │
        └─→ UI Layer (shadcn/ui Primitives)
              ├─→ Button
              ├─→ Input
              ├─→ Select
              ├─→ Card
              ├─→ Dialog
              ├─→ Tabs
              ├─→ Table
              └─→ ... 40+ more components
```

### Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                          DATA FLOW                                   │
└─────────────────────────────────────────────────────────────────────┘

1. FETCH DATA (Read Operations)
═══════════════════════════════════

User Views List
  ↓
React Admin: useGetList()
  ↓
React Query: Check cache
  ├─→ Cache Hit → Return cached data
  └─→ Cache Miss ↓

Unified Data Provider: getList()
  ├─→ Apply soft delete filter (deleted_at IS NULL)
  ├─→ Apply user filters
  ├─→ Apply sorting
  └─→ Apply pagination
  ↓
Supabase Client: GET /rest/v1/opportunities?...
  ↓
PostgREST: Parse query parameters
  ├─→ Validate JWT token
  ├─→ Check RLS policies
  └─→ Build SQL query
  ↓
PostgreSQL: Execute SELECT query
  ├─→ Apply WHERE clause
  ├─→ Apply ORDER BY
  ├─→ Apply LIMIT/OFFSET
  └─→ Return rows
  ↓
PostgREST: Format as JSON
  ├─→ Add Content-Range header
  └─→ Return response
  ↓
Unified Data Provider: Transform response
  ├─→ Normalize JSONB arrays
  └─→ Format dates
  ↓
React Query: Cache response
  ↓
React Admin: Update UI
  ↓
User Sees Data


2. CREATE DATA (Write Operations)
════════════════════════════════════

User Submits Form
  ↓
React Hook Form: Collect form data
  ↓
React Admin: useCreate()
  ↓
Unified Data Provider: create()
  ├─→ ValidationService.validate()
  │     ├─→ Zod schema validation
  │     └─→ Return errors or continue
  ├─→ TransformService.transform()
  │     ├─→ Normalize JSONB arrays
  │     ├─→ Upload files to Storage
  │     └─→ Format dates
  └─→ Check resource type
        ├─→ opportunities → OpportunitiesService
        ├─→ sales → SalesService
        └─→ other → Base provider
  ↓
Supabase Client: POST /rest/v1/opportunities
  ├─→ Headers: Authorization, apikey
  └─→ Body: JSON data
  ↓
PostgREST: Validate request
  ├─→ Check JWT token
  ├─→ Check RLS policies
  └─→ Build INSERT query
  ↓
PostgreSQL: Execute INSERT
  ├─→ INSERT INTO opportunities (...)
  ├─→ Trigger: update_updated_at()
  └─→ RETURNING *
  ↓
PostgREST: Format response
  ↓
Unified Data Provider: Transform response
  ↓
React Query: Invalidate cache & refetch
  ↓
React Admin: Show success notification
  ↓
User Redirected to Detail Page


3. COMPLEX OPERATION (Sales Creation)
══════════════════════════════════════

User Clicks "Record Sale"
  ↓
React Admin: useCreate('sales', data)
  ↓
Unified Data Provider: create('sales', data)
  ↓
SalesService.create(data)
  ├─→ Step 1: Validate opportunity in closed_won stage
  ├─→ Step 2: Create sale record
  ├─→ Step 3: Update opportunity.actual_close_date
  ├─→ Step 4: Create activity record
  └─→ Step 5: Associate contacts
  ↓
Multiple Supabase API calls in sequence
  ├─→ POST /rest/v1/sales
  ├─→ PATCH /rest/v1/opportunities?id=eq.{uuid}
  └─→ POST /rest/v1/activities
  ↓
All wrapped in service layer for consistency
  ↓
Return sale record with relations
  ↓
React Query: Invalidate multiple caches
  ├─→ Invalidate sales list
  ├─→ Invalidate opportunity detail
  └─→ Invalidate activities list
  ↓
UI Updates Everywhere


4. REAL-TIME COLLABORATION (Future Feature)
═══════════════════════════════════════════

PostgreSQL: INSERT INTO opportunities
  ↓
PostgreSQL: Notify via pg_notify
  ↓
Supabase Realtime: Listen to changes
  ↓
WebSocket: Push to subscribed clients
  ↓
React Admin: Receive update
  ↓
React Query: Update cache
  ↓
UI Updates Automatically

(Note: Realtime not currently implemented)
```

### Database Schema Relationships

```
┌─────────────────────────────────────────────────────────────────────┐
│                   DATABASE SCHEMA (ERD)                              │
└─────────────────────────────────────────────────────────────────────┘

         ┌──────────────┐
         │   COMPANIES  │
         ├──────────────┤
         │ id (PK)      │
         │ name         │
         │ type         │◀───┐
         │ logo_url     │    │
         │ website      │    │ parent_company_id
         │ parent_id (FK)────┘ (self-reference)
         └──────┬───────┘
                │
                │ 1:N
                │
         ┌──────▼───────┐
         │  CONTACTS    │
         ├──────────────┤
         │ id (PK)      │◀───────────────────┐
         │ first_name   │                    │
         │ last_name    │                    │
         │ emails[]     │ (JSONB)            │
         │ phones[]     │ (JSONB)            │
         │ avatar_url   │                    │
         └──────┬───────┘                    │
                │                            │
                │ M:N (via junction)         │
                │                            │
         ┌──────▼─────────────────┐          │
         │ CONTACT_ORGANIZATIONS  │          │
         ├────────────────────────┤          │
         │ id (PK)                │          │
         │ contact_id (FK)        │──────────┘
         │ organization_id (FK)   │──────┐
         │ is_primary             │      │
         │ is_decision_maker      │      │
         │ role                   │      │
         └────────────────────────┘      │
                                         │
                                         │
         ┌──────────────┐                │
         │OPPORTUNITIES │◀───────────────┘
         ├──────────────┤
         │ id (PK)      │
         │ name         │
         │ company_id(FK)───┐
         │ stage        │   │
         │ status       │   │ N:1
         │ amount       │   │
         │ probability  │   └──────────────┐
         │ index        │ (Kanban order)   │
         └──────┬───────┘                  │
                │                          │
                │ M:N                      │
                │                          ▼
         ┌──────▼──────────────┐    ┌──────────────┐
         │OPPORTUNITY_PRODUCTS │    │  COMPANIES   │
         ├─────────────────────┤    │  (same as    │
         │ id (PK)             │    │   above)     │
         │ opportunity_id (FK) │    └──────────────┘
         │ product_id (FK)     │────┐
         │ quantity            │    │
         │ unit_price          │    │ N:1
         │ total_price         │    │
         └─────────────────────┘    │
                                    │
                                    ▼
         ┌──────────────┐    ┌──────────────┐
         │  PRODUCTS    │    │ ACTIVITIES   │
         ├──────────────┤    ├──────────────┤
         │ id (PK)      │    │ id (PK)      │
         │ name         │    │ type         │
         │ sku          │    │ opportunity_id│
         │ category     │    │ contact_id   │
         │ status       │    │ description  │
         │ unit_price   │    │ date         │
         │ storage_temp │    └──────────────┘
         │ allergens[]  │          ▲
         └──────────────┘          │ 1:N
                                   │
         ┌──────────────┐          │
         │   TASKS      │──────────┘
         ├──────────────┤
         │ id (PK)      │
         │ type         │
         │ status       │
         │ due_date     │
         │ contact_id   │
         │ opportunity_id│
         └──────────────┘
                │
                │ 1:N
                │
         ┌──────▼───────┐
         │    NOTES     │
         ├──────────────┤
         │ id (PK)      │
         │ content      │
         │ type         │
         │ contact_id   │
         │ opportunity_id│
         └──────────────┘

Legend:
───── One-to-Many Relationship
═════ Many-to-Many Relationship (via junction table)
┌────┐
│ PK │ Primary Key
│ FK │ Foreign Key
└────┘
```

### File Structure Hierarchy

```
crispy-crm/
│
├── Configuration & Build (Root Level)
│   ├── package.json           ⚙️ NPM config (62 scripts)
│   ├── vite.config.ts        ⚡ Vite build config
│   ├── vitest.config.ts      🧪 Test config
│   ├── tsconfig.json         📘 TypeScript config
│   ├── tailwind.config.js    🎨 Tailwind CSS config
│   ├── .env.example          🔐 Environment template
│   ├── CLAUDE.md             🤖 Claude Code instructions
│   └── README.md             📄 Project documentation
│
├── src/                       💻 Application Source Code
│   ├── main.tsx              🚀 React entry point
│   ├── App.tsx               🎯 App configuration
│   ├── index.css             🎨 Global styles
│   │
│   ├── atomic-crm/           🏢 CRM Application
│   │   ├── root/             🌳 App bootstrap
│   │   │   ├── CRM.tsx       (Root component)
│   │   │   ├── ConfigurationContext.tsx
│   │   │   └── i18nProvider.ts
│   │   │
│   │   ├── opportunities/    💰 Sales Pipeline
│   │   │   ├── index.ts
│   │   │   ├── OpportunityList.tsx
│   │   │   ├── OpportunityShow.tsx
│   │   │   ├── OpportunityEdit.tsx
│   │   │   ├── OpportunityCreate.tsx
│   │   │   ├── OpportunityInputs.tsx
│   │   │   ├── OpportunityKanban.tsx
│   │   │   └── __tests__/
│   │   │
│   │   ├── contacts/         👥 Contact Management
│   │   ├── organizations/    🏭 Company Management
│   │   ├── products/         📦 Product Catalog
│   │   ├── sales/            💵 Sales Recording
│   │   ├── tasks/            ✅ Task Management
│   │   ├── notes/            📝 Note Taking
│   │   ├── tags/             🏷️  Tagging System
│   │   │
│   │   ├── providers/        🔌 Data Access
│   │   │   └── supabase/
│   │   │       ├── unifiedDataProvider.ts
│   │   │       ├── supabase.ts
│   │   │       └── services/
│   │   │           ├── ValidationService.ts
│   │   │           ├── TransformService.ts
│   │   │           └── StorageService.ts
│   │   │
│   │   ├── services/         🛠️  Business Logic
│   │   │   ├── sales.service.ts
│   │   │   ├── opportunities.service.ts
│   │   │   ├── activities.service.ts
│   │   │   └── junctions.service.ts
│   │   │
│   │   ├── validation/       ✔️  Zod Schemas
│   │   │   ├── opportunities.ts
│   │   │   ├── contacts.ts
│   │   │   ├── organizations.ts
│   │   │   └── __tests__/
│   │   │
│   │   ├── components/       🧩 Shared Components
│   │   ├── filters/          🔍 Filter Components
│   │   ├── hooks/            🪝 Custom Hooks
│   │   ├── layout/           📐 Layout Components
│   │   ├── dashboard/        📊 Dashboard
│   │   ├── settings/         ⚙️  Settings
│   │   └── utils/            🔧 Utility Functions
│   │
│   ├── components/           🎨 UI Components
│   │   ├── ui/               (shadcn/ui - 50+ components)
│   │   ├── admin/            (React Admin integration)
│   │   └── supabase/         (Supabase-specific)
│   │
│   ├── tests/                🧪 Testing Infrastructure
│   │   ├── fixtures/         (Test data)
│   │   ├── integration/      (Integration tests)
│   │   └── utils/            (Test utilities)
│   │
│   └── types/                📚 TypeScript Types
│
├── supabase/                 🗄️  Database & Backend
│   ├── migrations/           📋 Database Migrations
│   │   ├── 20251012000000_initial_schema.sql
│   │   └── _archived/        (Historical migrations)
│   │
│   ├── functions/            ⚡ Edge Functions
│   │   ├── updatePassword/
│   │   └── users/
│   │
│   └── templates/            📝 SQL Templates
│
├── scripts/                  🔨 Dev Utilities
│   ├── migrate-production.js
│   ├── seed-data.js
│   ├── cache-invalidation.js
│   └── validation/
│
├── tests/                    🎭 E2E Tests
│   └── e2e/                  (Playwright)
│
├── .docs/                    📖 Planning Docs
│   └── plans/                (Feature plans)
│
├── .claude/                  🤖 Claude Config
│   ├── commands/             (Slash commands)
│   └── agents/               (Custom agents)
│
├── .github/                  🚀 CI/CD
│   └── workflows/
│       └── check.yml
│
├── public/                   🌐 Static Assets
│   ├── img/
│   └── logos/
│
└── dist/                     📦 Build Output
    └── (Generated by Vite)
```

---

## 10. Key Insights & Recommendations

### Code Quality Assessment

**Strengths:** ✅

1. **Well-Architected:**
   - Clear separation of concerns (Presentation → Application → Data)
   - Unified data provider eliminates layer sprawl
   - Service layer for complex business logic
   - Consistent feature module pattern

2. **Type Safety:**
   - TypeScript throughout
   - Zod schemas provide runtime validation
   - Generated types from database schema
   - Strict mode enabled

3. **Testing:**
   - 70% coverage baseline enforced
   - Unit, integration, and E2E tests
   - Semantic selectors for maintainability
   - Test fixtures for consistency

4. **Documentation:**
   - Comprehensive CLAUDE.md (316 lines)
   - Parallel planning in .docs/plans/
   - API documentation (OpenAPI)
   - Database ERD diagrams

5. **Engineering Constitution:**
   - Explicit rules prevent debates
   - Single source of truth enforced
   - Boy Scout Rule for incremental improvements
   - Fail-fast philosophy

**Weaknesses:** ⚠️

1. **Over-Documentation:**
   - 100+ planning docs in .docs/plans/
   - Some plans outdated (X- prefix indicates completion)
   - Risk: Documentation drift from code

2. **Test Coverage Gaps:**
   - E2E tests not comprehensive
   - Missing tests for:
     - RBAC (when multi-tenancy added)
     - Complex junction table operations
     - File upload edge cases
     - Search functionality

3. **Performance:**
   - No bundle size budgets
   - No lazy loading strategy for large lists
   - No virtualization (added VirtualizedList.tsx but not used)

4. **Security:**
   - Simple RLS (no multi-tenancy)
   - All authenticated users see all data
   - No field-level permissions
   - No audit logging

5. **Error Handling:**
   - Generic error messages
   - No error boundaries in all components
   - No retry logic for failed requests

### Database Optimization Opportunities

**Immediate Wins:** 🚀

1. **Denormalized Views:**
   ```sql
   -- Already exists: contacts_summary
   -- Add more for common queries
   CREATE VIEW opportunities_enriched AS
   SELECT
     o.*,
     c.name as company_name,
     COUNT(op.id) as product_count,
     SUM(op.total_price) as total_value
   FROM opportunities o
   LEFT JOIN companies c ON o.company_id = c.id
   LEFT JOIN opportunity_products op ON o.id = op.opportunity_id
   GROUP BY o.id, c.name;
   ```

2. **Partial Indexes:**
   ```sql
   -- Only index active opportunities (most queries filter on this)
   CREATE INDEX idx_opportunities_active
   ON opportunities(stage, expected_close_date)
   WHERE deleted_at IS NULL AND status = 'active';
   ```

3. **Materialized Views for Dashboard:**
   ```sql
   CREATE MATERIALIZED VIEW opportunity_pipeline_stats AS
   SELECT
     stage,
     COUNT(*) as count,
     SUM(amount) as total_amount,
     AVG(probability) as avg_probability
   FROM opportunities
   WHERE deleted_at IS NULL AND status = 'active'
   GROUP BY stage;

   -- Refresh hourly
   CREATE OR REPLACE FUNCTION refresh_pipeline_stats()
   RETURNS void AS $$
   BEGIN
     REFRESH MATERIALIZED VIEW CONCURRENTLY opportunity_pipeline_stats;
   END;
   $$ LANGUAGE plpgsql;
   ```

4. **JSONB Indexes Optimization:**
   ```sql
   -- Add GIN indexes for JSONB searches if not exist
   CREATE INDEX idx_contacts_emails_gin ON contacts USING gin(emails jsonb_path_ops);
   CREATE INDEX idx_contacts_phones_gin ON contacts USING gin(phones jsonb_path_ops);
   ```

**Long-Term Improvements:** 📈

1. **Read Replicas:**
   - Offload dashboard queries to read replica
   - Supabase Pro tier feature

2. **Connection Pooling:**
   - Already handled by Supabase Supavisor
   - Monitor pool size as user base grows

3. **Query Performance Monitoring:**
   - Enable pg_stat_statements
   - Set up slow query alerts
   - Use `mcp__supabase-lite__get_advisors` regularly

4. **Data Archiving:**
   - Move old closed opportunities to archive table
   - Keep main table lean for faster queries

### Possible Problems

**Critical:** 🔴

1. **No Multi-Tenancy:**
   - All authenticated users see ALL data
   - Risk: Customer data leakage
   - Fix: Add company_id to all tables + RLS policies

2. **Soft Delete Complexity:**
   - Cascading deletes not handled
   - Example: Delete company → orphaned opportunities?
   - Fix: Add CASCADE or prevent deletion if related records exist

3. **No API Rate Limiting:**
   - Supabase has limits (anon key)
   - Risk: Accidental DDoS from infinite scroll
   - Fix: Implement client-side throttling

**High:** 🟠

1. **JSONB Array Validation:**
   - Emails/phones stored as JSONB arrays
   - No database-level validation
   - Risk: Invalid data (e.g., malformed email)
   - Fix: Add CHECK constraints with regex

2. **File Upload Security:**
   - No file size limits in code
   - No file type validation
   - Risk: Large file uploads, malware
   - Fix: Add validation in StorageService

3. **No Backup Verification:**
   - Supabase automatic backups
   - No restoration tests
   - Risk: Backups may be corrupted
   - Fix: Schedule monthly restore tests

**Medium:** 🟡

1. **Stale Test Fixtures:**
   - Fixtures may drift from schema
   - Risk: Tests pass but code fails in production
   - Fix: Generate fixtures from schema

2. **No Performance Budgets:**
   - Bundle size growing
   - No lighthouse score tracking
   - Risk: Slow app on mobile
   - Fix: Add bundle size limits in CI

3. **Missing Migrations Rollback:**
   - One-way migrations only
   - Risk: Can't easily revert bad migration
   - Fix: Write down migrations

### Potential Improvements

**Quick Wins (1-2 days):** ⚡

1. **Add Bundle Size Monitoring:**
   ```javascript
   // vite.config.ts
   build: {
     rollupOptions: {
       output: {
         manualChunks(id) {
           if (id.includes('node_modules')) {
             if (id.includes('react')) return 'vendor-react';
             if (id.includes('admin')) return 'vendor-admin';
             return 'vendor-other';
           }
         }
       }
     },
     chunkSizeWarningLimit: 500  // KB
   }
   ```

2. **Add Error Boundaries:**
   ```typescript
   // Wrap each feature module
   <ErrorBoundary>
     <OpportunityList />
   </ErrorBoundary>
   ```

3. **Add Request Retry Logic:**
   ```typescript
   // React Query config
   queryClient: new QueryClient({
     defaultOptions: {
       queries: {
         retry: 3,
         retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
       },
     },
   })
   ```

4. **Add Lighthouse CI:**
   ```yaml
   # .github/workflows/lighthouse.yml
   - name: Run Lighthouse
     uses: treosh/lighthouse-ci-action@v9
     with:
       urls: |
         http://localhost:5173
       uploadArtifacts: true
       temporaryPublicStorage: true
   ```

**Medium Wins (3-5 days):** 🎯

1. **Implement Virtual Scrolling:**
   - Use react-window for large lists
   - OpportunityList with 1000+ records
   - 10x faster rendering

2. **Add Field-Level Permissions:**
   ```typescript
   // Example: Only admins can edit amount > $100k
   const canEditLargeAmount = user.role === 'admin' || opportunity.amount < 100000;

   <NumberInput
     source="amount"
     disabled={!canEditLargeAmount}
   />
   ```

3. **Implement Optimistic Locking:**
   ```typescript
   // Prevent concurrent edit conflicts
   interface Opportunity {
     version: number;  // Increment on each update
   }

   // Update checks version
   UPDATE opportunities
   SET ..., version = version + 1
   WHERE id = $1 AND version = $2;
   ```

4. **Add Full-Text Search:**
   ```sql
   -- Create full-text search vector
   ALTER TABLE opportunities
   ADD COLUMN search_vector tsvector;

   CREATE INDEX idx_opportunities_search
   ON opportunities USING gin(search_vector);

   -- Update trigger
   CREATE TRIGGER opportunities_search_update
   BEFORE INSERT OR UPDATE ON opportunities
   FOR EACH ROW EXECUTE FUNCTION
   tsvector_update_trigger(
     search_vector, 'pg_catalog.english',
     name, description, next_step
   );
   ```

**Long-Term Wins (1-2 weeks):** 🏆

1. **Implement Multi-Tenancy:**
   - Add `org_id` to all tables
   - Update RLS policies: `auth.jwt() ->> 'org_id' = org_id`
   - Migration strategy for existing data

2. **Add Real-Time Collaboration:**
   ```typescript
   // Supabase Realtime subscriptions
   const subscription = supabase
     .channel('opportunities')
     .on('postgres_changes',
       { event: '*', schema: 'public', table: 'opportunities' },
       (payload) => {
         // Update UI when others edit
         queryClient.invalidateQueries('opportunities');
       }
     )
     .subscribe();
   ```

3. **Implement Audit Logging:**
   ```sql
   CREATE TABLE audit_log (
     id UUID PRIMARY KEY,
     table_name TEXT,
     record_id UUID,
     action TEXT,  -- INSERT, UPDATE, DELETE
     old_data JSONB,
     new_data JSONB,
     user_id UUID,
     timestamp TIMESTAMPTZ DEFAULT NOW()
   );

   -- Trigger on all tables
   CREATE TRIGGER audit_opportunities
   AFTER INSERT OR UPDATE OR DELETE ON opportunities
   FOR EACH ROW EXECUTE FUNCTION log_audit();
   ```

4. **Add Advanced Analytics:**
   - Sales funnel conversion rates
   - Time-to-close by stage
   - Lead source ROI
   - Product performance
   - Dashboard with @nivo charts

### Security Considerations

**Authentication:** ✅ Good

- Supabase Auth (industry-standard)
- JWT tokens with auto-refresh
- OAuth providers supported
- Password hashing (bcrypt)

**Authorization:** ⚠️ Needs Improvement

- Current: All authenticated users see all data
- Missing:
  - Role-based access control (RBAC)
  - Field-level permissions
  - Team-based access
  - Admin/Manager/User roles

**Recommendations:**
```sql
-- Add roles table
CREATE TABLE user_roles (
  user_id UUID REFERENCES auth.users(id),
  role TEXT CHECK (role IN ('admin', 'manager', 'user')),
  org_id UUID REFERENCES organizations(id)
);

-- Update RLS policies
CREATE POLICY "users_see_own_org" ON opportunities
  FOR ALL USING (
    company_id IN (
      SELECT organization_id
      FROM user_roles
      WHERE user_id = auth.uid()
    )
  );
```

**Data Protection:** ⚠️ Needs Improvement

- Encryption at rest: ✅ Supabase automatic
- Encryption in transit: ✅ HTTPS/TLS
- Missing:
  - Sensitive field encryption (e.g., SSN, credit cards)
  - PII data masking
  - Data retention policies

**Input Validation:** ✅ Good

- Zod schemas at API boundary
- PostgREST parameterized queries (SQL injection prevention)
- DOMPurify for XSS prevention
- Missing:
  - File upload validation (size, type)
  - Rate limiting

**Recommendations:**
1. Add file upload validation:
   ```typescript
   const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
   const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'application/pdf'];

   if (file.size > MAX_FILE_SIZE) {
     throw new Error('File too large');
   }
   if (!ALLOWED_TYPES.includes(file.type)) {
     throw new Error('Invalid file type');
   }
   ```

2. Add rate limiting:
   ```typescript
   // Use Supabase Edge Functions with rate limiting middleware
   import { rateLimit } from 'edge-rate-limit';

   const limiter = rateLimit({
     interval: 60 * 1000,  // 1 minute
     maxRequests: 100       // 100 requests per minute
   });
   ```

### Performance Optimization Opportunities

**Frontend:** 🎨

1. **Code Splitting:**
   - Already lazy-loads feature components ✅
   - Add route-based splitting
   - Split vendor chunks (done ✅)

2. **Image Optimization:**
   ```typescript
   // Add next-gen image formats
   <img
     src={`${url}?format=webp&quality=80`}
     alt="Avatar"
   />
   ```

3. **Memoization:**
   ```typescript
   // Expensive computations
   const filteredOpportunities = useMemo(() => {
     return opportunities.filter(o => o.stage === selectedStage);
   }, [opportunities, selectedStage]);
   ```

4. **Virtualize Large Lists:**
   - Implement react-window for 100+ item lists
   - Already have VirtualizedList.tsx - start using it!

**Backend:** 🗄️

1. **Query Optimization:**
   - Use `select=id,name,amount` instead of `select=*`
   - Already implemented ✅

2. **Pagination:**
   - Implement cursor-based pagination for better performance
   - Current: Offset-based (can be slow for large datasets)

3. **Caching:**
   - React Query caching ✅
   - Add CDN for static assets
   - Add Redis for session storage (if needed)

### Maintainability Suggestions

**Code Organization:** ✅ Excellent

- Feature-based structure
- Consistent naming conventions
- Clear separation of concerns

**Improvements:**

1. **Storybook for All Components:**
   - Currently: Some components have stories
   - Goal: All shared components in Storybook
   - Benefit: Visual regression testing, documentation

2. **API Documentation:**
   - Generate OpenAPI spec from Zod schemas
   - Tool: zod-to-openapi

3. **Database Documentation:**
   - Auto-generate from schema
   - Tool: SchemaHero or tbls

4. **Dependency Updates:**
   - Set up Dependabot
   - Monthly update schedule
   - Automated PR creation

### Scalability Recommendations

**Current Scale:** Good for 100-1000 users

**For 1000-10,000 users:**

1. **Database:**
   - Enable read replicas (Supabase Pro)
   - Implement connection pooling tuning
   - Add materialized views for dashboards

2. **Frontend:**
   - Implement CDN for static assets
   - Add service worker for offline support
   - Optimize bundle size (target < 200KB)

3. **Backend:**
   - Implement rate limiting
   - Add request queuing for heavy operations
   - Use Edge Functions for complex logic

**For 10,000+ users:**

1. **Database:**
   - Consider database sharding by organization
   - Implement data archiving
   - Move to enterprise Supabase tier

2. **Frontend:**
   - Implement micro-frontends per feature
   - Use CDN for all assets
   - Optimize Time to Interactive (TTI)

3. **Backend:**
   - Implement event-driven architecture
   - Use message queues (e.g., Supabase Realtime)
   - Add background job processing

---

## Conclusion

Atomic CRM is a **well-architected, production-ready CRM system** built with modern technologies and best practices. The codebase demonstrates:

### Strengths:
- ✅ Clear architectural patterns (three-tier, service layer)
- ✅ Comprehensive testing strategy (70% coverage)
- ✅ Strong type safety (TypeScript + Zod)
- ✅ Excellent documentation (CLAUDE.md, planning docs)
- ✅ Engineering constitution prevents technical debt
- ✅ Modern tech stack (React 19, Tailwind 4, Supabase)

### Areas for Improvement:
- ⚠️ Multi-tenancy implementation needed
- ⚠️ Enhanced security (RBAC, field-level permissions)
- ⚠️ Performance optimizations (virtual scrolling, caching)
- ⚠️ Real-time collaboration features
- ⚠️ Audit logging system

### Recommended Next Steps:
1. **Immediate (Week 1):** Add bundle size monitoring, error boundaries, retry logic
2. **Short-term (Month 1):** Implement virtual scrolling, field-level permissions
3. **Medium-term (Quarter 1):** Add multi-tenancy, real-time collaboration, advanced analytics
4. **Long-term (Year 1):** Scale infrastructure, implement micro-frontends, add AI features

The codebase is well-positioned for growth and can support a successful CRM product with proper attention to scalability and security.

---

**End of Analysis**

*Generated by Claude Code (Sonnet 4.5) on 2025-10-13*
