# Session A: Kanban & Opportunities

**Run in parallel with:** Sessions B, C, D
**Files are isolated - no merge conflicts**

---

Copy everything below into a fresh Claude Code session:

```xml
<context>
  <project>Crispy CRM - React 19 + TypeScript + React Admin + Supabase</project>
  <session>Parallel Session A: Kanban & Opportunity Components</session>
  <purpose>Fix 15 WCAG accessibility and UX violations in kanban/opportunity files</purpose>
  <parallel_safety>This session owns EXCLUSIVE files - other sessions work on different files</parallel_safety>
</context>

<pre_flight>
  <step>Run /mcp to verify "shadcn" server is Connected</step>
  <step>If not connected, verify ~/.mcp.json contains shadcn configuration</step>
  <step>Read each file before modifying to understand current implementation</step>
</pre_flight>

<tool_usage>
  <primary_tool>shadcn MCP</primary_tool>
  <instructions>
    For EVERY fix, query the shadcn MCP tool first to get the correct pattern.
    Example queries:
    - "Show me shadcn dialog close button with 44px touch target"
    - "Show me shadcn popover ESC key dismissal pattern"
    - "What's the shadcn z-index scale for FABs vs modals?"
  </instructions>
  <workflow>
    1. Read the file to understand current code
    2. Query shadcn MCP for the correct pattern
    3. Apply the fix following shadcn conventions
    4. Verify the fix meets design rules
  </workflow>
</tool_usage>

<files_owned>
  <!-- ONLY modify these files - other sessions handle other files -->
  <file>src/atomic-crm/opportunities/kanban/QuickAddOpportunity.tsx</file>
  <file>src/atomic-crm/opportunities/kanban/ColumnCustomizationMenu.tsx</file>
  <file>src/atomic-crm/opportunities/components/SimilarOpportunitiesDialog.tsx</file>
  <file>src/atomic-crm/opportunities/components/CloseOpportunityModal.tsx</file>
  <file>src/atomic-crm/opportunities/OpportunitySlideOverDetailsTab.tsx</file>
  <file>src/atomic-crm/opportunities/OpportunityCard.tsx</file>
  <file>src/atomic-crm/tasks/AddTask.tsx</file>
  <file>src/atomic-crm/dashboard/v3/components/LogActivityFAB.tsx</file>
  <file>src/atomic-crm/products/ProductList.tsx</file>
</files_owned>

<design_guidelines>
  <rule name="touch_targets">44px minimum height/width (use h-11, min-h-11, size-11)</rule>
  <rule name="colors">Semantic tokens ONLY (text-foreground, text-primary-foreground, NOT hex)</rule>
  <rule name="z_index">FAB: z-40, Modals: z-50 (FAB must be BELOW modals)</rule>
  <rule name="keyboard">All modals must dismiss with ESC key</rule>
  <rule name="focus">All interactive elements need focus-visible:ring-2</rule>
</design_guidelines>

<constraints>
  <do_not>Modify any files not listed in files_owned</do_not>
  <do_not>Use hardcoded hex colors or rgba values</do_not>
  <do_not>Use z-index values outside standard scale</do_not>
  <do_not>Skip querying shadcn MCP - always check the pattern first</do_not>
  <do_not>Assume file contents - read each file before editing</do_not>
</constraints>

<issues count="15">
  <file_group name="QuickAddOpportunity.tsx" issues="4" priority="P0">
    <mcp_query>Show me shadcn dialog with ESC dismissal, close button, and click-outside handling</mcp_query>
    <issue line="102">Add useEffect ESC key handler to dismiss modal</issue>
    <issue line="102">Add 44px close button (h-11 w-11) in top-right corner</issue>
    <issue line="106">Add click-outside handler on backdrop to dismiss</issue>
    <issue lines="167-191">Add h-11 class to Cancel and Create buttons</issue>
  </file_group>

  <file_group name="ColumnCustomizationMenu.tsx" issues="2" priority="P0">
    <mcp_query>Show me shadcn popover trigger button with 44px touch target and ESC handling</mcp_query>
    <issue line="44">Change h-8 w-8 to h-11 w-11 on settings button</issue>
    <issue lines="23-36">Add useEffect ESC key listener</issue>
  </file_group>

  <file_group name="OpportunityCard.tsx" issues="2" priority="P2">
    <mcp_query>Show me shadcn card text truncation patterns</mcp_query>
    <issue lines="196-197">Add truncate class to principal badge</issue>
    <issue lines="208-209">Add truncate class to contact name</issue>
  </file_group>

  <file_group name="SimilarOpportunitiesDialog.tsx" issues="1" priority="P1">
    <mcp_query>Show me shadcn semantic color tokens for text on colored backgrounds</mcp_query>
    <issue line="111">Replace var(--text-on-color) with text-primary-foreground</issue>
  </file_group>

  <file_group name="CloseOpportunityModal.tsx" issues="1" priority="P2">
    <mcp_query>Show me shadcn dialog patterns for disabling close during form submission</mcp_query>
    <issue>Disable X close button when isSubmitting is true</issue>
  </file_group>

  <file_group name="OpportunitySlideOverDetailsTab.tsx" issues="1" priority="P2">
    <mcp_query>Show me shadcn scroll-area component for long content sections</mcp_query>
    <issue lines="361,457,485">Add max-h-96 overflow-y-auto to content sections</issue>
  </file_group>

  <file_group name="AddTask.tsx" issues="1" priority="P1">
    <mcp_query>Show me shadcn dialog max-height patterns</mcp_query>
    <issue>Change invalid max-h-9/10 to max-h-[90vh]</issue>
  </file_group>

  <file_group name="LogActivityFAB.tsx" issues="1" priority="P1">
    <mcp_query>What z-index scale does shadcn use for FABs vs modals?</mcp_query>
    <issue>Change z-50 to z-40 (FAB must be below modal overlays)</issue>
  </file_group>

  <file_group name="ProductList.tsx" issues="1" priority="P1">
    <mcp_query>Show me shadcn popover trigger button sizing for 44px touch targets</mcp_query>
    <issue lines="57-60">Add h-11 to popover trigger button</issue>
  </file_group>
</issues>

<verification>
  <check>QuickAddOpportunity dismisses when pressing ESC key</check>
  <check>QuickAddOpportunity has visible X close button at 44px</check>
  <check>QuickAddOpportunity dismisses when clicking outside</check>
  <check>All buttons are 44px height minimum</check>
  <check>Long text truncates properly in cards</check>
  <check>FAB (z-40) does not overlap modals (z-50)</check>
  <check>No hardcoded colors remain</check>
</verification>

<output_format>
  After completing all fixes, provide a summary:
  - Files modified
  - Issues fixed per file
  - Any issues that could not be fixed and why
</output_format>
```
