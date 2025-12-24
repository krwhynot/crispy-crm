# Prompt 2: P1 High Priority Issues (17 fixes)

Copy and paste this prompt into a new Claude Code session:

---

```xml
<context>
  <project>Crispy CRM - React Admin + shadcn/ui + Supabase</project>
  <session>UI/UX Remediation - P1 High Priority</session>
  <fix-guide>/home/krwhynot/projects/crispy-crm/docs/ui-ux/shadcn-mcp-fix-guide.md</fix-guide>
  <prerequisite>P0 Critical issues should be complete (Prompt 1)</prerequisite>
</context>

<objective>
Fix 17 HIGH PRIORITY (P1) accessibility and UX violations.
Target: Score improvement from 8.6 → 9.3/10
</objective>

<design-rules>
- Touch targets: 44px minimum (h-11, min-h-11, size-11)
- Colors: Semantic tokens ONLY (text-foreground, NOT hex values)
- Focus: focus-visible:ring-2 focus-visible:ring-ring
- Spacing: gap-2 minimum between interactive elements
- Z-index: Use standard scale (z-40 FAB, z-50 modals)
</design-rules>

<issues priority="P1-HIGH" count="17">
  <!-- Touch Target Batch (9 issues) -->
  <batch name="touch-targets">
    <issue id="P1-1">
      <file>src/atomic-crm/layout/Header.tsx:130-141</file>
      <fix>Add min-h-11 to NavigationTab</fix>
    </issue>
    <issue id="P1-3">
      <file>src/components/ui/sidebar.tsx:446</file>
      <fix>Change sm variant h-7 to min-h-11 or remove</fix>
    </issue>
    <issue id="P1-4">
      <file>src/atomic-crm/utils/contextMenu.tsx:94</file>
      <fix>Add min-h-11 to menu items</fix>
    </issue>
    <issue id="P1-5">
      <file>src/atomic-crm/utils/contextMenu.tsx:138</file>
      <fix>Add min-h-11 to submenu items</fix>
    </issue>
    <issue id="P1-6">
      <file>src/components/admin/columns-button.tsx:170</file>
      <fix>Change clear button h-4 w-4 to h-11 w-11</fix>
    </issue>
    <issue id="P1-7">
      <file>src/atomic-crm/opportunities/kanban/QuickAddOpportunity.tsx:167-191</file>
      <fix>Add h-11 to Cancel and Create buttons</fix>
    </issue>
    <issue id="P1-8">
      <file>src/atomic-crm/products/ProductList.tsx:57-60</file>
      <fix>Add h-11 or size="default" to popover trigger</fix>
    </issue>
    <issue id="P1-9">
      <file>src/components/admin/select-input.tsx:184</file>
      <fix>Change loading skeleton h-9 to h-11</fix>
    </issue>
    <mcp-query>Show me shadcn button/input sizing patterns for 44px minimum touch targets</mcp-query>
  </batch>

  <!-- Focus/Accessibility Batch (4 issues) -->
  <batch name="focus-accessibility">
    <issue id="P1-2">
      <file>src/atomic-crm/layout/Header.tsx:130-141</file>
      <fix>Add focus-visible:ring-2 focus-visible:ring-ring to NavigationTab</fix>
    </issue>
    <issue id="P1-12">
      <file>src/components/admin/theme-mode-toggle.tsx:50</file>
      <fix>Remove modal={false} prop</fix>
    </issue>
    <issue id="P1-13">
      <file>src/components/admin/locales-menu-button.tsx:29</file>
      <fix>Remove modal={false} prop</fix>
    </issue>
    <mcp-query>Show me shadcn dropdown-menu accessibility patterns for focus management</mcp-query>
  </batch>

  <!-- Layout/Overflow Batch (3 issues) -->
  <batch name="layout-overflow">
    <issue id="P1-10">
      <file>src/atomic-crm/contacts/ContactList.tsx:126</file>
      <fix>Add truncate class and max-w-* to formatFullName output</fix>
    </issue>
    <issue id="P1-11">
      <file>src/atomic-crm/contacts/ContactDetailsTab.tsx:215</file>
      <fix>Add max-h-96 overflow-y-auto to notes section</fix>
    </issue>
    <issue id="P1-14">
      <file>src/components/layouts/StandardListLayout.tsx:180</file>
      <fix>Add min-w-[600px] to main content area</fix>
    </issue>
    <mcp-query>Show me shadcn scroll-area and text truncation patterns</mcp-query>
  </batch>

  <!-- Quick Fixes (3 issues) -->
  <batch name="quick-fixes">
    <issue id="P1-15">
      <file>src/atomic-crm/tasks/AddTask.tsx</file>
      <fix>Change invalid max-h-9/10 to max-h-[90vh]</fix>
    </issue>
    <issue id="P1-16">
      <file>src/atomic-crm/dashboard/v3/components/LogActivityFAB.tsx</file>
      <fix>Change z-50 to z-40 (FAB below modals)</fix>
    </issue>
    <issue id="P1-17">
      <file>src/atomic-crm/opportunities/components/SimilarOpportunitiesDialog.tsx:111</file>
      <fix>Replace var(--text-on-color) with text-primary-foreground</fix>
    </issue>
    <mcp-query>Show me shadcn z-index scale and semantic color tokens</mcp-query>
  </batch>
</issues>

<workflow>
1. Work through batches in order (touch-targets → focus → layout → quick)
2. Query shadcn MCP for each batch's pattern
3. Apply fixes, verify each works
4. Update checkboxes in fix guide after each batch
</workflow>

<success-criteria>
- [ ] All navigation/menu items ≥ 44px
- [ ] All buttons have focus-visible rings
- [ ] modal={false} removed from dropdowns
- [ ] Long text truncates properly
- [ ] Notes sections scroll
- [ ] No invalid Tailwind classes
- [ ] Z-index follows standard scale
</success-criteria>

<handoff>
When complete, run Prompt 3 for P2 Medium Priority issues.
Expected score after this prompt: 9.3/10
</handoff>
```

---

## Estimated Time: 90-120 minutes
## Score Impact: +0.7 points (8.6 → 9.3)
