# Documentation Restructuring Guide

**Goal:** Consolidate documentation into clearer structure
**Approach:** Merge duplicates, organize by purpose, create master index
**Estimated Time:** 2-3 hours

---

## Current Structure Problems

1. **Duplication:** `docs/user-guides/` vs. `docs/guides/`
2. **Unclear hierarchy:** Too many top-level folders
3. **No master index:** Hard to know what documentation exists
4. **Mixed purposes:** Claude AI docs mixed with user docs

---

## Proposed New Structure

```
docs/
├── README.md                    # Master index (NEW)
├── guides/                      # End-user guides (CONSOLIDATED)
│   ├── README.md
│   ├── 01-development-setup.md
│   ├── 02-testing.md
│   └── managing-opportunities.md (from user-guides/)
├── architecture/                # Architecture docs (NEW)
│   ├── README.md
│   ├── adr/                     # Moved from docs/adrs/
│   │   └── 2025-10-17-supabase-advisor-report.md
│   └── architecture-essentials.md (from claude/)
├── development/                 # Developer guides (NEW)
│   ├── README.md
│   ├── commands-quick-reference.md (from claude/)
│   ├── common-tasks.md (from claude/)
│   └── testing-quick-reference.md (from claude/)
├── database/                    # Database docs (UNCHANGED)
│   ├── README.md
│   ├── data-quality-analysis.sql
│   ├── DATA-QUALITY-README.md
│   ├── migration-business-rules.md
│   ├── SOFT_DELETE_CASCADE_GUIDE.md
│   └── migrate.md
├── supabase/                    # Supabase-specific (UNCHANGED)
│   ├── WORKFLOW.md
│   ├── supabase_commands_reference.md
│   ├── supabase_troubleshooting.md
│   └── supabase_workflow_overview.md
├── claude/                      # AI agent instructions (TRIMMED)
│   ├── README.md
│   └── engineering-constitution.md
├── internal-docs/               # Internal technical docs (UNCHANGED)
│   └── color-theming-architecture.docs.md
├── archive/                     # Historical artifacts (EXISTING)
│   └── 2025-10-planning/
└── cleanup/                     # Cleanup project docs (NEW)
    ├── TEST-CLEANUP-CHECKLIST.md
    └── DOCUMENTATION-RESTRUCTURING-GUIDE.md (this file)
```

---

## Execution Steps

### Phase 1: Backup (Safety First)

```bash
# Create a backup of docs/ before making changes
cp -r docs/ docs-backup-$(date +%Y%m%d)

# Or commit current state
git add docs/
git commit -m "docs: snapshot before restructuring"
```

### Phase 2: Create New Directories

```bash
# Create new organizational structure
mkdir -p docs/architecture/adr
mkdir -p docs/development
mkdir -p docs/cleanup
```

### Phase 3: Move Architecture Docs

```bash
# Move ADRs
git mv docs/adrs/* docs/architecture/adr/ 2>/dev/null || echo "No ADR files to move"
rmdir docs/adrs/ 2>/dev/null || echo "ADR directory not empty or doesn't exist"

# Move architecture essentials from claude/ to architecture/
git mv docs/claude/architecture-essentials.md docs/architecture/ 2>/dev/null || echo "File not found"

# Create architecture README
cat > docs/architecture/README.md << 'EOF'
# Architecture Documentation

## Overview

This directory contains architectural decisions, design patterns, and system design documentation for Atomic CRM.

## Contents

- **`architecture-essentials.md`** - Core architectural patterns and principles
- **`adr/`** - Architecture Decision Records (ADRs)

## Architecture Decision Records

ADRs document significant architectural decisions with their context and consequences.

### Recent Decisions

- `2025-10-17-supabase-advisor-report.md` - Supabase configuration audit

## Key Architectural Principles

1. **Single Source of Truth** - Supabase + Zod at API boundary
2. **No Over-Engineering** - Fail fast, no circuit breakers
3. **UI as Source of Truth** - Only validate fields with UI inputs
4. **Semantic Colors Only** - CSS variables, never hex codes
5. **Two-Layer Security** - GRANT permissions + RLS policies

See `architecture-essentials.md` for complete details.
EOF
```

### Phase 4: Move Development Docs

```bash
# Move developer-focused docs from claude/
git mv docs/claude/commands-quick-reference.md docs/development/
git mv docs/claude/common-tasks.md docs/development/
git mv docs/claude/testing-quick-reference.md docs/development/

# Create development README
cat > docs/development/README.md << 'EOF'
# Development Documentation

## Overview

This directory contains guides for developers working on Atomic CRM.

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
EOF
```

### Phase 5: Consolidate User Guides

```bash
# Move user guides from user-guides/ to guides/
if [ -d "docs/user-guides" ]; then
  # Copy files to guides/
  cp docs/user-guides/*.md docs/guides/ 2>/dev/null || echo "No markdown files to move"

  # Remove old directory after verification
  # git rm -r docs/user-guides/  # Uncomment after verifying files copied
fi

# Update guides README
cat > docs/guides/README.md << 'EOF'
# User & Developer Guides

## Overview

This directory contains comprehensive guides for both end-users and developers.

## User Guides

- **`managing-opportunities.md`** - How to create and manage sales opportunities

## Developer Setup Guides

- **`01-development-setup.md`** - Initial project setup
- **`02-testing.md`** - Testing strategy and execution

## Getting Started

1. **First time?** Start with `01-development-setup.md`
2. **Need to test?** See `02-testing.md`
3. **Database work?** See `../supabase/WORKFLOW.md`

## Related Documentation

- **Database:** `../database/` - Schema, migrations, data quality
- **Supabase:** `../supabase/` - Supabase-specific workflows
- **Development:** `../development/` - Common tasks and commands
EOF
```

### Phase 6: Trim Claude Directory

```bash
# Keep only essential AI agent instructions
# The claude/ directory should contain docs specifically for Claude Code AI

# Create updated Claude README
cat > docs/claude/README.md << 'EOF'
# Claude Code AI Instructions

## Overview

This directory contains instructions specifically for the Claude Code AI agent.

## Contents

- **`engineering-constitution.md`** - Core development principles and rules

## What Moved

Developer-focused documentation has been reorganized:
- Commands → `../development/commands-quick-reference.md`
- Common tasks → `../development/common-tasks.md`
- Architecture → `../architecture/architecture-essentials.md`
- Testing → `../development/testing-quick-reference.md`

This directory now contains only AI agent-specific instructions.
EOF
```

### Phase 7: Create Master Documentation Index

```bash
# Create top-level README for docs/
cat > docs/README.md << 'EOF'
# Atomic CRM Documentation

**Welcome to the Atomic CRM documentation!**

This is your central hub for all project documentation, organized by audience and purpose.

---

## 🚀 Quick Start

**New to the project?**
1. [Development Setup](guides/01-development-setup.md)
2. [Supabase Workflow](supabase/WORKFLOW.md)
3. [Commands Quick Reference](development/commands-quick-reference.md)

**Need to make database changes?**
1. [Supabase Workflow Overview](supabase/supabase_workflow_overview.md) ⭐ **START HERE**
2. [Migration Business Rules](database/migration-business-rules.md)
3. [Database Commands](supabase/supabase_commands_reference.md)

**Running tests?**
- [Testing Guide](guides/02-testing.md)
- [Testing Quick Reference](development/testing-quick-reference.md)

---

## 📚 Documentation Structure

### For End Users
- **[guides/](guides/)** - User guides and tutorials
  - How to use Atomic CRM features
  - Managing opportunities, contacts, organizations

### For Developers
- **[development/](development/)** - Developer guides and references
  - Commands quick reference
  - Common development tasks
  - Testing patterns

- **[guides/](guides/)** - Setup and workflow guides
  - Development setup (01-development-setup.md)
  - Testing (02-testing.md)

### For Database Work
- **[database/](database/)** - Database documentation
  - Data quality analysis tools
  - Migration guidelines
  - Schema documentation

- **[supabase/](supabase/)** - Supabase-specific documentation ⭐
  - Complete workflow guide (WORKFLOW.md)
  - Commands reference
  - Troubleshooting

### For Architecture
- **[architecture/](architecture/)** - Architectural decisions and patterns
  - Architecture essentials
  - ADRs (Architecture Decision Records)

### For Internal Reference
- **[internal-docs/](internal-docs/)** - Technical implementation details
  - Color theming architecture
  - Internal design decisions

- **[claude/](claude/)** - AI agent instructions
  - Engineering constitution
  - Code generation rules

### Historical
- **[archive/](archive/)** - Completed planning documents and deprecated docs
  - 2025-10-planning/ - October 2025 feature planning

---

## 📖 Key Documents

### Most Important (Start Here)

1. **[Supabase Workflow](supabase/WORKFLOW.md)** ⭐ - Complete database workflow guide
2. **[Engineering Constitution](claude/engineering-constitution.md)** - Core development principles
3. **[Commands Quick Reference](development/commands-quick-reference.md)** - All CLI commands
4. **[Common Tasks](development/common-tasks.md)** - Step-by-step guides

### Database & Schema

- [Migration Business Rules](database/migration-business-rules.md) - When to create migrations
- [Data Quality Analysis](database/DATA-QUALITY-README.md) - Analyzing database gaps
- [Supabase Troubleshooting](supabase/supabase_troubleshooting.md) - Common issues

### Development Workflow

- [Development Setup](guides/01-development-setup.md) - Initial setup
- [Testing Guide](guides/02-testing.md) - Testing strategy
- [Testing Quick Reference](development/testing-quick-reference.md) - Test patterns

---

## 🎯 Common Tasks

### Start Development

```bash
npm run db:local:start  # Start Supabase
npm run dev             # Start UI
```

### Create Database Migration

```bash
npx supabase migration new <name>
# Edit migration file
npx supabase db reset  # Test locally
npm run db:cloud:push  # Deploy to production
```

See: [Supabase Workflow](supabase/WORKFLOW.md)

### Run Tests

```bash
npm test                # Watch mode
npm run test:coverage   # With coverage
```

See: [Testing Guide](guides/02-testing.md)

### Common Development Tasks

- Adding a resource: [Common Tasks](development/common-tasks.md#adding-a-new-resource)
- Customizing CRM: [Common Tasks](development/common-tasks.md#customizing-the-crm)
- Color system: [Color Theming](internal-docs/color-theming-architecture.docs.md)

---

## 🔧 Documentation Maintenance

### Where to Add New Docs

- **User feature guides** → `guides/`
- **Developer how-tos** → `development/`
- **Database design** → `database/` or `architecture/adr/`
- **Supabase-specific** → `supabase/`
- **Completed planning** → `archive/YYYY-MM-description/`

### Updating This Index

When adding significant documentation, update:
1. This README.md (you are here)
2. Relevant section README (e.g., `development/README.md`)
3. CLAUDE.md if it affects AI agent behavior

---

## 📞 Need Help?

- **Bug or issue:** Check [Supabase Troubleshooting](supabase/supabase_troubleshooting.md)
- **How do I...?** Check [Common Tasks](development/common-tasks.md)
- **Database question:** See [Supabase Workflow](supabase/WORKFLOW.md)
- **Can't find docs:** This README should point you in the right direction!

---

## 📝 Documentation Standards

### File Naming
- Use kebab-case: `my-guide.md`
- Prefix with numbers for sequence: `01-setup.md`, `02-testing.md`
- Use descriptive names: `data-quality-analysis.sql` not `analysis.sql`

### Internal Links
- Use relative links: `[guide](../development/guide.md)`
- Check links after moving files
- Use `grep -r "docs/old-path"` to find references

### README Files
- Every directory should have a README.md
- Explain purpose and contents
- Link to related documentation

---

**Last Updated:** 2025-10-31
**Documentation Structure Version:** 2.0
EOF
```

### Phase 8: Update References

```bash
# Find and update broken links
# Check CLAUDE.md for outdated paths
grep -r "docs/adrs" docs/ CLAUDE.md README.md || echo "No references to old adrs path"
grep -r "docs/user-guides" docs/ CLAUDE.md README.md || echo "No references to old user-guides path"
grep -r "docs/claude/architecture" docs/ CLAUDE.md README.md || echo "No references to old claude/architecture path"

# Update CLAUDE.md if needed (manual step - review and edit)
echo "MANUAL STEP: Review CLAUDE.md and update any paths that reference:"
echo "  - docs/adrs/ → docs/architecture/adr/"
echo "  - docs/user-guides/ → docs/guides/"
echo "  - docs/claude/commands* → docs/development/"
```

### Phase 9: Verify Structure

```bash
# List new structure
tree docs/ -L 2 -I 'node_modules'

# Or use ls
ls -R docs/ | grep -E "^docs|\.md$"

# Verify no broken links (manual check)
echo "MANUAL STEP: Click through docs/README.md links to verify all work"
```

### Phase 10: Clean Up Old Directories

```bash
# After verifying everything works, remove old directories
# ONLY run these after confirming files are moved!

# Remove old user-guides (if empty)
# git rm -r docs/user-guides/  # Uncomment after verification

# Remove old adrs (if empty)
# git rm -r docs/adrs/  # Uncomment after verification

# Note: Claude directory is trimmed but kept for AI instructions
```

### Phase 11: Commit Changes

```bash
# Stage all changes
git add docs/

# Review what's changed
git status
git diff --cached --stat

# Commit with detailed message
git commit -m "docs: consolidate documentation structure

CHANGED:
- Merged user-guides/ into guides/ (eliminate duplication)
- Moved adrs/ to architecture/adr/ (better organization)
- Moved architecture-essentials.md to architecture/
- Moved developer guides from claude/ to development/
- Created docs/README.md as master documentation index
- Created section READMEs for better navigation

NEW STRUCTURE:
- docs/architecture/ - Architectural decisions and patterns
- docs/development/ - Developer-focused guides
- docs/guides/ - Consolidated user and setup guides
- docs/README.md - Master navigation index

RESULT:
- Clearer documentation hierarchy
- Reduced duplication (user-guides merged)
- Easier navigation (master index)
- Separation of concerns (architecture vs. development vs. user)

All internal documentation references updated."
```

---

## Verification Checklist

After completing restructuring:

- [ ] All README files created
- [ ] Master index (`docs/README.md`) complete
- [ ] All files moved with `git mv` (preserves history)
- [ ] No broken internal links
- [ ] Old directories removed (after verification)
- [ ] CLAUDE.md updated with new paths
- [ ] Changes committed with clear message
- [ ] Documentation builds/renders correctly
- [ ] Team members can navigate documentation easily

---

## Rollback Plan

If restructuring causes problems:

```bash
# Restore from backup
rm -rf docs/
cp -r docs-backup-YYYYMMDD/ docs/

# Or revert git commit
git revert HEAD

# Or reset to before restructure
git log --oneline  # Find commit hash before restructure
git reset --hard <commit-hash>
```

---

## Time Estimate

- Phase 1-2 (Setup): 15 minutes
- Phase 3-6 (Moving files): 30-45 minutes
- Phase 7 (Master index): 30 minutes
- Phase 8-9 (Verification): 30 minutes
- Phase 10-11 (Cleanup & commit): 15 minutes

**Total: 2-3 hours**

---

## Post-Restructure Benefits

✅ **Easier Navigation**
- Master index guides users to right docs
- Clear separation by purpose
- Less duplication

✅ **Better Organization**
- Architecture docs together
- Developer guides consolidated
- User guides unified

✅ **Clearer Maintenance**
- Obvious where new docs belong
- Section READMEs explain purpose
- Standardized structure

✅ **Reduced Confusion**
- No more duplicate folders
- Consistent naming conventions
- Logical hierarchy

---

## Notes

- All moves use `git mv` to preserve history
- Backups created before changes
- READMEs provide navigation
- Master index is single source of truth

**Questions?** See `docs/README.md` after restructuring for complete navigation.
