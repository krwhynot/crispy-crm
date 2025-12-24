# Prompt 1: Session Setup & P0 Critical Issues (5 fixes)

Copy and paste this prompt into a new Claude Code session:

---

```xml
<context>
  <project>Crispy CRM - React Admin + shadcn/ui + Supabase</project>
  <session>UI/UX Remediation - P0 Critical Issues</session>
  <fix-guide>/home/krwhynot/projects/crispy-crm/docs/ui-ux/shadcn-mcp-fix-guide.md</fix-guide>
</context>

<objective>
Fix 5 CRITICAL (P0) accessibility violations using shadcn MCP server.
Target: Score improvement from 8.2 → 8.6/10
</objective>

<pre-flight>
1. Run `/mcp` to verify shadcn server is Connected
2. Read the fix guide to confirm issue locations
</pre-flight>

<design-rules>
- Touch targets: 44px minimum (h-11, min-h-11, size-11)
- Colors: Semantic tokens ONLY (text-muted-foreground, NOT text-gray-500)
- Focus: focus-visible:ring-2 focus-visible:ring-ring
- WCAG 2.2 AA compliance required
</design-rules>

<issues priority="P0-CRITICAL">
  <issue id="P0-1">
    <file>src/atomic-crm/opportunities/kanban/ColumnCustomizationMenu.tsx:44</file>
    <problem>Settings button h-8 w-8 = 32px (violates 44px minimum)</problem>
    <wcag>2.5.5 Target Size</wcag>
    <fix>Change to h-11 w-11</fix>
    <mcp-query>Show me the shadcn button component with icon size variant. I need the correct sizing for a 44px touch target icon button.</mcp-query>
  </issue>

  <issue id="P0-2">
    <file>src/atomic-crm/opportunities/kanban/QuickAddOpportunity.tsx:102</file>
    <problem>Keyboard users cannot dismiss dialog with ESC key</problem>
    <wcag>2.1.1 Keyboard</wcag>
    <fix>Add useEffect ESC key listener OR refactor to use Radix Dialog</fix>
    <mcp-query>Show me shadcn dialog or popover patterns that include proper ESC key dismissal. I have a custom modal that needs keyboard navigation support.</mcp-query>
  </issue>

  <issue id="P0-3">
    <file>src/atomic-crm/opportunities/kanban/QuickAddOpportunity.tsx:102</file>
    <problem>No X button in modal header - UX convention violation</problem>
    <fix>Add 44x44px close button in top-right corner</fix>
    <mcp-query>Show me the shadcn dialog component with DialogClose button. I need the correct close button implementation with 44px touch target.</mcp-query>
  </issue>

  <issue id="P0-4">
    <file>src/atomic-crm/opportunities/kanban/QuickAddOpportunity.tsx:106</file>
    <problem>Modal backdrop click does not dismiss</problem>
    <fix>Add click handler on backdrop OR refactor to use Radix Dialog</fix>
    <mcp-query>Show me shadcn dialog overlay implementation. I need the click-outside dismissal pattern that Radix Dialog uses.</mcp-query>
  </issue>

  <issue id="P0-5">
    <file>src/components/admin/columns-button.tsx:86</file>
    <problem>Uses createPortal manually, bypassing Radix focus management</problem>
    <risk>Z-index conflicts, broken focus traps</risk>
    <fix>Refactor to use standard Radix Popover pattern</fix>
    <effort>30 min (largest in batch)</effort>
    <mcp-query>Show me the shadcn popover component implementation. I need to refactor a custom portal to use proper Radix Popover with focus management.</mcp-query>
  </issue>
</issues>

<workflow>
1. Read each file to understand current implementation
2. Query shadcn MCP for correct pattern
3. Apply fix maintaining existing functionality
4. Verify: touch target size, keyboard nav, focus management
5. Update checkbox in fix guide when done
</workflow>

<success-criteria>
- [ ] All 5 P0 issues fixed
- [ ] ESC key dismisses QuickAddOpportunity
- [ ] Click outside dismisses QuickAddOpportunity
- [ ] Close button visible and 44px
- [ ] ColumnsButton uses Radix Popover (no manual portal)
- [ ] All interactive elements ≥ 44px touch targets
</success-criteria>

<handoff>
When complete, update checkboxes in fix guide and run Prompt 2 for P1 High Priority issues.
</handoff>
```

---

## Estimated Time: 60-75 minutes
## Score Impact: +0.4 points (8.2 → 8.6)
