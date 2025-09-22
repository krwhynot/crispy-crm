# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Development Commands

### Core Commands
- `npm run dev` - Start development server (Vite with force reload)
- `npm run build` - TypeScript check + production build
- `npm run preview` - Preview production build
- `npm test` - Run Vitest tests

### Code Quality
- `npm run lint:check` - Check ESLint violations
- `npm run lint:apply` - Auto-fix ESLint issues
- `npm run prettier:check` - Check formatting
- `npm run prettier:apply` - Auto-format code
- `npm run validate:colors` - Validate color usage across components

### Supabase
- `npx supabase start` - Start local Supabase instance
- `npx supabase stop` - Stop local Supabase
- `npm run supabase:remote:init` - Initialize remote Supabase connection

## Architecture Overview

This is Atomic CRM, a full-stack React CRM application built on these key architectural decisions:

### Dual Data Provider Architecture
The application supports two data provider modes configured via `VITE_IS_DEMO`:
- **FakeRest Provider**: In-memory data for development/demo (when `VITE_IS_DEMO=true`)
- **Supabase Provider**: Production-ready PostgreSQL backend with RLS policies

Both providers implement the React Admin DataProvider interface, allowing seamless switching between environments.

### Core Application Structure

The CRM component (`src/atomic-crm/root/CRM.tsx`) serves as the application root, accepting configuration for:
- Custom deal stages and pipelines
- Company sectors and contact metadata
- Theme configuration (light/dark modes)
- Authentication providers (Google, Azure, Keycloak, Auth0)

### Feature Module Organization

Each business entity follows a consistent module structure:
```
src/atomic-crm/[feature]/
├── index.ts           # Resource configuration for React Admin
├── [Feature]List.tsx  # List view with filters
├── [Feature]Show.tsx  # Detail view
├── [Feature]Edit.tsx  # Edit form
├── [Feature]Create.tsx # Create form
└── [Feature]Inputs.tsx # Shared form inputs
```

### Component Architecture

The UI layer uses a three-tier component system:
1. **Base Components** (`src/components/ui/`): shadcn/ui primitives
2. **Admin Components** (`src/components/admin/`): React Admin integrated components
3. **Feature Components** (`src/atomic-crm/`): Business logic components

### Database Schema

Key tables in Supabase:
- `companies` - Organization records with sectors
- `contacts` - People with email/phone as JSONB for flexibility
- `deals` - Sales pipeline with stages and statuses
- `tasks` - Activity tracking with reminders
- `contactNotes`/`dealNotes` - Communication history
- `tags` - Flexible categorization with color themes

All tables include RLS policies for multi-tenant security.

### Provider Pattern

The application uses React Admin's provider system:
- **AuthProvider**: Handles authentication flow with Supabase Auth or mock auth
- **DataProvider**: Abstracts data operations (CRUD, filtering, pagination)
- **I18nProvider**: Internationalization support (currently English)

### State Management

- React Admin's store for resource state and UI preferences
- React Query for server state caching and synchronization
- Local storage for user preferences and session persistence

### Color System Migration

The project is transitioning to a new Tailwind v4 color system:
- Color usage is tracked in `COLOR_USAGE_LIST.md`
- Migration plans documented in `.docs/plans/color-system-migration/`
- Tag colors migrated to semantic color tokens

## Important Patterns

### Resource Configuration
Resources are registered in the CRM component with their CRUD components. React Admin automatically generates routes and navigation based on these registrations.

### Form Handling
Forms use React Hook Form via React Admin's Form components. Validation uses Zod schemas with custom validators for business rules.

### Data Fetching
The dual provider pattern means data operations must work with both:
- FakeRest: Synchronous operations on in-memory data
- Supabase: Async operations with real PostgreSQL queries

### Authentication Flow
The app supports multiple auth methods through Supabase Auth, with custom pages for:
- Sign up with email verification
- Password reset flow
- SSO integration (Google, Azure, etc.)

## Environment Configuration

Required environment variables:
- `VITE_SUPABASE_URL` - Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Public anonymous key
- `VITE_IS_DEMO` - Toggle demo mode (FakeRest provider)
- `VITE_INBOUND_EMAIL` - Optional email capture address

## Testing Strategy

Tests use Vitest with React Testing Library. Test files follow the `*.test.ts(x)` or `*.spec.ts(x)` naming convention and are co-located with source files.