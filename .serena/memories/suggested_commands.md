# Suggested Commands

## Development
```bash
npm run dev                # Dev server (uses cloud DB from .env)
npm run dev:local          # Reset local DB + seed + dev server
npm run dev:cloud          # Force cloud environment
npm run build              # Production build (includes typecheck)
npm run preview            # Preview production build
```

## Testing
```bash
npm test                   # Vitest watch mode
npm run test:ci            # CI mode (single run, verbose)
npm run test:coverage      # Coverage report (70% minimum)
npm run test:e2e           # Playwright E2E tests
npm run test:e2e:ui        # Playwright interactive mode
npm run test:e2e:headed    # E2E with visible browser
```

## Code Quality
```bash
npm run lint:apply         # ESLint auto-fix
npm run lint:check         # ESLint check only
npm run prettier:apply     # Format all files
npm run prettier:check     # Check formatting
npm run validate:colors    # Check semantic color compliance
npm run typecheck          # TypeScript type checking
```

## Database (Supabase)
```bash
# Local Development
npm run db:local:start     # Start local Supabase
npm run db:local:stop      # Stop local Supabase
npm run db:local:reset     # Reset local DB with seed data
npm run db:local:status    # Check container status

# Cloud Operations (⚠️ BE CAREFUL)
npm run db:cloud:push:dry-run  # Validate before deploy
npm run db:cloud:push          # Deploy to production
npm run db:cloud:status        # Migration history
npm run db:cloud:diff          # Show pending changes
npm run db:link                # Link to cloud project

# Migrations
npx supabase migration new <name>  # Create new migration
```

## ⚠️ DANGEROUS - NEVER RUN
```bash
npx supabase db reset --linked  # Deletes all cloud data!
```

## Storybook
```bash
npm run storybook          # Dev server on port 6006
npm run build-storybook    # Production build
npm run chromatic          # Visual regression tests
```

## Utilities
```bash
npm run gen:types          # Generate Supabase types
npm run cache:clear        # Clear application caches
npm run search:reindex     # Reindex search data
```
