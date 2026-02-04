# Skill Trigger Boundaries

Clarifies when to use which skill when multiple skills could apply.

## Debugging vs Code Analysis

**fail-fast-debugging** - Use when:
- There's a failure, bug, error, or exception
- Tests are failing
- Code crashes or produces wrong output
- "Why is X broken/not working/failing?"

**comprehensive-tracing** - Use when:
- Understanding architecture or data flow (no error reported)
- "How does X work?"
- "Who calls function Y?"
- "Trace the execution path for feature Z"

**Decision tree:**
```
Is there a failure/error/bug?
├─ YES → fail-fast-debugging
└─ NO → comprehensive-tracing
```

---

## Database Performance

**supabase** - Use when:
- Running Supabase CLI commands
- Writing migrations or RLS policies
- Optimizing queries at database level (indexes, EXPLAIN)
- Creating Edge Functions

**troubleshooting** - Use when:
- Diagnosing build failures, deployment issues
- Performance bottlenecks (need to identify cause)
- Environment configuration issues
- "Why is X slow?" (diagnosis phase)

**Decision tree:**
```
Is this a database operation?
├─ YES → Are you writing SQL/migrations?
│   ├─ YES → supabase
│   └─ NO → Are you diagnosing performance?
│       ├─ YES → troubleshooting (diagnosis) → supabase (fix)
│       └─ NO → supabase
└─ NO → troubleshooting
```

---

## Validation Layers

**enforcing-principles** - Use when:
- Creating Zod schemas for API boundary validation
- Implementing form validation patterns
- Type safety at implementation layer
- "How do I validate X in React Hook Form?"

**data-integrity-guards** - Use when:
- Multi-layer validation strategy (API + Form + DB + Logging)
- Defense-in-depth patterns
- Ensuring data integrity across layers
- "How do I prevent invalid data from reaching the database?"

**validate-props** - (MERGED into enforcing-principles)
- Component props validation (high-churn UI components)

**Decision tree:**
```
What layer are you validating?
├─ Single layer (API or form) → enforcing-principles
├─ Multiple layers (defense-in-depth) → data-integrity-guards
└─ Component props → enforcing-principles (props section)
```

---

## Forms & UI

**ui-ux-design-principles** - Use when:
- Designing forms, layouts, components
- Choosing colors, spacing, typography
- Accessibility (ARIA, WCAG 2.1 AA)
- "How should I design X?"

**enforcing-principles** - Use when:
- Implementing form validation logic
- Setting form defaults from Zod schemas
- Form submission patterns
- "How do I validate form inputs?"

**data-integrity-guards** - Use when:
- Multi-layer form defaults (schema + useWatch)
- Ensuring form state integrity
- "How do I prevent users from submitting invalid data?"

**Decision tree:**
```
What aspect of forms?
├─ Visual design/UX → ui-ux-design-principles
├─ Validation logic → enforcing-principles
└─ Multi-layer defaults → data-integrity-guards
```

---

## Testing

**testing-patterns** - Use when:
- Writing unit tests, integration tests, E2E tests
- Setting up Vitest, Playwright
- Mocking Supabase, React Admin
- TDD workflow

**verification-before-completion** - Use when:
- Verifying tests pass before claiming "done"
- Running build checks before committing
- Completion gates (evidence-based claims)

**Decision tree:**
```
What are you doing?
├─ Writing/debugging tests → testing-patterns
└─ Verifying completion → verification-before-completion
```

---

## Supabase vs Data Provider

**supabase** - Use when:
- Infrastructure layer (CLI, migrations, Edge Functions)
- Writing SQL, creating views, RLS policies
- Database performance tuning

**crispy-data-provider** - Use when:
- Application layer (React Admin handlers)
- CRUD operations in frontend
- Data provider architecture patterns

**Decision tree:**
```
Which layer?
├─ Infrastructure (database, migrations, CLI) → supabase
└─ Application (React Admin, handlers) → crispy-data-provider
```

---

Last updated: 2026-02-02
