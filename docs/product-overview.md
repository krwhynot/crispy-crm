# Atomic CRM Product Overview

## What Is Atomic CRM?

Atomic CRM is a full-featured customer relationship management system built for sales teams. It provides tools to manage contacts, track opportunities through a sales pipeline, schedule tasks, log activities, and maintain relationships with customers and principals.

The system is built with React 19, TypeScript, and Supabase, providing a modern, type-safe CRM that can be self-hosted or deployed to the cloud.

## Primary Users

- **Sales Representatives** - Front-line users who manage contacts, create opportunities, and track daily tasks
- **Sales Directors** - Team leads who need visibility into pipeline status and team performance
- **Account Managers** - Users who manage relationships with customers and principals

## Core Capabilities

The CRM provides the following features:

- **Contact Management** - Store and organize contacts with support for multiple email addresses, phone numbers, and organization relationships
- **Organization Tracking** - Manage customer, principal, distributor, and prospect organizations with hierarchical relationships
- **Opportunity Pipeline** - Visual Kanban board to track opportunities through customizable stages (new_lead → initial_outreach → demo_scheduled → closed_won/lost)
- **Task Management** - Create and track tasks with due dates, reminders, priorities (low/medium/high/critical), and types (Call, Email, Meeting, Follow-up, etc.)
- **Activity Logging** - Record interactions (calls, emails, meetings, demos) with automatic activity history
- **Product Catalog** - Maintain a product/service catalog with categories, pricing models, and distributor authorizations
- **Reporting Dashboard** - Multiple dashboard views including Principal Dashboard V3 (default), with pipeline metrics and task widgets
- **Data Import/Export** - CSV import for bulk contact/opportunity creation, CSV export for reports
- **User Management** - Role-based access control with admin, sales_director, and account_manager roles

## In Scope (Currently Implemented)

Based on the actual codebase (v0.1.0), the following features are implemented and functional:

- Complete CRUD operations for Contacts, Organizations, Opportunities, Products, Tasks, Sales Users
- React Admin-based UI with list views, slide-over panels for viewing/editing
- Supabase authentication with email/password and social providers (Google, Azure, Keycloak, Auth0 support)
- PostgreSQL database with Row Level Security (RLS) for multi-tenant access control
- Zod-based form validation with TypeScript type safety
- Lazy-loaded routes and code splitting for performance
- Responsive design with Tailwind CSS v4 and semantic design system
- WCAG 2.1 Level AA accessibility compliance
- Comprehensive test suite (95.4% pass rate: 1130/1184 tests passing)
- E2E testing with Playwright
- Local Docker development with Supabase CLI
- Cloud deployment to Supabase Cloud

## Explicitly Out of Scope

The following features are NOT included in the current version:

- **Email Integration** - No built-in email client or automatic email capture
- **Calendar Integration** - No direct integration with Google Calendar, Outlook, etc.
- **Mobile Apps** - Web-only (responsive design works on mobile browsers, but no native apps)
- **Telephony Integration** - No click-to-call or call logging from phone systems
- **Advanced Reporting** - Basic reports only; no customizable report builder
- **Marketing Automation** - No email campaigns, drip sequences, or marketing tools
- **Inventory Management** - Product catalog only (no stock levels, warehousing, fulfillment)
- **Financial/Invoicing** - No quote generation, invoicing, or payment processing
- **Multi-language Support** - English only

## Success Metrics

Based on the codebase structure and testing requirements, success is measured by:

- **Code Quality** - 70% minimum test coverage maintained (currently at 72%)
- **Test Pass Rate** - 95%+ test pass rate (currently 95.4%)
- **Accessibility** - WCAG 2.1 Level AA compliance verified via automated audits
- **Performance** - Code splitting keeps initial bundle under 100KB gzipped
- **Type Safety** - Zero TypeScript compilation errors
- **Security** - Row Level Security (RLS) policies on all database tables
- **User Adoption** - (To be defined by implementation team based on usage metrics)

## Technology Choices

The project uses modern, open-source technologies:

- **Frontend**: React 19, TypeScript, Vite (fast build tool), React Admin 5.10
- **Backend**: Supabase (PostgreSQL database, authentication, Edge Functions)
- **UI Framework**: Tailwind CSS v4 with Radix UI primitives
- **Validation**: Zod schemas for runtime type checking
- **Testing**: Vitest (unit/integration), Playwright (E2E)
- **Deployment**: Docker (local), Supabase Cloud (production)

All dependencies are listed in `package.json` and use specific versions for reproducibility.
