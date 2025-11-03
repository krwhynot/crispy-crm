# Architecture Decision Records (ADRs)

This directory contains Architecture Decision Records documenting significant architectural and technical decisions made for the Crispy-CRM project.

## What are ADRs?

ADRs are concise, version-controlled documents that capture:
- **Context:** Why was this decision needed?
- **Decision:** What did we choose?
- **Options Considered:** What alternatives were evaluated?
- **Consequences:** What are the tradeoffs (good and bad)?

ADRs are **immutable** once accepted. If a decision changes, create a new ADR that supersedes the old one.

## Current ADRs

| Number | Title | Status | Date | Decision |
|--------|-------|--------|------|----------|
| [0001](0001-use-supabase-for-backend-platform.md) | Use Supabase for Backend Platform | ✅ Accepted | 2025-11-02 | Use Supabase (PostgreSQL + Auth + APIs) over custom backend, Firebase, or Hasura |
| [0002](0002-use-react-query-for-server-state.md) | Use React Query for Server State | ✅ Accepted | 2025-11-02 | Use TanStack Query (React Query) over SWR, Apollo Client, or RTK Query |
| 0003 | Use Zustand Over Redux | 🚧 In Progress | 2025-11-02 | (In progress) |
| 0004 | Use JWT Authentication | 📝 Planned | 2025-11-02 | (Planned) |
| 0005 | Soft Delete Strategy | 📝 Planned | 2025-11-02 | (Planned) |

## ADR Lifecycle

```
Proposed → Accepted → [Deprecated OR Superseded]
```

- **Proposed:** Under discussion, not yet implemented
- **Accepted:** Decision finalized, implementation in progress or complete
- **Deprecated:** No longer recommended but not replaced
- **Superseded:** Replaced by a newer ADR

## Creating New ADRs

1. Copy `TEMPLATE.md`
2. Number sequentially (e.g., `0006-decision-title.md`)
3. Fill in all sections (Context, Decision, Options, Consequences)
4. Get team review before marking "Accepted"
5. Link related ADRs in References section

## Key Architectural Decisions

### Backend & Data Layer
- **ADR-0001:** Supabase provides PostgreSQL, auto-generated REST APIs, built-in auth, RLS policies
  - Impact: Saves 3-4 weeks of backend development, enables rapid iteration
  - Tradeoff: Vendor lock-in, RLS learning curve

### Frontend State Management
- **ADR-0002:** React Query manages all server state (data fetching, caching, synchronization)
  - Impact: 80% reduction in data fetching boilerplate, automatic cache management
  - Tradeoff: 15KB bundle size, learning curve for query keys and cache invalidation

- **ADR-0003:** Zustand manages client state (UI state, filters, modal state) - *In Progress*
  - Impact: TBD
  - Tradeoff: TBD

### Security & Authentication
- **ADR-0004:** JWT with refresh tokens for authentication - *Planned*
  - Impact: TBD
  - Tradeoff: TBD

### Data Management
- **ADR-0005:** Soft delete for all core entities - *Planned*
  - Impact: TBD
  - Tradeoff: TBD

## Reading Recommendations

**New team members:**
1. Read ADR-0001 (Supabase) - understand backend architecture
2. Read ADR-0002 (React Query) - understand data fetching patterns
3. Read ADR-0003 (Zustand) - understand client state management

**Before making major technical changes:**
1. Check if an ADR exists for that decision
2. If changing existing decision, create new ADR that supersedes old one
3. Document why previous decision no longer applies

## References

- **ADR Best Practices:** https://adr.github.io
- **Michael Nygard's ADR Format:** https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions
- **Crispy-CRM PRD:** `docs/PRD.md` (product requirements)
- **Artifact Gap Analysis:** `docs/ARTIFACT_GAP_ANALYSIS.md` (documentation completeness review)

---

**Last Updated:** 2025-11-02
**Status:** 2/5 ADRs complete (Day 1 in progress)
