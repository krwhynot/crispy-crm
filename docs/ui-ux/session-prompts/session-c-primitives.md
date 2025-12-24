# Session C: UI Primitives & Inputs

**Run in parallel with:** Sessions A, B, D
**Files are isolated - no merge conflicts**

---

Copy everything below into a fresh Claude Code session:

```xml
<context>
  <project>Crispy CRM - React 19 + TypeScript + React Admin + Supabase</project>
  <session>Parallel Session C: UI Primitives & Input Components</session>
  <purpose>Fix 17 design system and accessibility violations in base UI components</purpose>
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
    - "Show me shadcn button internal spacing between icon and text"
    - "Show me shadcn calendar day cell sizing for touch targets"
    - "Show me shadcn dialog responsive breakpoint patterns"
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
  <file>src/components/ui/button.constants.ts</file>
  <file>src/components/ui/badge.constants.ts</file>
  <file>src/components/ui/calendar.tsx</file>
  <file>src/components/ui/dialog.tsx</file>
  <file>src/components/ui/alert-dialog.tsx</file>
  <file>src/components/ui/sheet.tsx</file>
  <file>src/components/ui/drawer.tsx</file>
  <file>src/components/admin/select-input.tsx</file>
  <file>src/components/admin/boolean-input.tsx</file>
  <file>src/components/admin/radio-button-group-input.tsx</file>
  <file>src/components/admin/number-input.tsx</file>
  <file>src/atomic-crm/shared/Avatar.tsx</file>
  <file>src/atomic-crm/shared/Combobox.tsx</file>
</files_owned>

<design_guidelines>
  <rule name="touch_targets">44px minimum height (use h-11, min-h-11)</rule>
  <rule name="spacing">gap-2 minimum (NEVER gap-1, gap-0.5, or gap-1.5)</rule>
  <rule name="breakpoints">Desktop-first: use lg: or md: (NEVER sm: mobile-first)</rule>
  <rule name="colors">Semantic tokens ONLY: bg-background, bg-overlay (NEVER bg-black/80 or hex)</rule>
  <rule name="skeletons">Loading skeletons must match input height: h-11</rule>
</design_guidelines>

<constraints>
  <do_not>Modify any files not listed in files_owned</do_not>
  <do_not>Use gap-1, gap-0.5, or gap-1.5 (minimum is gap-2)</do_not>
  <do_not>Use sm: breakpoints (use desktop-first with lg: or md:)</do_not>
  <do_not>Use hardcoded colors like bg-black/80 or hex values</do_not>
  <do_not>Skip querying shadcn MCP - always check the pattern first</do_not>
  <do_not>Assume file contents - read each file before editing</do_not>
</constraints>

<issues count="17">
  <file_group name="button.constants.ts" issues="1" priority="P2">
    <mcp_query>Show me shadcn button internal spacing between icon and text</mcp_query>
    <issue line="29">Change gap-1.5 to gap-2</issue>
  </file_group>

  <file_group name="badge.constants.ts" issues="1" priority="P2">
    <mcp_query>Show me shadcn badge spacing patterns</mcp_query>
    <issue line="12">Change gap-1 to gap-2</issue>
  </file_group>

  <file_group name="calendar.tsx" issues="1" priority="P2">
    <mcp_query>Show me shadcn calendar day cell sizing for 44px touch targets</mcp_query>
    <issue line="27">Increase --cell-size CSS variable to 44px</issue>
  </file_group>

  <file_group name="dialog.tsx" issues="1" priority="P3">
    <mcp_query>Show me shadcn dialog footer layout using desktop-first breakpoints</mcp_query>
    <issue lines="72,82">Change sm: breakpoints to desktop-first (lg: or base with lg:reverse)</issue>
  </file_group>

  <file_group name="alert-dialog.tsx" issues="1" priority="P3">
    <mcp_query>Show me shadcn alert-dialog responsive footer patterns</mcp_query>
    <issue lines="47,53">Change sm: breakpoints to desktop-first pattern</issue>
  </file_group>

  <file_group name="sheet.tsx" issues="1" priority="P3">
    <mcp_query>Show me shadcn sheet width responsive patterns</mcp_query>
    <issue line="56">Change sm:max-w-sm to desktop-first breakpoint</issue>
  </file_group>

  <file_group name="drawer.tsx" issues="1" priority="P3">
    <mcp_query>Show me shadcn drawer overlay color tokens</mcp_query>
    <issue line="30">Change bg-black/80 to bg-background/80 or semantic overlay token</issue>
  </file_group>

  <file_group name="select-input.tsx" issues="1" priority="P1">
    <mcp_query>Show me shadcn skeleton component sizing for form inputs</mcp_query>
    <issue line="184">Change loading skeleton h-9 to h-11</issue>
  </file_group>

  <file_group name="boolean-input.tsx" issues="1" priority="P2">
    <mcp_query>Show me shadcn switch readOnly and disabled patterns</mcp_query>
    <issue>Implement readOnly behavior - prevent toggle when readOnly prop is true</issue>
  </file_group>

  <file_group name="radio-button-group-input.tsx" issues="1" priority="P2">
    <mcp_query>Show me shadcn skeleton sizing for radio button groups</mcp_query>
    <issue line="94">Change skeleton h-9 to h-11</issue>
  </file_group>

  <file_group name="number-input.tsx" issues="1" priority="P3">
    <mcp_query>Show me shadcn input patterns for i18n number handling</mcp_query>
    <issue>Use Intl.NumberFormat for locale-aware parsing instead of parseFloat</issue>
  </file_group>

  <file_group name="Avatar.tsx" issues="1" priority="P2">
    <mcp_query>Show me shadcn avatar fallback for emoji-safe initials</mcp_query>
    <issue>Fix charAt(0) - use Array.from(name)[0] for emoji-safe first character</issue>
  </file_group>

  <file_group name="Combobox.tsx" issues="1" priority="P3">
    <mcp_query>Show me shadcn combobox command-list height constraints</mcp_query>
    <issue>Add max-h-60 or max-h-80 to CommandList to prevent overflow</issue>
  </file_group>

  <file_group name="Multiple input components" issues="1" priority="P3">
    <mcp_query>Show me shadcn input RTL/bidirectional text support</mcp_query>
    <issue>Add dir="auto" attribute to text inputs for RTL language support</issue>
  </file_group>
</issues>

<verification>
  <check>grep -r "gap-1[^0-9]" in owned files returns NO matches</check>
  <check>grep -r "gap-1.5" in owned files returns NO matches</check>
  <check>Calendar day cells are 44px touch targets</check>
  <check>grep -r "sm:" in dialog/sheet files - should use lg: instead</check>
  <check>Drawer overlay uses semantic color (no bg-black)</check>
  <check>All loading skeletons are h-11</check>
  <check>Avatar handles emoji names correctly (test with "🎄 Test User")</check>
</verification>

<output_format>
  After completing all fixes, provide a summary:
  - Files modified
  - Issues fixed per file
  - Any issues that could not be fixed and why
</output_format>
```
