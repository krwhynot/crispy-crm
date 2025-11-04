# Plans Folder Cleanup Recommendation

**Date:** 2025-11-04
**Current State:** 16 files (404KB)
**Recommendation:** Archive 9 files, keep 7 actively used files

---

## Files to Archive (Move to `plans/archive/`)

### 1. Completed Phase Plans (Historical Reference)
**Archive these after Phase 3 completes:**
- ✅ `phase1-foundation.md` (56KB) - Phase 1 complete
- ✅ `phase2-core-entities.md` (41KB) - Phase 2 complete

**Rationale:** These are historical artifacts. Keep for reference but not actively needed.

### 2. Redundant Phase 3 Supplementary Docs
**Archive immediately:**
- ⚠️ `phase3-summary.md` (11KB) - Duplicates phase3-opportunities.md intro
- ⚠️ `phase3-checklist.md` (10KB) - Simple task list, redundant with detailed plan
- ⚠️ `phase3-dependencies.md` (16KB) - Info already in phase3-opportunities.md
- ⚠️ `phase3-quickstart.md` (15KB) - Quick reference, but phase3-opportunities.md serves this

**Rationale:** All info consolidated in `phase3-opportunities.md`. Multiple docs cause confusion.

### 3. Meta-Planning Templates (Initial Planning Artifacts)
**Archive after Phase 3 completes:**
- 📋 `MASTER_PLAN.md` (7.2KB) - High-level overview, useful until Phase 3 done
- 📋 `DEPENDENCIES.md` (7.4KB) - Cross-phase dependencies
- 📋 `RISK_REGISTER.md` (7.7KB) - Risk tracking
- 📋 `SPIKE_TASKS.md` (13KB) - SPIKE tracking
- 📋 `STEEL_THREAD.md` (6KB) - Integration testing plan
- 📋 `TASK_TEMPLATE.md` (6.1KB) - Template for task breakdown

**Rationale:** These were useful for initial planning but are less relevant during execution.

---

## Files to Keep (Active Use)

### Current Phase
- ✅ `phase3-opportunities.md` (65KB) - **ACTIVE** - Primary planning doc
- ✅ `docs/phase3-completion-summary.md` (NOT in plans/ folder) - **ACTIVE** - Status tracking

### Future Phases
- 📅 `phase4-user-experience.md` (40KB) - Next phase
- 📅 `phase5-data-reports.md` (43KB) - Future reference
- 📅 `phase6-production.md` (40KB) - Future reference

---

## Recommended Folder Structure

```
plans/
├── phase3-opportunities.md          (ACTIVE - 65KB)
├── phase4-user-experience.md        (NEXT - 40KB)
├── phase5-data-reports.md           (FUTURE - 43KB)
├── phase6-production.md             (FUTURE - 40KB)
└── archive/                         (NEW FOLDER)
    ├── completed-phases/
    │   ├── phase1-foundation.md
    │   └── phase2-core-entities.md
    ├── meta-planning/
    │   ├── MASTER_PLAN.md
    │   ├── DEPENDENCIES.md
    │   ├── RISK_REGISTER.md
    │   ├── SPIKE_TASKS.md
    │   ├── STEEL_THREAD.md
    │   └── TASK_TEMPLATE.md
    └── phase3-supplementary/
        ├── phase3-summary.md
        ├── phase3-checklist.md
        ├── phase3-dependencies.md
        └── phase3-quickstart.md
```

---

## Impact of Cleanup

**Before:**
- 16 files (404KB)
- Confusing which docs are current
- Redundant information across multiple files

**After:**
- 4 active files in main folder (188KB)
- 12 archived files in organized subfolders (216KB)
- Clear "one source of truth" per phase
- Historical reference preserved

---

## Cleanup Commands

```bash
# Create archive folders
mkdir -p plans/archive/completed-phases
mkdir -p plans/archive/meta-planning
mkdir -p plans/archive/phase3-supplementary

# Move completed phase plans
mv plans/phase1-foundation.md plans/archive/completed-phases/
mv plans/phase2-core-entities.md plans/archive/completed-phases/

# Move meta-planning docs
mv plans/MASTER_PLAN.md plans/archive/meta-planning/
mv plans/DEPENDENCIES.md plans/archive/meta-planning/
mv plans/RISK_REGISTER.md plans/archive/meta-planning/
mv plans/SPIKE_TASKS.md plans/archive/meta-planning/
mv plans/STEEL_THREAD.md plans/archive/meta-planning/
mv plans/TASK_TEMPLATE.md plans/archive/meta-planning/

# Move phase3 supplementary docs
mv plans/phase3-summary.md plans/archive/phase3-supplementary/
mv plans/phase3-checklist.md plans/archive/phase3-supplementary/
mv plans/phase3-dependencies.md plans/archive/phase3-supplementary/
mv plans/phase3-quickstart.md plans/archive/phase3-supplementary/
```

---

## When to Execute

**Option 1: Now (Immediate Cleanup)**
- Move phase3 supplementary docs (4 files) to archive
- Keep completed phases and meta-planning until Phase 3 done

**Option 2: After Phase 3 Completion (Recommended)**
- Move all 12 files to archive at once
- Clean transition between phases
- One-time reorganization

**Option 3: Never (Keep Everything)**
- Maintain current structure
- Risk: Confusion over which docs are current
- Benefit: Historical context immediately available

---

## Recommendation

**Execute Option 1 (Partial Cleanup) Now:**
1. Archive phase3 supplementary docs (clear redundancy)
2. Keep completed phases and meta-planning for now (still referenced)
3. Full cleanup (Option 2) after Phase 3 completes

**Rationale:**
- Reduces immediate confusion (4 phase3 docs → 1 active doc)
- Preserves historical context during active development
- Minimal disruption to current workflow

---

**Document Version:** 1.1
**Author:** Claude (Sonnet 4.5)
**Status:** ✅ Partially Executed - Option 1 Complete
**Execution Date:** 2025-11-04
**Changes in v1.1:**
- ✅ Executed Option 1 (Partial Cleanup)
- ✅ Created archive folder structure
- ✅ Moved 4 redundant phase3 supplementary docs to archive
- ⏸️ Keeping completed phases and meta-planning docs until Phase 3 completes
- **Next Step:** Execute full cleanup (Option 2) after Phase 3 completion
