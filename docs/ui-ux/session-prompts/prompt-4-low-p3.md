# Prompt 4: P3 Low Priority Issues (15 fixes)

Copy and paste this prompt into a new Claude Code session:

---

```xml
<context>
  <project>Crispy CRM - React Admin + shadcn/ui + Supabase</project>
  <session>UI/UX Remediation - P3 Low Priority (Final Polish)</session>
  <fix-guide>/home/krwhynot/projects/crispy-crm/docs/ui-ux/shadcn-mcp-fix-guide.md</fix-guide>
  <prerequisite>P0, P1, P2 issues should be complete</prerequisite>
</context>

<objective>
Fix 15 LOW PRIORITY (P3) polish and consistency issues.
Target: Score improvement from 9.7 → 10.0/10 (PERFECT)
</objective>

<design-rules>
- Breakpoints: Desktop-first (lg:, md:) NOT mobile-first (sm:)
- Colors: Semantic tokens only (bg-overlay, NOT bg-black/80)
- Z-index: Standard scale (z-10, z-20, z-30, z-40, z-50)
- i18n: All user-facing strings through translation
- RTL: dir="auto" on text inputs
</design-rules>

<issues priority="P3-LOW" count="15">
  <!-- Desktop-First Breakpoints (3 issues) -->
  <batch name="breakpoints">
    <issue id="P3-1" file="alert-dialog.tsx:47,53">
      Change sm: breakpoints to desktop-first pattern
    </issue>
    <issue id="P3-2" file="dialog.tsx:72,82">
      Change footer layout to desktop-first
    </issue>
    <issue id="P3-4" file="Sheet.tsx:56">
      Change sm:max-w-sm to desktop-first
    </issue>
    <mcp-query>Show me shadcn dialog/sheet responsive footer patterns using desktop-first breakpoints</mcp-query>
  </batch>

  <!-- Semantic Color Tokens (4 issues) -->
  <batch name="colors">
    <issue id="P3-3" file="drawer.tsx:30">
      Change bg-black/80 to bg-overlay semantic token
    </issue>
    <issue id="P3-7" file="TutorialProvider.tsx:126">
      Replace rgba() with semantic color token
    </issue>
    <issue id="P3-8" file="OpportunityCreateFormTutorial.tsx:65">
      Replace rgba() with semantic color token
    </issue>
    <issue id="P3-14" file="Stories/Header.tsx:25, Page.tsx:64">
      Replace #FFF, #999 with semantic tokens
    </issue>
    <mcp-query>Show me shadcn overlay and tooltip color tokens for consistent theming</mcp-query>
  </batch>

  <!-- Z-Index Standardization (1 issue) -->
  <batch name="z-index">
    <issue id="P3-5" file="navigation-menu.tsx:137">
      Change z-[1] to z-10
    </issue>
    <mcp-query>What z-index does shadcn navigation-menu indicator use?</mcp-query>
  </batch>

  <!-- Spacing Polish (1 issue) -->
  <batch name="spacing">
    <issue id="P3-6" file="ContactHierarchyBreadcrumb.tsx:33">
      Change gap-0.5 to gap-2
    </issue>
    <mcp-query>Show me shadcn breadcrumb spacing patterns</mcp-query>
  </batch>

  <!-- Component Polish (2 issues) -->
  <batch name="components">
    <issue id="P3-9" file="Combobox.tsx">
      Add max-h-* constraint to CommandList
    </issue>
    <issue id="P3-13" file="Stories/Header.tsx:45,49,50">
      Replace size="small" with standard variant
    </issue>
    <mcp-query>Show me shadcn combobox list height and button size variants</mcp-query>
  </batch>

  <!-- i18n (3 issues) -->
  <batch name="i18n">
    <issue id="P3-10" file="number-input.tsx">
      Use locale-aware parseFloat for decimal handling
    </issue>
    <issue id="P3-11" file="formatRelativeTime.ts">
      Replace hardcoded "ago", "in" with i18n translation keys
    </issue>
    <issue id="P3-12" file="OpportunityCard date format">
      Use locale-aware date formatting
    </issue>
    <mcp-query>Show me shadcn date-picker and calendar i18n patterns</mcp-query>
  </batch>

  <!-- RTL Support (1 issue) -->
  <batch name="rtl">
    <issue id="P3-15" file="Multiple input components">
      Add dir="auto" attribute for bidirectional text
    </issue>
    <mcp-query>Show me shadcn input RTL/bidirectional text support patterns</mcp-query>
  </batch>
</issues>

<workflow>
1. Desktop-first and colors are highest impact
2. i18n batch requires checking translation system
3. RTL can be done last as enhancement
4. Update fix guide checkboxes after each batch
</workflow>

<success-criteria>
- [ ] All sm: breakpoints converted to desktop-first
- [ ] No hardcoded rgba() or hex colors
- [ ] No z-[1] or z-[9999]
- [ ] All spacing ≥ gap-2
- [ ] Combobox has scroll limit
- [ ] Dates/numbers use locale formatting
- [ ] Text inputs support RTL
</success-criteria>

<final-verification>
After all P3 issues fixed:
1. Run full UI audit verification
2. Update executive summary score
3. Test with VoiceOver/NVDA
4. Celebrate 10/10 score! 🎉
</final-verification>
```

---

## Estimated Time: 2-3 hours
## Score Impact: +0.3 points (9.7 → 10.0)
