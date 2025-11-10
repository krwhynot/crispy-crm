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
