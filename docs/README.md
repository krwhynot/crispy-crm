# Atomic CRM Documentation

**Last Updated:** 2025-11-19
**Version:** 0.1.0

## Quick Start

- **New to the project?** → Start with [Product Overview](product-overview.md)
- **Need to set up locally?** → [Setup & Deployment Guide](setup-and-deployment.md)
- **Working with data?** → [Database Schema](database-schema.md)
- **Building features?** → [User Flows](user-flows.md) + [System Architecture](system-architecture.md)

---

## All Documentation

### Essential Guides (Start Here)

#### [Product Overview](product-overview.md)
What this CRM is, who it's for, and what it does. Read this first to understand the project scope and goals.

**Contents:**
- What is Atomic CRM?
- Primary users and use cases
- Core capabilities (contacts, opportunities, tasks, etc.)
- Features currently implemented (v0.1.0)
- Explicitly out of scope
- Success metrics and technology choices

---

#### [Database Schema](database-schema.md)
Complete data model with entity-relationship diagram, table definitions, and enum values.

**Contents:**
- Core entity tables (contacts, organizations, opportunities, tasks, products, sales, activities)
- Junction tables (contact_organizations, opportunity_participants)
- Field definitions with types, constraints, and examples
- JSONB array patterns (email, phone)
- Entity Relationship Diagram (Mermaid)
- Row Level Security (RLS) policies
- Soft delete pattern
- Audit fields (created_at, updated_at, deleted_at)

---

#### [API Documentation](api-documentation.md)
How to interact with the backend via Supabase and the unified data provider.

**Contents:**
- Authentication flow (Supabase Auth with JWT)
- Data Provider pattern (React Admin abstraction)
- CRUD operations (getList, getOne, create, update, delete)
- Edge Functions (users, updatePassword, check-overdue-tasks)
- RPC Functions (PostgreSQL stored procedures)
- Service layer classes (SalesService, OpportunitiesService, ActivitiesService)
- Error handling and validation (Zod schemas)
- Testing the API locally

---

#### [System Architecture](system-architecture.md)
Technology stack, architectural decisions, and system diagrams.

**Contents:**
- Complete technology stack (frontend, backend, dev tools)
- System diagram (Mermaid)
- Application structure (entry points, resource-based architecture)
- Component organization
- Data flow (user → component → data provider → Supabase → PostgreSQL)
- Key architectural decisions (React Admin, Supabase, Tailwind, Zod, slide-overs, lazy loading)
- Performance optimizations (code splitting, caching, indexing)
- Security architecture (auth flow, RLS, input validation)
- Deployment architecture (local vs production)

---

#### [User Flows](user-flows.md)
How users accomplish key tasks within the CRM.

**Contents:**
- Flow 1: Create New Contact
- Flow 2: View & Edit Contact (Slide-Over Pattern)
- Flow 3: Create Opportunity with Participants
- Flow 4: Move Opportunity Through Pipeline (Kanban)
- Flow 5: Create Task & Mark Complete
- Flow 6: Log Activity (Interaction)
- Flow 7: Import Contacts from CSV
- Common UI patterns (StandardListLayout, PremiumDatagrid, Slide-Overs, Tabbed Forms)
- Implementation notes (JSONB arrays, soft delete, RLS patterns, error handling)

---

#### [Setup & Deployment Guide](setup-and-deployment.md)
Get the project running locally and deploy to production.

**Contents:**
- Prerequisites (Node.js 22, Docker, Git)
- Local development setup (clone, install, environment variables, start Supabase, seed database)
- Quick start (all-in-one script)
- Testing (unit tests, E2E tests with Playwright)
- Database management (migrations, cloud operations)
- Code quality (linting, formatting, type checking, color validation)
- Building for production
- Deployment (Vercel, Netlify, Supabase Edge Functions)
- Continuous deployment (GitHub Actions)
- Rollback procedures
- Troubleshooting common issues

---

## Original Documentation

### Project Configuration

- [CLAUDE.md](../CLAUDE.md) - AI agent guidelines and project constitution (32KB comprehensive guide)
- [README.md](../README.md) - Quick start, feature overview, and commands reference
- [package.json](../package.json) - Dependencies, scripts, and project metadata

### Architecture Deep Dives

- [Design System](architecture/design-system.md) - Colors, spacing, typography, accessibility
- [Component Library](architecture/component-library.md) - UI components and patterns
- [API Design](architecture/api-design.md) - Data provider, validation, error handling
- [Business Rules](architecture/business-rules.md) - Validation schemas, constraints, workflows
- [ERD to UI Mapping](architecture/erd-to-ui-mapping.md) - Database tables mapped to UI components

### Development Guides
- [Testing Guide](guides/02-testing.md) - Testing strategy and workflows
- [Supabase Workflow](guides/05-supabase-workflow.md) - Database migration workflows
- [Common Tasks](development/common-tasks.md) - Step-by-step guides for frequent operations
- [Commands Reference](development/commands-quick-reference.md) - All CLI commands with descriptions
- [Testing Reference](development/testing-quick-reference.md) - Testing commands and patterns
- [Technical Debt Tracker](technical-debt-tracker.md) - Prioritized TODO/FIXME items with effort estimates

### Specialized Topics

- [Security & Testing](SECURITY_README.md) - Security remediation status, RLS policies, CSV validation, WCAG compliance
- [Dashboard V2 Migration](dashboard-v2-migration.md) - Migrating from v1 to v2 dashboard
- [Port Consolidation](development/port-consolidation-guide.md) - Reduced from 28 to 3 exposed ports
- [Playwright MCP Guide](development/playwright-mcp-guide.md) - AI-assisted test generation
- [Color Theming Architecture](internal-docs/color-theming-architecture.docs.md) - Semantic color system details
- [ERD to UI Mapping](architecture/erd-to-ui-mapping.md) - Database tables mapped to UI components

### Planning Documents

- [Plans Directory](plans/) - Feature planning documents, architecture decision records
  - Principal-Centric CRM Design (v2.0) - 30-day Excel replacement goal
  - Dashboard V2 Implementation - 3-column resizable layout
  - Dashboard V3 Implementation (Current) - Production-ready default dashboard
  - Unified Design System Rollout - StandardListLayout, Slide-Overs, Premium Tables
  - Spacing & Layout System - Semantic spacing tokens
  - Tasks Module + Weekly Activity Report

---

## Documentation Principles

These documents reflect **what exists in code today**, not plans or aspirations.

**Verification:**
- All technical claims are verified against actual codebase
- No references to unimplemented features
- Code references point to actual files and line numbers where applicable
- Environment variables match `.env.example`
- npm scripts match `package.json`

**Maintenance:**
- Update documentation when code changes
- Remove outdated information immediately
- Keep examples current with actual code patterns
- Version documentation with releases

**Source of Truth:**
- For database schema: `supabase/migrations/`
- For API patterns: `src/atomic-crm/providers/supabase/`
- For validation: `src/atomic-crm/validation/`
- For UI patterns: `src/atomic-crm/<resource>/` components
- For scripts: `package.json`

---

## Getting Help

**Issue Tracker:** https://github.com/your-org/crispy-crm/issues

**Before Filing an Issue:**
1. Check existing documentation (especially Setup & Deployment Guide troubleshooting section)
2. Search existing issues
3. Verify you're using Node.js 22 and latest dependencies

**Include in Bug Reports:**
- Node.js version (`node --version`)
- npm version (`npm --version`)
- Operating system and version
- Relevant error messages and stack traces
- Steps to reproduce

---

## Contributing to Documentation

**When updating docs:**
1. Verify your changes against the actual codebase
2. Use present tense ("the system does X" not "the system will do X")
3. Provide code references when describing implementation details
4. Keep language concise and avoid jargon where possible
5. Update this README.md if you add/remove/rename documents

**Documentation Standards:**
- Use Markdown format
- Include code blocks with syntax highlighting
- Use tables for structured data
- Include diagrams (Mermaid preferred) for architecture/flows
- Cross-reference related documents
- Keep each document focused on a single topic

---

## License

This project is licensed under the MIT License. See [LICENSE.md](../LICENSE.md) for details.
