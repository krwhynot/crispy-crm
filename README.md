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

Once you app is configured, start the app locally with the following command:

```sh
npm run dev
```

This will start the Vite dev server for the frontend and the local Supabase instance for the API.

You can then access the app via [http://localhost:5173/](http://localhost:5173/). You will be prompted to create the first user.

If you need debug the backend, you can access the following services: 

- Supabase dashboard: [http://localhost:54323/](http://localhost:54323/)
- REST API: [http://127.0.0.1:54321](http://127.0.0.1:54321)
- Attachments storage: [http://localhost:54323/project/default/storage/buckets/attachments](http://localhost:54323/project/default/storage/buckets/attachments)
- Inbucket email testing service: [http://localhost:54324/](http://localhost:54324/)

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
# Generate seed data for development
npm run seed:data                # Insert test data
npm run seed:data:dry-run        # Preview without inserting
npm run seed:data:clean          # Clean and regenerate

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
npm run seed:data             # Insert test data
npm run seed:data:dry-run     # Preview test data
npm run cache:clear           # Clear application caches
npm run search:reindex        # Reindex search data
npm run migrate:production    # Execute production migration
npm run migrate:dry-run       # Preview migration changes
```

## Testing

![Coverage](https://img.shields.io/badge/coverage-70%25-yellow)

Atomic CRM uses a comprehensive testing strategy with unit, integration, and end-to-end tests. See our [Testing Documentation](./.docs/testing/TESTING.md) for complete details.

### Quick Start

```bash
# Run tests in watch mode (development)
npm test

# Run tests once with coverage
npm run test:coverage

# Run tests in CI mode (no watch)
npm run test:ci

# Run end-to-end tests
npm run test:e2e

# Launch Vitest UI for visual exploration
npm run test:ui
```

### Test Commands

| Command | Description |
|---------|-------------|
| `npm test` | Run unit/integration tests in watch mode |
| `npm run test:ci` | Run tests once with verbose output (for CI) |
| `npm run test:coverage` | Generate coverage report |
| `npm run test:unit` | Run only unit tests |
| `npm run test:e2e` | Run Playwright end-to-end tests |
| `npm run test:e2e:ui` | Launch Playwright UI mode |
| `npm run test:performance` | Run performance benchmarks |
| `npm run test:load` | Run load tests |

### Coverage Requirements

We maintain a baseline coverage of **70%** across all metrics (statements, branches, functions, lines). Coverage reports are generated in the `coverage/` directory.

### Documentation

- [Testing Overview](./.docs/testing/TESTING.md) - Complete testing strategy and setup
- [Writing Tests Guide](./.docs/testing/WRITING_TESTS.md) - Patterns, examples, and best practices
- [Flaky Test Policy](./.docs/testing/FLAKY_TEST_POLICY.md) - Handling unreliable tests

### Adding Tests

You can add tests anywhere in the `src` directory:
- Unit tests: `*.test.ts` or `*.test.tsx` files
- Integration tests: `src/tests/integration/`
- E2E tests: `tests/e2e/`

Tests should follow our [testing patterns](./.docs/testing/WRITING_TESTS.md) and use semantic selectors (getByRole > data-testid > avoid CSS/text).

## License

This project is licensed under the MIT License, courtesy of [Marmelab](https://marmelab.com). See the [LICENSE.md](./LICENSE.md) file for details.
