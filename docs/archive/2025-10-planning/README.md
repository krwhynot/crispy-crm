# Archived Planning Documents - October 2025

**Archived:** 2025-10-31
**Reason:** Planning phase completed, implementation finished
**Status:** Historical reference

---

## What's Archived Here

This folder contains **completed planning and research documents** from October 2025 feature development work. These documents served their purpose during the design and implementation phases and are now preserved for historical reference.

### Archived Planning Sessions

#### 1. Multi-Select Filters Feature (`XX-multi-select-filters/`)
**Status:** ✅ Planning Complete
**Implementation Status:** [Update with actual status]
**Files:** 8 planning documents

**What was planned:**
- Dynamic filter components for contacts, organizations, opportunities
- Multi-select filter UI patterns in React Admin
- Database schema analysis for filterable fields
- Implementation requirements and testing checklist

**Key Decisions:**
- [Document any major architectural decisions made during planning]

**Outcome:**
- [Summarize whether feature was implemented, partially implemented, or deferred]

---

#### 2. Opportunity Redesign (`opportunity-redesign/`)
**Status:** ✅ Planning Complete
**Implementation Status:** [Update with actual status]
**Files:** 11 planning documents

**What was planned:**
- Complete opportunity workflow redesign
- Stage management and automation
- Integration with activities and interactions
- 3-tier distribution model (customer/principal/distributor)

**Key Documents:**
- `DECISION-QUESTIONS.md` - Critical design decisions
- `IMPLEMENTATION-PLAN.md` - Step-by-step execution plan
- `GAPS-RESOLUTION-MATRIX.md` - How identified gaps were addressed
- `CRITICAL-GAPS.md` - Blockers identified and resolved

**Key Decisions:**
- [Document major architectural decisions]
- Pricing removal decision (2025-10-29) - see migration 20251028040008

**Outcome:**
- [Summarize implementation results]

---

## Why Archive Instead of Delete?

We archive planning documents rather than deleting them because:

1. **Historical Context** - Future developers can understand *why* decisions were made
2. **Pattern Reference** - Planning patterns can be reused for future features
3. **Decision Trail** - Architectural decisions are documented with their rationale
4. **Git History** - While git preserves everything, archiving makes it easier to find

---

## How to Use Archived Plans

### If You Need to Reference a Decision

1. **Check this archive first** - Faster than git history
2. **Read DECISION-QUESTIONS.md** - Captures key decision points
3. **Review IMPLEMENTATION-PLAN.md** - See what was actually built

### If Planning a Similar Feature

1. **Copy planning structure** - Reuse the template/process
2. **Adapt research approach** - Similar features likely need similar research
3. **Learn from gaps** - Check GAPS-RESOLUTION-MATRIX.md for pitfalls

### If Feature Needs Iteration

1. **Review original requirements** - What was the original intent?
2. **Check what was deferred** - Were features intentionally left out?
3. **Reference architectural decisions** - Don't break original design principles

---

## Archive Organization

```
docs/archive/
└── 2025-10-planning/
    ├── README.md (this file)
    ├── XX-multi-select-filters/
    │   ├── requirements.md
    │   ├── database-schema.research.md
    │   ├── react-admin-patterns.research.md
    │   ├── dynamic-data.research.md
    │   ├── existing-filters.research.md
    │   ├── testing-checklist.md
    │   ├── parallel-plan.md
    │   └── shared.md
    └── opportunity-redesign/
        ├── requirements.md
        ├── DECISION-QUESTIONS.md
        ├── IMPLEMENTATION-PLAN.md
        ├── GAPS-RESOLUTION-MATRIX.md
        ├── CRITICAL-GAPS.md
        ├── SOLUTIONS-ANALYSIS.md
        ├── ZEN-REVIEW-FIXES.md
        ├── shared.md
        ├── parallel-plan.md
        ├── opportunities-architecture.docs.md
        ├── interactions-activities.docs.md
        └── filtering-react-admin.docs.md
```

---

## Git History

All archived documents are preserved in git history. To find the original context:

```bash
# Find when a file was moved to archive
git log --follow -- docs/archive/2025-10-planning/XX-multi-select-filters/requirements.md

# See the file at a specific commit
git show <commit-hash>:docs/plans/XX-multi-select-filters/requirements.md

# Search for related commits
git log --all --grep="multi-select"
```

---

## Future Archives

When archiving future planning documents:

1. **Create timestamped folder**: `docs/archive/YYYY-MM-description/`
2. **Copy this README template** and update for your content
3. **Move completed plans** with `git mv` to preserve history
4. **Update plan status** in this README
5. **Link to related implementations** (commits, PRs, migrations)

---

## Related Documentation

- **Active Planning:** `docs/plans/` - Current/active planning work
- **Architecture Decisions:** `docs/architecture/adr/` - Formal ADRs
- **Database Changes:** `supabase/migrations/` - Schema evolution
- **Implementation:** `src/atomic-crm/` - Actual feature code

---

## Questions?

If you need to understand:
- **What was decided:** Read DECISION-QUESTIONS.md in each archive
- **How it was built:** Check IMPLEMENTATION-PLAN.md
- **Why it was built this way:** Review architectural context in shared.md
- **What problems arose:** See GAPS-RESOLUTION-MATRIX.md

For current planning approaches, see `docs/plans/README.md`.
