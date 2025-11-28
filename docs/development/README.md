# Development Documentation

## Overview

This directory contains guides for developers working on Crispy-CRM (Atomic CRM).

**PRD Reference:** See `../PRD.md` v1.18 for complete business requirements, terminology, and 61 MVP features.

## Quick Start Guides

- **`commands-quick-reference.md`** - All CLI commands with examples
- **`common-tasks.md`** - Step-by-step guides for frequent tasks
- **`testing-quick-reference.md`** - Testing patterns and best practices

## Development Workflow

1. **Setup:** See `../guides/01-development-setup.md`
2. **Database:** See `../supabase/WORKFLOW.md`
3. **Testing:** See `testing-quick-reference.md`
4. **Common Tasks:** See `common-tasks.md`

## Quick Commands

```bash
# Development
npm run dev                    # Start dev server
npm test                       # Run tests (watch mode)
npm run lint:apply             # Auto-fix linting

# Database
npm run db:local:start         # Start local Supabase
npm run db:local:reset         # Reset & seed database
npx supabase migration new <name>  # Create migration

# Production
npm run build                  # Build for production
npm run db:cloud:push          # Deploy migrations
```

See `commands-quick-reference.md` for complete command list.
