# Session B: Navigation & Menus

**Run in parallel with:** Sessions A, C, D
**Files are isolated - no merge conflicts**

---

Copy everything below into a fresh Claude Code session:

```xml
<context>
  <project>Crispy CRM - React 19 + TypeScript + React Admin + Supabase</project>
  <session>Parallel Session B: Navigation & Menu Components</session>
  <purpose>Fix 16 WCAG accessibility and UX violations in navigation/menu files</purpose>
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
    - "Show me shadcn navigation-menu trigger with focus ring"
    - "Show me shadcn dropdown-menu accessibility patterns"
    - "Show me shadcn popover with Radix focus management"
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
  <file>src/atomic-crm/layout/Header.tsx</file>
  <file>src/atomic-crm/utils/contextMenu.tsx</file>
  <file>src/components/ui/sidebar.tsx</file>
  <file>src/components/ui/navigation-menu.tsx</file>
  <file>src/components/ui/breadcrumb.tsx</file>
  <file>src/components/admin/columns-button.tsx</file>
  <file>src/components/admin/theme-mode-toggle.tsx</file>
  <file>src/components/admin/locales-menu-button.tsx</file>
  <file>src/components/admin/user-menu.tsx</file>
</files_owned>

<design_guidelines>
  <rule name="touch_targets">44px minimum height/width (use h-11, min-h-11, size-11)</rule>
  <rule name="focus">All interactive elements: focus-visible:ring-2 focus-visible:ring-ring</rule>
  <rule name="z_index">Standard scale ONLY: z-10, z-20, z-30, z-40, z-50 (NEVER z-[9999] or z-[1])</rule>
  <rule name="modal_prop">DropdownMenu must use modal={true} (default) for proper focus trapping</rule>
  <rule name="portals">Use Radix Popover/Dialog portals, NOT manual createPortal</rule>
</design_guidelines>

<constraints>
  <do_not>Modify any files not listed in files_owned</do_not>
  <do_not>Use arbitrary z-index like z-[9999] or z-[1]</do_not>
  <do_not>Use modal={false} on dropdown menus (breaks accessibility)</do_not>
  <do_not>Use manual createPortal when Radix components exist</do_not>
  <do_not>Skip querying shadcn MCP - always check the pattern first</do_not>
  <do_not>Assume file contents - read each file before editing</do_not>
</constraints>

<issues count="16">
  <file_group name="Header.tsx" issues="2" priority="P1">
    <mcp_query>Show me shadcn navigation-menu trigger with focus ring and 44px height</mcp_query>
    <issue lines="130-141">Add min-h-11 to NavigationTab component</issue>
    <issue lines="130-141">Add focus-visible:ring-2 focus-visible:ring-ring</issue>
  </file_group>

  <file_group name="contextMenu.tsx" issues="3" priority="P1">
    <mcp_query>Show me shadcn context-menu item sizing and z-index values</mcp_query>
    <issue line="94">Add min-h-11 to main menu items</issue>
    <issue line="138">Add min-h-11 to submenu items</issue>
    <issue line="82">Change z-[9999] to z-50</issue>
  </file_group>

  <file_group name="sidebar.tsx" issues="2" priority="P1">
    <mcp_query>Show me shadcn sidebar menu button and input sizing patterns</mcp_query>
    <issue line="446">Change sm variant h-7 to min-h-11</issue>
    <issue line="294">Change SidebarInput h-8 to h-11</issue>
  </file_group>

  <file_group name="columns-button.tsx" issues="3" priority="P0">
    <mcp_query>Show me shadcn popover component implementation with proper Radix focus management</mcp_query>
    <issue line="86">Refactor createPortal to use Radix Popover component</issue>
    <issue line="170">Change clear button h-4 w-4 to h-11 w-11</issue>
    <issue line="86">Remove forceMount prop if present</issue>
  </file_group>

  <file_group name="navigation-menu.tsx" issues="1" priority="P3">
    <mcp_query>What z-index does shadcn navigation-menu indicator use?</mcp_query>
    <issue line="137">Change z-[1] to z-10</issue>
  </file_group>

  <file_group name="breadcrumb.tsx" issues="1" priority="P2">
    <mcp_query>Show me shadcn breadcrumb link focus styles</mcp_query>
    <issue line="46">Add focus-visible:ring-2 focus-visible:ring-ring to BreadcrumbLink</issue>
  </file_group>

  <file_group name="theme-mode-toggle.tsx" issues="1" priority="P1">
    <mcp_query>Show me shadcn dropdown-menu accessibility - should modal be true or false?</mcp_query>
    <issue line="50">Remove modal={false} prop (use default modal={true})</issue>
  </file_group>

  <file_group name="locales-menu-button.tsx" issues="1" priority="P1">
    <mcp_query>Show me shadcn dropdown-menu modal prop best practices</mcp_query>
    <issue line="29">Remove modal={false} prop (use default modal={true})</issue>
  </file_group>

  <file_group name="user-menu.tsx" issues="1" priority="P2">
    <mcp_query>When should I use forceMount on shadcn dropdown-menu?</mcp_query>
    <issue line="48">Remove forceMount prop unless needed for entry animation</issue>
  </file_group>
</issues>

<verification>
  <check>All nav items show focus ring when tabbed to</check>
  <check>All menu items are 44px height minimum</check>
  <check>columns-button uses Radix Popover (no manual createPortal)</check>
  <check>grep -r "z-\[" returns NO matches in owned files</check>
  <check>grep -r "modal={false}" returns NO matches in owned files</check>
  <check>Clear button in columns-button is 44px</check>
</verification>

<output_format>
  After completing all fixes, provide a summary:
  - Files modified
  - Issues fixed per file
  - Any issues that could not be fixed and why
</output_format>
```
