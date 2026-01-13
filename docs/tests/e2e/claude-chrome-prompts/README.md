# Claude Chrome E2E Testing Prompts

This folder contains copy-paste-ready prompts for manual E2E testing using Claude Chrome.

## Quick Start

1. **Start your dev server**: `just dev` (or `npm run dev`)
2. **Seed test data** (optional): `just seed-e2e`
3. **Copy the prompt** for the resource you want to test
4. **Paste to Claude** and ask it to run the tests

## Available Test Prompts

| File | Resource | Description |
|------|----------|-------------|
| [contacts.md](./contacts.md) | Contacts | Contact forms, JSONB email/phone arrays, organization linking |
| [organizations.md](./organizations.md) | Organizations | Org types (customer, prospect, principal, distributor), hierarchy |
| [opportunities.md](./opportunities.md) | Opportunities | Pipeline stages, win/loss reasons, related entities |
| [products.md](./products.md) | Products | Principal products, categories, distributor assignments |
| [team.md](./team.md) | Team/Sales | User management, roles, permissions |

## Test Coverage Philosophy

Each prompt covers:

- **Phase 1: List View** - Column display, filters, sorting, pagination
- **Phase 2: Create Form** - Field-by-field validation testing
- **Phase 3: Edit Form** - Data persistence, validation on existing records
- **Phase 4: SlideOver/Detail** - Read-only views, related data sections
- **Phase 5: Accessibility** - ARIA attributes, focus states, touch targets
- **Phase 6: Edge Cases** - Boundary conditions, special characters

## Severity Levels

When reporting issues, use these severity levels:

| Level | Description | Example |
|-------|-------------|---------|
| **Critical** | Data loss, security issue, complete feature broken | Save button doesn't work, data corruption |
| **High** | Workflow blocked, major functionality broken | Required field validation missing |
| **Medium** | Degraded UX, workaround exists | Error message unclear |
| **Low** | Cosmetic, minor annoyance | Spacing inconsistency |

## Success Criteria

A resource passes E2E testing when:

- [ ] All required fields enforce validation
- [ ] All fields save and persist correctly
- [ ] List displays all data without "undefined" or errors
- [ ] Accessibility requirements met (ARIA, touch targets)
- [ ] No console errors during testing

## Related Documentation

- [Test Architecture](../test-architecture.md)
- [Test Authoring Guide](../test-authoring-guide.md)
- [Pattern Catalog](../pattern-catalog.md)
