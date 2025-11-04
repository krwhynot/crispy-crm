# ADR-0001: Use Supabase for Backend Platform

**Date:** 2025-11-02
**Status:** Accepted
**Deciders:** Product Design & Engineering Team

---

## Context

Crispy-CRM requires a backend platform to:
- Store CRM data (organizations, contacts, opportunities, activities, products, users)
- Provide authentication and authorization (email/password, OAuth, JWT tokens)
- Expose APIs for frontend data fetching and mutations
- Handle real-time updates (future requirement for activity feeds and pipeline changes)
- Support role-based access control (Admin, Sales Manager, Sales Rep, Read-Only)

**Constraints:**
- **Timeline:** 20-week MVP timeline with limited backend engineering resources
- **Team:** Frontend-focused team, minimal experience with backend infrastructure
- **Budget:** Bootstrapped MVP, need cost-effective solution with generous free tier
- **Database:** Requirement for PostgreSQL (strong consistency, complex queries, relational data)
- **Security:** Must support Row Level Security (RLS) for multi-user data isolation

**Requirements from PRD:**
- RESTful or GraphQL APIs (Section 5.2)
- JWT authentication with refresh tokens (Section 5.1)
- Role-based permissions (Section 3.1)
- PostgreSQL database (Section 5.1)
- Real-time capabilities (future, Section 5.2)

## Decision

**Use Supabase as the backend platform for Crispy-CRM MVP.**

Supabase provides PostgreSQL database, auto-generated REST APIs, built-in authentication (email, OAuth, JWT), Row Level Security policies, and real-time subscriptions in a fully managed service.

## Options Considered

### Option 1: Supabase (PostgreSQL + Auth + APIs)
**Pros:**
- **Auto-generated REST APIs** from database schema (no API coding required)
- **Built-in authentication** (email/password, Google OAuth, Microsoft OAuth) with JWT tokens
- **Row Level Security (RLS)** policies for data isolation (Sales Rep sees only owned opportunities)
- **PostgreSQL** (meets PRD requirement, strong consistency, complex queries, JSON support)
- **Real-time subscriptions** available for future features (activity feeds, pipeline updates)
- **Generous free tier** (500MB database, 2GB bandwidth, 50,000 monthly active users)
- **TypeScript client** with excellent type inference
- **Fast development** - schema changes automatically update APIs
- **Managed service** - no server maintenance, automatic backups, scaling handled

**Cons:**
- **Vendor lock-in** (migration to self-hosted or different platform requires effort)
- **RLS learning curve** (team unfamiliar with PostgreSQL RLS policies)
- **API flexibility limited** to PostgREST patterns (horizontal filtering, embedding, ordering)
- **Custom business logic** requires PostgreSQL functions or Edge Functions (additional complexity)
- **Query optimization** responsibility on team (no automatic query plan optimization)

### Option 2: Custom Node.js + Express + Prisma Backend
**Pros:**
- **Full control** over API design, endpoints, business logic
- **Flexible** - can implement any custom workflow or validation
- **No vendor lock-in** - can host anywhere (AWS, Vercel, DigitalOcean)
- **Prisma ORM** provides type-safe database access
- **Custom authentication** logic possible (MFA, custom flows)

**Cons:**
- **Significant development time** (3-4 weeks to build auth + CRUD APIs + permissions)
- **Infrastructure management** required (hosting, CI/CD, monitoring, backups)
- **Security responsibility** (secure auth implementation, SQL injection prevention, rate limiting)
- **Team capacity** - requires backend engineer or significant learning curve
- **Slower iteration** - schema changes require API code updates
- **Cost** - hosting + database + monitoring services
- **20-week MVP timeline at risk** with custom backend development

### Option 3: Firebase (Firestore + Auth)
**Pros:**
- **Fast setup** - auth and database in minutes
- **Real-time by default** (document subscriptions)
- **Generous free tier** (1GB storage, 50K reads/day)
- **Google OAuth integration** seamless
- **Managed service** - no server maintenance

**Cons:**
- **Not PostgreSQL** - Firestore is NoSQL document database (PRD requires PostgreSQL)
- **No complex queries** - Firestore lacks JOINs, aggregations, full-text search
- **No native RLS** - security rules more limited than PostgreSQL RLS
- **Cost scaling** - reads/writes pricing can escalate quickly
- **Migration complexity** - switching from Firestore to relational DB later is painful
- **Does not meet PRD database requirement** (Section 5.1 specifies PostgreSQL)

### Option 4: Hasura (GraphQL Layer Over PostgreSQL)
**Pros:**
- **PostgreSQL support** (meets PRD requirement)
- **Auto-generated GraphQL APIs** from schema
- **RLS-like permissions** via Hasura permission rules
- **Real-time subscriptions** (GraphQL subscriptions)
- **Flexible** - can add custom resolvers

**Cons:**
- **GraphQL complexity** - team unfamiliar with GraphQL, steeper learning curve than REST
- **Hasura permission system** separate from PostgreSQL RLS (duplicate logic)
- **Self-hosting complexity** (Hasura engine requires deployment) or Cloud cost ($99/mo for managed)
- **PRD assumes REST APIs** (Section 5.2 shows RESTful endpoints, not GraphQL)
- **Overkill for MVP** - GraphQL benefits (selective field fetching) not critical yet

## Consequences

### Positive Consequences

**Development Speed:**
- **Reduce API development time by ~80%** - auto-generated REST APIs eliminate 3-4 weeks of backend work
- **Schema-driven development** - database changes automatically update APIs (faster iteration)
- **Built-in auth saves 1-2 weeks** - no need to implement JWT refresh logic, password reset, OAuth flows

**Security:**
- **RLS policies enforce data isolation** at database level (Sales Reps can't access other reps' data even if API bypassed)
- **Battle-tested auth** - Supabase auth handles edge cases (token rotation, concurrent logins, session management)
- **Automatic SQL injection prevention** via PostgREST (parameterized queries)

**Scalability:**
- **PostgreSQL connection pooling** handled by Supabase (pg_bouncer)
- **Automatic backups** - daily backups, point-in-time recovery available
- **Horizontal scaling** available on paid plans if needed

**Team Efficiency:**
- **TypeScript client** generates types from database schema (reduces API integration bugs)
- **No backend deployment** - one fewer service to manage, monitor, debug
- **Free tier supports MVP** - 500MB database sufficient for initial customers

### Negative Consequences

**Vendor Lock-In:**
- **Migration effort** if switching away from Supabase (must rebuild APIs, auth, migrate data)
- **Pricing risk** - if Supabase changes pricing or discontinues service, migration required
- **Mitigation:** Supabase is open-source (can self-host if needed), PostgreSQL data portable

**Learning Curve:**
- **RLS policies** unfamiliar to team - requires PostgreSQL knowledge, debugging RLS can be tricky
- **PostgREST query patterns** different from traditional REST (horizontal filtering, embedding)
- **Mitigation:** Good documentation, RLS examples in Supabase docs, team will gain PostgreSQL skills

**API Flexibility:**
- **Limited to PostgREST patterns** - complex business logic requires PostgreSQL functions or Edge Functions
- **No middleware** for request/response transformation (would need Edge Functions)
- **Mitigation:** For MVP, CRUD + filtering sufficient; can add Edge Functions for custom logic later

**Performance Considerations:**
- **Query optimization** responsibility on team - no automatic query plan analysis
- **N+1 queries possible** if not using PostgREST embedding correctly
- **Mitigation:** Learn PostgREST embedding patterns, add database indexes, monitor slow queries

### Neutral Consequences

- **Edge Functions for custom logic** - Requires learning Deno/Edge runtime if advanced workflows needed
- **Real-time feature opt-in** - Subscriptions available but not required for MVP
- **Supabase Studio UI** - Helpful for database management but not required (can use SQL directly)

## Implementation Notes

**Migration Path:**
1. Create Supabase project (free tier)
2. Define database schema via migrations (`supabase/migrations/`)
3. Write RLS policies per table (see ADR-0005 for soft delete strategy)
4. Configure authentication providers (email, Google OAuth per PRD Section 3.1)
5. Generate TypeScript types: `npx supabase gen types typescript`
6. Install Supabase client: `npm install @supabase/supabase-js`

**RLS Policy Examples:**
- Organizations: Sales Reps can view all, edit only assigned (`primary_account_manager_id = auth.uid()`)
- Opportunities: Sales Reps can view all, edit only owned (`deal_owner_id = auth.uid()`)
- Activities: Visible based on related entity access (opportunity/organization)

**Future Considerations:**
- **Edge Functions** for custom workflows (volume calculations, email notifications)
- **Real-time subscriptions** for activity feed (Phase 2+)
- **Self-hosting option** if vendor lock-in becomes concern (Supabase is open-source)

## References

- **PRD Section 5.1:** Technology Stack - Backend requirements
- **PRD Section 5.2:** API Endpoints - RESTful API design
- **PRD Section 3.1:** User Roles & Permissions - RLS requirements
- **Supabase Documentation:** https://supabase.com/docs
- **PostgREST API Patterns:** https://postgrest.org/en/stable/
- **RLS Policy Examples:** https://supabase.com/docs/guides/auth/row-level-security
- **Related ADR:** ADR-0004 (JWT Authentication Strategy)
- **Related ADR:** ADR-0005 (Soft Delete Strategy - impacts RLS policies)

---

## Supersedes

None (initial decision)

## Superseded By

None (current)
