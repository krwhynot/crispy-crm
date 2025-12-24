# Prompt 3: P2 Medium Priority Issues (23 fixes)

Copy and paste this prompt into a new Claude Code session:

---

```xml
<context>
  <project>Crispy CRM - React Admin + shadcn/ui + Supabase</project>
  <session>UI/UX Remediation - P2 Medium Priority</session>
  <fix-guide>/home/krwhynot/projects/crispy-crm/docs/ui-ux/shadcn-mcp-fix-guide.md</fix-guide>
  <prerequisite>P0 and P1 issues should be complete</prerequisite>
</context>

<objective>
Fix 23 MEDIUM PRIORITY (P2) polish and consistency issues.
Target: Score improvement from 9.3 → 9.7/10
</objective>

<design-rules>
- Spacing: gap-2 minimum (not gap-1, gap-0.5, gap-1.5)
- Touch targets: 44px minimum
- Z-index: Standard scale only (z-10, z-20, z-30, z-40, z-50)
- No forceMount unless specifically required for animation
</design-rules>

<issues priority="P2-MEDIUM" count="23">
  <!-- Spacing Violations (6 issues) -->
  <batch name="spacing">
    <issue id="P2-1" file="ColumnCustomizationMenu.tsx:23-36">Add ESC key listener</issue>
    <issue id="P2-2" file="button.constants.ts:29">Change gap-1.5 to gap-2</issue>
    <issue id="P2-3" file="ResourceSlideOver.tsx:188">Change gap-1 to gap-2</issue>
    <issue id="P2-4" file="ResourceSlideOver.tsx:241">Change gap-1 to gap-2</issue>
    <issue id="P2-5" file="ResourceSlideOver.tsx:252">Change gap-1 to gap-2</issue>
    <issue id="P2-6" file="badge.constants.ts:12">Change gap-1 to gap-2</issue>
    <mcp-query>Show me shadcn component internal spacing patterns for icons and text</mcp-query>
  </batch>

  <!-- Touch Target Remaining (3 issues) -->
  <batch name="touch-targets">
    <issue id="P2-7" file="calendar.tsx:27">Increase --cell-size to 44px</issue>
    <issue id="P2-9" file="sidebar.tsx:294">Change SidebarInput h-8 to h-11</issue>
    <issue id="P2-23" file="radio-button-group-input.tsx:94">Change skeleton h-9 to h-11</issue>
    <mcp-query>Show me shadcn calendar and input sizing for touch targets</mcp-query>
  </batch>

  <!-- Focus/Accessibility (2 issues) -->
  <batch name="focus">
    <issue id="P2-8" file="breadcrumb.tsx:46">Add focus-visible styles to BreadcrumbLink</issue>
    <issue id="P2-10" file="contextMenu.tsx:82">Change z-[9999] to z-50</issue>
    <mcp-query>Show me shadcn breadcrumb and context-menu accessibility patterns</mcp-query>
  </batch>

  <!-- forceMount Cleanup (3 issues) -->
  <batch name="forceMount">
    <issue id="P2-11" file="columns-button.tsx:86">Remove forceMount if not needed</issue>
    <issue id="P2-12" file="user-menu.tsx:48">Remove forceMount if not needed</issue>
    <issue id="P2-13" file="DashboardTabPanel.tsx:102-138">Remove forceMount, use lazy loading</issue>
    <mcp-query>When should I use forceMount on shadcn popover/dropdown/tabs?</mcp-query>
  </batch>

  <!-- Responsive/Layout (2 issues) -->
  <batch name="responsive">
    <issue id="P2-14" file="KPISummaryRow.tsx">Add md: responsive breakpoints</issue>
    <issue id="P2-22" file="ContactList/OpportunityList">Add empty state for filtered results</issue>
    <mcp-query>Show me shadcn responsive grid and empty state patterns</mcp-query>
  </batch>

  <!-- Component Fixes (4 issues) -->
  <batch name="components">
    <issue id="P2-15" file="Avatar.tsx">Fix charAt(0) for emoji-safe grapheme handling</issue>
    <issue id="P2-16" file="boolean-input.tsx">Implement readOnly behavior on switch</issue>
    <issue id="P2-18" file="CloseOpportunityModal.tsx">Disable X during form submission</issue>
    <mcp-query>Show me shadcn avatar fallback and switch disabled/readOnly patterns</mcp-query>
  </batch>

  <!-- Overflow/Truncation (3 issues) -->
  <batch name="overflow">
    <issue id="P2-17" file="OpportunitySlideOverDetailsTab.tsx:361,457,485">Add max-h-96 overflow-y-auto</issue>
    <issue id="P2-19" file="OpportunityCard.tsx:196-197">Add truncate to principal badge</issue>
    <issue id="P2-20" file="OpportunityCard.tsx:208-209">Add truncate to contact name</issue>
    <issue id="P2-21" file="OrganizationList.tsx:150">Add truncate to name column</issue>
    <mcp-query>Show me shadcn scroll-area and text truncation patterns</mcp-query>
  </batch>
</issues>

<workflow>
1. Work through batches in order
2. Spacing batch is quickest - do first
3. forceMount requires checking if animations exist
4. Update fix guide checkboxes after each batch
</workflow>

<success-criteria>
- [ ] All gap-1 violations fixed to gap-2
- [ ] Calendar cells 44px
- [ ] No z-[9999] or non-standard z-index
- [ ] forceMount removed where not needed
- [ ] Emoji-safe avatar initials
- [ ] All long text truncates
- [ ] Empty states for filtered lists
</success-criteria>

<handoff>
When complete, run Prompt 4 for P3 Low Priority polish.
Expected score after this prompt: 9.7/10
</handoff>
```

---

## Estimated Time: 2-3 hours
## Score Impact: +0.4 points (9.3 → 9.7)
