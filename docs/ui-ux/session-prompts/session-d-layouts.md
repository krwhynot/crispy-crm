# Session D: Lists & Layouts

**Run in parallel with:** Sessions A, B, C
**Files are isolated - no merge conflicts**

---

Copy everything below into a fresh Claude Code session:

```xml
<context>
  <project>Crispy CRM - React 19 + TypeScript + React Admin + Supabase</project>
  <session>Parallel Session D: List, Layout & Utility Components</session>
  <purpose>Fix 12 layout, overflow, and i18n violations in list/layout files</purpose>
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
    - "Show me shadcn table cell text truncation patterns"
    - "Show me shadcn scroll-area for long content"
    - "Show me shadcn tabs lazy loading vs forceMount"
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
  <file>src/atomic-crm/contacts/ContactList.tsx</file>
  <file>src/atomic-crm/contacts/ContactDetailsTab.tsx</file>
  <file>src/atomic-crm/contacts/ContactHierarchyBreadcrumb.tsx</file>
  <file>src/atomic-crm/organizations/OrganizationList.tsx</file>
  <file>src/components/layouts/StandardListLayout.tsx</file>
  <file>src/components/layouts/ResourceSlideOver.tsx</file>
  <file>src/atomic-crm/dashboard/v3/components/KPISummaryRow.tsx</file>
  <file>src/atomic-crm/dashboard/v3/components/DashboardTabPanel.tsx</file>
  <file>src/atomic-crm/utils/formatRelativeTime.ts</file>
  <file>src/stories/Header.tsx</file>
  <file>src/stories/Page.tsx</file>
  <file>src/atomic-crm/shared/TutorialProvider.tsx</file>
  <file>src/atomic-crm/opportunities/OpportunityCreateFormTutorial.tsx</file>
</files_owned>

<design_guidelines>
  <rule name="spacing">gap-2 minimum (NEVER gap-1, gap-0.5)</rule>
  <rule name="colors">Semantic tokens ONLY (NEVER rgba() or hex like #FFF, #999)</rule>
  <rule name="truncation">Long text must truncate with "truncate" class + max-w-*</rule>
  <rule name="scrollable">Long content sections need max-h-* overflow-y-auto</rule>
  <rule name="lazy_loading">Prefer lazy loading over forceMount for tabs</rule>
  <rule name="i18n">User-facing strings should use translation keys, not hardcoded</rule>
</design_guidelines>

<constraints>
  <do_not>Modify any files not listed in files_owned</do_not>
  <do_not>Use gap-1 or gap-0.5 (minimum is gap-2)</do_not>
  <do_not>Use hardcoded colors like rgba(), #FFF, #999</do_not>
  <do_not>Use forceMount on tabs unless animation requires it</do_not>
  <do_not>Skip querying shadcn MCP - always check the pattern first</do_not>
  <do_not>Assume file contents - read each file before editing</do_not>
</constraints>

<issues count="12">
  <file_group name="ContactList.tsx" issues="1" priority="P1">
    <mcp_query>Show me shadcn table cell text truncation patterns</mcp_query>
    <issue line="126">Add truncate and max-w-[200px] to formatFullName output</issue>
  </file_group>

  <file_group name="ContactDetailsTab.tsx" issues="1" priority="P1">
    <mcp_query>Show me shadcn scroll-area for long content sections</mcp_query>
    <issue line="215">Add max-h-96 overflow-y-auto to notes section</issue>
  </file_group>

  <file_group name="ContactHierarchyBreadcrumb.tsx" issues="1" priority="P3">
    <mcp_query>Show me shadcn breadcrumb spacing patterns</mcp_query>
    <issue line="33">Change gap-0.5 to gap-2</issue>
  </file_group>

  <file_group name="OrganizationList.tsx" issues="1" priority="P2">
    <mcp_query>Show me shadcn table column text overflow handling</mcp_query>
    <issue line="150">Add truncate class to organization name column</issue>
  </file_group>

  <file_group name="StandardListLayout.tsx" issues="1" priority="P1">
    <mcp_query>Show me shadcn layout patterns with min-width constraints</mcp_query>
    <issue line="180">Add min-w-[600px] to main content area</issue>
  </file_group>

  <file_group name="ResourceSlideOver.tsx" issues="3" priority="P2">
    <mcp_query>Show me shadcn sheet header and tabs spacing patterns</mcp_query>
    <issue line="188">Change gap-1 to gap-2 in header</issue>
    <issue line="241">Change gap-1 to gap-2 in TabsList</issue>
    <issue line="252">Change gap-1 to gap-2 in TabsTrigger</issue>
  </file_group>

  <file_group name="KPISummaryRow.tsx" issues="1" priority="P2">
    <mcp_query>Show me shadcn responsive grid patterns for dashboard KPIs</mcp_query>
    <issue>Add md: responsive breakpoints for tablet layout</issue>
  </file_group>

  <file_group name="DashboardTabPanel.tsx" issues="1" priority="P2">
    <mcp_query>Show me shadcn tabs lazy loading vs forceMount patterns</mcp_query>
    <issue lines="102-138">Remove forceMount from all tabs, implement lazy loading</issue>
  </file_group>

  <file_group name="formatRelativeTime.ts" issues="1" priority="P3">
    <mcp_query>How do shadcn examples handle relative time i18n?</mcp_query>
    <issue>Replace hardcoded "ago", "in", etc. with i18n translation keys</issue>
  </file_group>

  <file_group name="Stories files" issues="1" priority="P3">
    <mcp_query>Show me shadcn color tokens for storybook backgrounds</mcp_query>
    <issue>Header.tsx:25,45,49,50 and Page.tsx:64 - Replace #FFF, #999, size="small" with semantic tokens and default size</issue>
  </file_group>

  <file_group name="Tutorial files" issues="1" priority="P3">
    <mcp_query>Show me shadcn tooltip/popover background color patterns</mcp_query>
    <issue>TutorialProvider.tsx:126 and OpportunityCreateFormTutorial.tsx:65 - Replace rgba() with semantic tokens</issue>
  </file_group>
</issues>

<verification>
  <check>Long names in ContactList and OrganizationList truncate with ellipsis</check>
  <check>Notes section in ContactDetailsTab scrolls when content is long</check>
  <check>grep -r "gap-1[^0-9]" in owned files returns NO matches</check>
  <check>grep -r "gap-0.5" in owned files returns NO matches</check>
  <check>grep -r "rgba\|#[0-9A-Fa-f]" in owned files returns NO matches</check>
  <check>Dashboard tabs lazy load (no forceMount)</check>
  <check>KPI row is responsive on tablet viewport</check>
</verification>

<output_format>
  After completing all fixes, provide a summary:
  - Files modified
  - Issues fixed per file
  - Any issues that could not be fixed and why
</output_format>
```
