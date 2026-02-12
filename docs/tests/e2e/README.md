# Manual E2E Testing with Claude Chrome

This directory contains manual E2E testing documentation for Crispy CRM, designed for use with Claude Chrome browser automation.

## Overview

Manual E2E testing allows comprehensive verification of user workflows and features through browser automation with Claude Chrome. Unlike automated Playwright tests, manual E2E tests provide flexible, guided testing sessions that can adapt to real-time observations and discoveries.

## Test Categories

The E2E test suite is organized into the following categories:

### Dashboard V3
- **Smoke Tests** - Basic functionality verification
- **Pipeline Drilldown** - Pipeline stage navigation and data integrity
- **Assigned to Me Filter** - User-specific task filtering
- **Task Snooze** - Task postponement and scheduling
- **Quick Logger** - Rapid activity logging
- **Log Activity FAB** - Floating action button activity creation
- **Data Flow** - End-to-end data synchronization
- **Responsive Layout** - Multi-viewport rendering
- **Accessibility** - A11y compliance for dashboard features

### Organizations
- **Parent Relationship Display** - Organization hierarchy visualization

### Design System
- **Theme Switching** - Light/dark mode transitions
- **Design System Coverage** - Component library verification
- **Design System Smoke** - Core design system functionality
- **Spacing Tokens** - Layout consistency checks
- **Reports Spacing** - Report layout verification

### Accessibility
- **Skip Link** - Keyboard navigation accessibility

### Opportunities
- **Kanban Enhancements** - Deal pipeline board functionality

### Smoke Tests
- **Simple Smoke Test** - Critical path verification

## Testing Approach

Manual E2E testing with Claude Chrome follows these principles:

1. **Guided Workflows** - Step-by-step instructions for feature verification
2. **Visual Verification** - Screenshot-based validation of UI states
3. **Role-Based Testing** - Tests executed as admin, manager, or rep users
4. **Data-Driven** - Tests use seeded test data for consistency
5. **Context-Aware** - Tests adapt based on observed application state

## Environment Configuration

Manual E2E tests can be executed against two environments:

### Local Environment
- **URL**: `http://127.0.0.1:5173` (or `http://localhost:5173`)
- **Use for**: Full testing including destructive operations (create, update, delete)
- **Data**: Seeded test data via `scripts/seed-e2e-dashboard-v3.sh`

### Production Environment
- **URL**: `https://crm.kjrcloud.com`
- **Use for**: Smoke tests and read-only verification
- **Data**: Live production data (handle with care)

### Telling Claude Chrome Which Environment to Use

When initiating a manual E2E test session, specify the target environment:

**For Local Testing:**
```
Run the [test name] test against the local environment (http://127.0.0.1:5173)
```

**For Production Testing:**
```
Run the [test name] test against production (https://crm.kjrcloud.com) - read-only mode
```

### Production Testing Guidelines

When testing against production:
- **DO**: Run smoke tests, verify UI rendering, check navigation
- **DO**: Test read-only workflows (viewing lists, filtering, searching)
- **DO NOT**: Create, update, or delete any records
- **DO NOT**: Run data seeding scripts
- **DO NOT**: Test destructive operations (archive, delete, bulk operations)

See [SETUP.md](./SETUP.md) for environment-specific setup instructions.

## Getting Started

Before running manual E2E tests:

1. Review [SETUP.md](./SETUP.md) for environment configuration
2. Seed test data using `scripts/seed-e2e-dashboard-v3.sh`
3. Ensure local development server is running at `http://127.0.0.1:5173`
4. Ensure Supabase local instance is running

## Test Data

Test data is seeded using scripts located at:
- `scripts/seed-e2e-dashboard-v3.sh` - Primary dashboard test data

These scripts populate the database with realistic data for testing workflows end-to-end.

## User Roles

Manual E2E tests support three user roles:

- **Admin** (`admin@test.com`) - Full system access
- **Manager** (`manager@mfbroker.com`) - Team oversight and reporting
- **Rep** (`rep@mfbroker.com`) - Individual contributor access

See [SETUP.md](./SETUP.md) for complete credential details.

## Test Execution

Manual E2E tests are executed interactively with Claude Chrome:

1. Specify the test category and workflow to execute
2. Claude Chrome navigates the application following test instructions
3. Visual verification is performed through screenshots
4. Results are reported with evidence (screenshots, console logs, network activity)
5. Issues are documented with reproduction steps

## Related Documentation

No automated Playwright suite exists yet. This directory contains manual E2E testing documentation only.

## Contributing

When adding new manual E2E test documentation:

1. Create category-specific markdown files in this directory
2. Use descriptive step-by-step instructions
3. Include expected outcomes and visual verification points
4. Reference relevant seed data and user roles
5. Update this README with links to new test categories
