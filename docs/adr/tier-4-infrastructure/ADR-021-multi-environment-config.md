# ADR-021: Multi-Environment Configuration Strategy

## Status

**Accepted**

## Date

Original: 2024-10 | Documented: 2025-12-30

## Deciders

- krwhynot

---

## Context

Crispy CRM requires different configurations across development, staging, and testing environments. Each environment has distinct requirements:

1. **Local Development**: Uses Docker-hosted Supabase (`supabase start`) for offline development with seed data and full admin access via service role key.

2. **Cloud/Staging**: Uses Supabase Cloud for shared testing with real data, requires production-like security (anon key only).

3. **Unit Tests**: Uses mocked Supabase client with no network calls, controlled by Vitest environment variables.

### Key Challenges

- **Secret Protection**: Service role key grants full database access, bypassing RLS. It must NEVER reach production builds or version control.
- **Feature Flags**: Architecture experiments (like `VITE_USE_COMPOSED_PROVIDER`) need consistent propagation across environments.
- **Developer Experience**: Switching environments should be frictionless (copy file, restart server).

### Alternatives Considered

| Alternative | Pros | Cons |
|------------|------|------|
| **Single `.env` with comments** | Simple, one file | Easy to accidentally commit secrets, manual editing error-prone |
| **Runtime environment detection** | No file switching | Complex logic, harder to debug, secrets still exposed |
| **Build-time injection only** | Secrets never in files | Poor DX, requires CI for every config change |
| **Separate environment files** | Clear separation, easy switching, template-based | Multiple files to maintain |

---

## Decision

**Use separate environment files with a template-based approach:**

```
.env.example     # Template with placeholders (committed)
.env.local       # Local Supabase Docker (gitignored)
.env.cloud       # Supabase Cloud staging (gitignored)
.env.test        # E2E testing config (gitignored)
.env             # Active config (copy of one above, gitignored)
```

### Environment Variable Naming Convention

```bash
# .env.local:1-22

# Client-exposed variables (bundled into app)
VITE_SUPABASE_URL=http://127.0.0.1:54321
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Feature flags (client-exposed)
VITE_USE_COMPOSED_PROVIDER=true

# Server-only variables (scripts, migrations - NEVER in client)
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:54322/postgres
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Naming Rules:**
- `VITE_*` prefix = exposed to client bundle (safe to commit if not secret)
- No prefix = server-side only (scripts, migrations, seed commands)

### URL Patterns by Environment

| Environment | Supabase URL | Database Port |
|------------|--------------|---------------|
| **Local** | `http://127.0.0.1:54321` | 54322 |
| **Cloud** | `https://{project}.supabase.co` | 5432 (pooler) |
| **Test** | `https://test.supabase.co` | N/A (mocked) |

### Service Role Key Protection

```bash
# .env.local:16-18 (LOCAL ONLY)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# .env.cloud - NO service role key
# Production uses Supabase Dashboard or GitHub Secrets for migrations
```

**Critical Security Rule:** Service role key ONLY exists in `.env.local`. Cloud environments use:
- Supabase Dashboard for manual operations
- GitHub Actions secrets for automated migrations
- Supabase CLI `--db-url` flag with connection string

### Feature Flag Propagation

```typescript
// vite.config.ts:142-151

define:
  process.env.NODE_ENV === "production"
    ? {
        "import.meta.env.VITE_IS_DEMO": JSON.stringify(process.env.VITE_IS_DEMO),
        "import.meta.env.VITE_SUPABASE_URL": JSON.stringify(process.env.VITE_SUPABASE_URL),
        "import.meta.env.VITE_SUPABASE_ANON_KEY": JSON.stringify(
          process.env.VITE_SUPABASE_ANON_KEY
        ),
      }
    : undefined,
```

In production builds, Vite injects environment variables at build time. In development, `import.meta.env` reads from `.env` files directly.

### Test Environment Configuration

```typescript
// vitest.config.ts:10-18

env: {
  // Unit tests use hardcoded test values (no .env file)
  VITE_SUPABASE_URL: "https://test.supabase.co",
  VITE_SUPABASE_ANON_KEY: "test-anon-key",
  OPPORTUNITY_DEFAULT_STAGE: "new_lead",
  OPPORTUNITY_PIPELINE_STAGES:
    "new_lead,initial_outreach,sample_visit_offered,feedback_logged,demo_scheduled,closed_won,closed_lost",
},
```

Unit tests bypass `.env` files entirely. Integration tests in `tests/integration/` use `.env.test` for E2E scenarios.

---

## Consequences

### Positive

- **Clear Separation**: Each environment's config is isolated, reducing accidental cross-contamination
- **Secret Protection**: Service role key only in local file, never in cloud/production configs
- **Developer Onboarding**: Copy template, fill values, start developing
- **Feature Flags Work Everywhere**: `VITE_USE_COMPOSED_PROVIDER` propagates consistently
- **Test Isolation**: Unit tests use Vitest env, not file-based config

### Negative

- **Multiple Files**: Four `.env*` files to maintain (but only `.env.example` is committed)
- **Sync Discipline**: Adding new variables requires updating all files and template
- **Gitignore Dependency**: Security relies on proper `.gitignore` configuration

### Neutral

- **Standard Vite Pattern**: Follows Vite's established environment variable conventions
- **Template Evolution**: `.env.example` serves as documentation for required variables

---

## Code Examples

### Correct Pattern - Environment Switching

```bash
# Switch to local development
cp .env.local .env
npm run db:local:start
npm run dev

# Switch to cloud staging
cp .env.cloud .env
npm run dev

# Run with test configuration
npm test  # Uses vitest.config.ts env, not .env files
```

### Correct Pattern - Adding New Variable

```bash
# 1. Add to .env.example (committed)
VITE_NEW_FEATURE_FLAG=false

# 2. Add to .env.local and .env.cloud (gitignored)
VITE_NEW_FEATURE_FLAG=true

# 3. Access in code
const isEnabled = import.meta.env.VITE_NEW_FEATURE_FLAG === 'true';
```

### Anti-Pattern (NEVER DO THIS)

```bash
# WRONG: Service role key in cloud config
# .env.cloud
SUPABASE_SERVICE_ROLE_KEY=...  # NEVER - bypasses RLS in production

# WRONG: Hardcoding environment in source
const supabaseUrl = "http://127.0.0.1:54321";  # NEVER - use import.meta.env

# WRONG: Committing .env files
git add .env.local  # NEVER - contains secrets
```

```typescript
// WRONG: Accessing non-VITE prefixed vars in client
const dbUrl = process.env.DATABASE_URL;  // NEVER - not available in browser

// CORRECT: Only VITE_ prefixed vars in client code
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
```

---

## Related ADRs

- **[ADR-001: Unified Data Provider Entry Point](../tier-1-foundations/ADR-001-unified-data-provider.md)** - Uses environment-configured Supabase client
- **[ADR-022: Content Security Policy Configuration](./ADR-022-csp-security-headers.md)** - CSP differs by environment (dev vs production)
- **[ADR-030: Vitest Configuration](./ADR-030-vitest-esm-workaround.md)** - Test environment uses Vitest env config

---

## References

- Template: `.env.example`
- Local config: `.env.local`
- Cloud config: `.env.cloud`
- Test config: `vitest.config.ts:10-18`
- Build injection: `vite.config.ts:142-151`
- Vite Environment Variables: https://vitejs.dev/guide/env-and-mode.html
