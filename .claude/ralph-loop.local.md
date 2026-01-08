---
active: true
iteration: 1
max_iterations: 40
completion_promise: "UI_UX_DEFERRED_COMPLETE"
started_at: "2026-01-08T05:02:01Z"
---

Open docs/TODOs/ui-ux-consistency-audit.md (UI/UX Consistency Audit - Detailed Implementation Todos).

Scope:
- Focus ONLY on unresolved Critical + Medium issues in '❌ Issues Confirmed (Implementation Required)'.
- Work through TODOs 1.1–1.6, 2.1–2.5, and 3.1–3.5 that are not yet checked.
- Skip Phase 4 unless explicitly needed by an earlier TODO.

Best-practices via Ref MCP:
- When unsure about the correct pattern, accessibility rule, or API usage, call the Ref MCP tools to look up documentation instead of guessing.
- Use Ref to search:
  - React Admin form & list patterns
  - React Hook Form accessibility guidance
  - WCAG 2.1 AA related to forms, modals, and touch targets
  - Tailwind/shadcn button and badge conventions
- Prefer small, focused Ref queries like:
  - 'React Admin Create footer best practices'
  - 'WCAG required field indicators'
  - 'Tailwind button variants primary vs outline'
- Apply the retrieved best practices to the implementation, but keep changes minimal and aligned with existing CLAUDE.md decisions.

Implementation rules:
- For each targeted TODO, follow its Step-by-Step instructions using the referenced components (ContactCreate, ContactList, ContactSlideOver, etc.) as canonical patterns.
- Maintain the TDD workflow from this document: create/update the specified test file, run the suggested just test command, and iterate until tests pass.
- Do not restructure the audit doc; only update checkboxes, statuses, and brief notes.

Doc + status updates:
- When a TODO is implemented and its tests pass:
  - Mark all relevant checklist items as checked.
  - Update its entry in '❌ Issues Confirmed (Implementation Required)' to ✅ Fixed with a short description.
- If a TODO is blocked (e.g., schema changes or design sign‑off required), mark it ⚠️ Blocked with a concrete reason.

Stop condition:
- Repeat this process until there are no remaining unblocked Critical or Medium TODOs in this file.
- When all such items are either ✅ Fixed or ⚠️ Blocked and tests are green, output <promise>UI_UX_DEFERRED_COMPLETE</promise>.
