# Atomic CRM

A full-featured CRM built with React, shadcn-admin-kit, and Supabase.

https://github.com/user-attachments/assets/0d7554b5-49ef-41c6-bcc9-a76214fc5c99

Atomic CRM is free and open-source. You can test it online at https://marmelab.com/atomic-crm-demo.

## Features

- 📇 **Organize Contacts**: Keep all your contacts in one easily accessible place.
- ⏰ **Create Tasks & Set Reminders**: Never miss a follow-up or deadline.
- 📝 **Take Notes**: Capture important details and insights effortlessly.
- ✉️ **Capture Emails**: CC Atomic CRM to automatically save communications as notes.
- 📊 **Manage Deals**: Visualize and track your sales pipeline in a Kanban board.
- 🔄 **Import & Export Data**: Easily transfer contacts in and out of the system.
- 🔐 **Control Access**: Log in with Google, Azure, Keycloak, and Auth0.
- 📜 **Track Activity History**: View all interactions in aggregated activity logs.
- 🔗 **Integrate via API**: Connect seamlessly with other systems using our API.
- 🛠️ **Customize Everything**: Add custom fields, change the theme, and replace any component to fit your needs.

## Installation

To run this project locally, you will need the following tools installed on your computer:

- Node 22 LTS

Fork the [`marmelab/atomic-crm`](https://github.com/marmelab/atomic-crm) repository to your user/organization, then clone it locally:

```sh
git clone https://github.com/[username]/atomic-crm.git
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

1. [User Management](./doc/user/user-management.md)
2. [Importing And Exporting Data](./doc/user/import-contacts.md)
3. [Inbound Email](./doc/user/inbound-email.md)

## Deploying to Production

1. [Configuring Supabase](./doc/developer/supabase-configuration.md)
2. [Configuring Inbound Email](./doc/developer/inbound-email-configuration.md) *(optional)*
3. [Deployment](./doc/developer/deploy.md)

## Customizing Atomic CRM

To customize Atomic CRM, you will need TypeScript and React programming skills as there is no graphical user interface for customization. Here are some resources to assist you in getting started.

1. [Customizing the CRM](./doc/developer/customizing.md)
2. [Creating Migrations](./doc/developer/migrations.md) *(optional)*
3. [Using Fake Rest Data Provider for Development](./doc/developer/data-providers.md) *(optional)*
4. [Architecture Decisions](./doc/developer/architecture-choices.md) *(optional)*

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
npm run db:local:reset           # Reset local DB and seed test data

# Database migration tools
npm run migrate:production        # Execute production migration
npm run migrate:dry-run          # Preview migration changes
npm run migrate:backup           # Backup before migration
npm run migrate:rollback         # Rollback if needed
npm run migrate:validate         # Validate migration success

# Cache and search management
npm run cache:clear              # Clear application caches
npm run search:reindex           # Reindex search data
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
npm run test:performance # Run performance benchmarks
npm run test:load        # Run load tests
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
npm run supabase:deploy  # Deploy database migrations and functions
npm run prod:start       # Build and start production server locally
npm run prod:deploy      # Deploy to production (GitHub Pages)
```

### Development Utilities
```sh
npm run db:local:reset        # Reset local DB and seed test data
npm run cache:clear           # Clear application caches
npm run search:reindex        # Reindex search data
npm run migrate:production    # Execute production migration
npm run migrate:dry-run       # Preview migration changes
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
- **[Security Hardening](./docs/security/)** - Pre-launch security checklist
- **[Design System](./docs/design-system/)** - UI component guidelines

## Testing

![Coverage](https://img.shields.io/badge/coverage-70%25-yellow)

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
