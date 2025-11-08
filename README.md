# Atomic CRM

A full-featured CRM built with React, shadcn-admin-kit, and Supabase.

https://github.com/user-attachments/assets/0d7554b5-49ef-41c6-bcc9-a76214fc5c99

Atomic CRM is free and open-source. You can test it online at https://marmelab.com/atomic-crm-demo.

## Features

- 📇 **Organize Contacts**: Keep all your contacts in one easily accessible place.
- ⏰ **Create Tasks & Set Reminders**: Never miss a follow-up or deadline.
- 📝 **Take Notes**: Capture important details and insights effortlessly.
- ✉️ **Capture Emails**: CC Atomic CRM to automatically save communications as notes.
- 📊 **Manage Opportunities**: Visualize and track your sales pipeline in a Kanban board.
- 🔄 **Import & Export Data**: Easily transfer contacts in and out of the system.
- 🔐 **Control Access**: Log in with Google, Azure, Keycloak, and Auth0.
- 📜 **Track Activity History**: View all interactions in aggregated activity logs.
- 🔗 **Integrate via API**: Connect seamlessly with other systems using our API.
- 🛠️ **Customize Everything**: Add custom fields, change the theme, and replace any component to fit your needs.

## Installation

To run this project locally, you will need the following tools installed on your computer:

- Node 22 LTS

Clone the repository to your local machine:

```sh
git clone https://github.com/[your-org]/crispy-crm.git
cd crispy-crm
```

Install dependencies:

```sh
cd atomic-crm
npm install
```

This will install the dependencies for the frontend and the backend, including a local Supabase instance.

### Quick Start (5 Minutes)

Start local development with fresh database:

```sh
npm run dev:local
```

This will:
1. Start local Supabase (Docker)
2. Reset and seed the database
3. Start Vite dev server

**Access the app:**
- App: [http://localhost:5173/](http://localhost:5173/)
- Login: `admin@test.com` / `password123`

**Debug services:**
- Supabase Studio: [http://localhost:54323/](http://localhost:54323/)
- REST API: [http://127.0.0.1:54321](http://127.0.0.1:54321)
- Attachments storage: [http://localhost:54323/project/default/storage/buckets/attachments](http://localhost:54323/project/default/storage/buckets/attachments)
- Email testing: [http://localhost:54324/](http://localhost:54324/)

**Full setup guide:** See [Development Setup](./docs/guides/01-development-setup.md)

## User Documentation

See [User Guides](./docs/guides/) for complete documentation.

## Deploying to Production

See [Supabase Workflow Guide](./docs/supabase/WORKFLOW.md) for production deployment instructions.

## Customizing Atomic CRM

To customize Atomic CRM, you will need TypeScript and React programming skills as there is no graphical user interface for customization. Here are some resources to assist you in getting started:

- [Common Tasks](./docs/claude/common-tasks.md) - Step-by-step customization guides
- [Architecture Essentials](./docs/claude/architecture-essentials.md) - Core patterns and design
- [Engineering Constitution](./docs/claude/engineering-constitution.md) - Development principles

## Migration Notes (v0.2.0)

### Deal to Opportunity Migration
The CRM has been enhanced to support more sophisticated sales processes. Key changes include:

- **Renamed Entities**: `deals` are now `opportunities` throughout the system
- **Environment Variables**: All `DEAL_*` variables renamed to `OPPORTUNITY_*`
- **Enhanced Schema**: Opportunities now support multiple participants, activity tracking, and interaction history
- **Many-to-Many Relationships**: Contacts can belong to multiple organizations
- **Backward Compatibility**: Legacy deal endpoints remain functional during transition

### Development Tooling Updates
New development scripts for working with the enhanced schema:

```sh
# Database operations
npm run db:local:start           # Start local Supabase (Docker)
npm run db:local:reset           # Reset local DB and seed test data
npm run db:cloud:push            # Deploy migrations to production

# Cache and search management
npm run cache:clear              # Clear application caches
npm run search:reindex           # Reindex search data
npm run migrate:csv              # Migrate opportunities from CSV
```

Test fixtures have been updated to use the new opportunity schema structure. See `/tests/fixtures/` for examples.

## Available Commands

### Development
```sh
npm run dev              # Start development server (port 5173)
npm run build            # Build for production
npm run preview          # Preview production build locally
```

### Testing
```sh
npm test                 # Run tests in watch mode
npm run test:ci          # Run tests once (for CI)
npm run test:coverage    # Generate coverage report (70% minimum)
npm run test:e2e         # Run Playwright end-to-end tests
```

### Code Quality
```sh
npm run lint             # Check linting and formatting
npm run lint:check       # Check ESLint only
npm run lint:apply       # Auto-fix ESLint issues
npm run prettier:check   # Check Prettier formatting
npm run prettier:apply   # Auto-fix Prettier formatting
npm run validate:colors  # Validate semantic color usage
```

### Database & Deployment
```sh
npm run db:local:start        # Start local Supabase (Docker)
npm run db:local:reset        # Reset local DB and seed test data
npm run db:cloud:push         # Deploy migrations to production
```

### Development Utilities
```sh
npm run cache:clear           # Clear application caches
npm run search:reindex        # Reindex search data
npm run migrate:csv           # Migrate opportunities from CSV
```

## Documentation

### Developer Guides
- **[Development Setup](./docs/guides/01-development-setup.md)** - Complete local development guide
- **[Testing Guide](./docs/guides/02-testing.md)** - Testing strategy and workflows
- **[Supabase Workflow](./docs/guides/05-supabase-workflow.md)** - Database migration workflows

### Reference Documentation
- **[CLAUDE.md](./CLAUDE.md)** - AI agent guidelines and project constitution
- **[Architecture Essentials](./docs/claude/architecture-essentials.md)** - Core patterns
- **[Common Tasks](./docs/claude/common-tasks.md)** - Step-by-step guides
- **[Commands Reference](./docs/claude/commands-quick-reference.md)** - All CLI commands

### Specialized Topics
- **[Database Documentation](./docs/database/)** - Migration business rules
- **[Security & Testing](./docs/SECURITY_README.md)** - ✅ Remediation Complete (Nov 2025) - [Completion Report](./4-PHASE-REMEDIATION-COMPLETION.md)
  - 0 critical vulnerabilities, RLS admin-only policies, CSV validation
  - 95.4% test pass rate (1130/1184), 65 new tests added
  - WCAG 2.1 Level AA accessibility compliance
- **[Design System](./docs/design-system/)** - UI component guidelines

## Testing

![Test Pass Rate](https://img.shields.io/badge/tests-95.4%25%20passing-brightgreen) ![Coverage](https://img.shields.io/badge/coverage-70%25%20min-yellow) ![Accessibility](https://img.shields.io/badge/a11y-WCAG%202.1%20AA-blue)

**Status:** 1130/1184 tests passing (95.4%) | 65 tests added in Nov 2025 remediation

### Quick Start

```bash
# Run tests in watch mode (development)
npm test

# Run tests once with coverage
npm run test:coverage

# 5-minute manual checklist before deployment
# See: docs/guides/02-testing.md
```

**Full testing guide:** See [Testing Documentation](./docs/guides/02-testing.md)

### Test Commands

| Command | Description |
|---------|-------------|
| `npm test` | Run unit/integration tests in watch mode |
| `npm run test:ci` | Run tests once with verbose output (for CI) |
| `npm run test:coverage` | Generate coverage report (70% minimum) |
| `npm run test:e2e` | Run Playwright end-to-end tests |

## License

This project is licensed under the MIT License, courtesy of [Marmelab](https://marmelab.com). See the [LICENSE.md](./LICENSE.md) file for details.
