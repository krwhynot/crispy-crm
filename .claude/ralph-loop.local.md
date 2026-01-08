---
active: true
iteration: 1
max_iterations: 45
completion_promise: "UI_UX_REMEDIATION_COMPLETE"
started_at: "2026-01-08T13:02:19Z"
---

Open docs/todo/ui-ux-consistency-remediation.md.

Goal:
- Use this remediation checklist as the primary implementation plan for UI/UX consistency fixes.
- Implement tasks in order of Phase (1 → 2 → 3) and within each phase by checklist order.
- Keep this file up to date as items move from planned to completed.

Context:
- Use docs/TODOs/ui-ux-consistency-audit.md and CLAUDE.md as detailed references for patterns, acceptance criteria, and prior decisions.
- When unsure about best practices (forms, slide-overs, breadcrumbs, badges, dropdowns), query the Ref MCP tools for authoritative guidance instead of guessing.

Implementation rules:

Phase 1 (Critical):
- Implement 1.1 TaskCreate → TaskCompactForm:
  - Create src/atomic-crm/tasks/TaskCompactForm.tsx as a single-page form.
  - Migrate fields from TaskGeneralTab.tsx and TaskDetailsTab.tsx into this component.
  - Update TaskCreate.tsx to use TaskCompactForm instead of TaskInputs.
  - Once working and validated, delete TaskInputs.tsx, TaskGeneralTab.tsx, and TaskDetailsTab.tsx.
  - Ensure validation and progress bar behavior match the canonical create-form pattern.
- Implement 1.2 OpportunityCompactForm section headers:
  - Update OpportunityCompactForm.tsx to wrap the specified field groups in FormSectionWithProgress.
  - Keep existing CollapsibleSection components for optional groups.
  - Verify progress tracking works with the new sections.
- Keep 1.3 as documentation only (no code changes).

Phase 2 (Medium):
- 2.1 Slide-Over Header Actions:
  - Remove the broken QuickAddTaskButton from TaskSlideOver.tsx and ensure it renders correctly in OrganizationSlideOver.tsx.
- 2.2 Breadcrumbs for Slide-Overs:
  - Create OrganizationHierarchyBreadcrumb.tsx and TaskHierarchyBreadcrumb.tsx.
  - Wire them into OrganizationSlideOver.tsx and TaskSlideOver.tsx via breadcrumb props.
- 2.3 Edit Button Positioning:
  - Adjust ResourceSlideOver.tsx so the edit button sits correctly in the header actions row.
- 2.4 Badge Styling System:
  - Use Ref to pull badge and status-label best practices as needed.
  - Document the badge system and normalize badge components/usages accordingly.
- 2.5 Dropdown Background Consistency:
  - Audit OrganizationCompactForm.tsx and other relevant dropdowns; align background colors.

Phase 3 (Minor):
- 3.1 Products header height:
  - Investigate and, if necessary, align Products list header height with the standard.
- 3.2 'null' display bug:
  - Fix the 'Yu null' display in Contact slide-overs by adding null checks.
- 3.3 Progress bar edge case:
  - Review FormProgressProvider initial progress behavior and either fix or document the 10% default when there are 0 required fields.

Verification:
- After implementing a logical batch of changes, run:
  - just typecheck
  - just test src/atomic-crm/tasks
  - just test src/atomic-crm/opportunities
  - just build
- Update the Automated and Manual checklist sections in this remediation file as these steps pass.
- Optionally, use E2E guidance from docs/tests/e2e/ui-ux-consistency-manual-test.md for manual verification.

Documentation updates:
- For each completed item:
  - Change its checkbox from [ ] to [x] in this file.
  - Keep the Files Reference tables in sync (move items from To Create/To Modify to implicit 'Done' once implemented, or add notes inline).
- If a task is blocked (e.g., requires schema changes or design sign-off), add a short inline note describing why and mark it as blocked instead of silently skipping it.

Stop condition:
- All Phase 1 and Phase 2 items are either:
  - [x] Completed and reflected in code, or
  - Explicitly marked as blocked with a reason.
- Phase 3 items have been reviewed and either fixed or documented.
- All verification checkboxes that reasonably can be satisfied in this session are updated.
- The remediation checklist remains readable, logically ordered, and consistent with the underlying audit.

When these conditions are met and there are no obvious unhandled tasks in this checklist, output <promise>UI_UX_REMEDIATION_COMPLETE</promise>.
