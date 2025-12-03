---
name: write-plan
description: Creates detailed implementation plans for AI agent execution - integrates with /atomic-crm-constitution for principle enforcement, includes exact file paths, adaptive code examples, verification steps, and task dependency mapping for parallel agent execution
---

# Writing Plans

> **SKILL ACTIVATION:** I'm using the `writing-plans` skill.

**Full guidance:** `.claude/skills/writing-plans/SKILL.md`

---

## Quick Reference

**Save to:** `docs/plans/YYYY-MM-DD-<feature-name>.md`

**Principles:** Zero context. TDD mandatory. Constitution compliance. Exact paths.

**Assume executing agent:**
- Has never seen this repo
- Has NOT read the constitution
- Takes instructions literally

---

## Resources Appendix (include in every plan)

```markdown
## Resources

**Required Reading:**
- `docs/claude/engineering-constitution.md`: Core principles - READ FIRST

**Related Commands:**
- `/atomic-crm-constitution`: Verify implementation compliance

**Constitution Pattern Files:**
- `resources/error-handling.md`: Fail-fast patterns
- `resources/validation-patterns.md`: Zod at API boundary
- `resources/form-state-management.md`: Schema-derived defaults
- `resources/database-patterns.md`: GRANT + RLS
```

---

## Remember

- Zero context - overcommunicate
- Exact file paths - no "appropriate directory"
- Complete commands with expected output
- Every task includes constitution checklist
- Flag violations in code examples with ✅/❌
