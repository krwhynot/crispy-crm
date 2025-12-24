# shadcn MCP Fix Guide - Complete Audit Remediation

**Generated:** 2025-12-23
**Total Issues:** 60 remaining (down from 93)
**Estimated Time:** 21-29 hours total

---

## How to Use This Guide

1. **Restart Claude Code** to activate the shadcn MCP server
2. **Run `/mcp`** to verify `shadcn` is Connected
3. **Pick an issue** from the priority sections below
4. **Copy the MCP Query** and paste it to Claude
5. **Apply the fix** based on MCP response
6. **Update the checkbox** when done

---

## CRITICAL PRIORITY (P0) - 5 Issues - Fix Immediately

### P0-1: ColumnCustomizationMenu Button 32px
| Detail | Value |
|--------|-------|
| **File** | `src/atomic-crm/opportunities/kanban/ColumnCustomizationMenu.tsx:44` |
| **Issue** | Settings button `h-8 w-8` = 32px (violates 44px minimum) |
| **WCAG** | 2.5.5 Target Size |
| **Fix** | Change to `h-11 w-11` |
| **Effort** | 5 min |

**MCP Query:**
```
Show me the shadcn button component with icon size variant.
I need the correct sizing for a 44px touch target icon button.
```

- [x] Fixed ✅ (Verified 2025-12-24: Line 54 has `h-11 w-11` = 44px)

---

### P0-2: QuickAddOpportunity Missing ESC Handler
| Detail | Value |
|--------|-------|
| **File** | `src/atomic-crm/opportunities/kanban/QuickAddOpportunity.tsx:102` |
| **Issue** | Keyboard users cannot dismiss dialog with ESC key |
| **WCAG** | 2.1.1 Keyboard |
| **Fix** | Add useEffect ESC key listener or use Radix Dialog |
| **Effort** | 10 min |

**MCP Query:**
```
Show me shadcn dialog or popover patterns that include proper ESC key
dismissal. I have a custom modal that needs keyboard navigation support.
```

- [x] Fixed ✅ (Verified 2025-12-24: Lines 92-98 have useEffect ESC handler)

---

### P0-3: QuickAddOpportunity Missing Close Button
| Detail | Value |
|--------|-------|
| **File** | `src/atomic-crm/opportunities/kanban/QuickAddOpportunity.tsx:102` |
| **Issue** | No X button in modal header - UX convention violation |
| **Fix** | Add 44x44px close button in top-right corner |
| **Effort** | 10 min |

**MCP Query:**
```
Show me the shadcn dialog component with DialogClose button.
I need the correct close button implementation with 44px touch target.
```

- [x] Fixed ✅ (Verified 2025-12-24: Lines 119-126 have X button with `h-11 w-11`)

---

### P0-4: QuickAddOpportunity No Click-Outside
| Detail | Value |
|--------|-------|
| **File** | `src/atomic-crm/opportunities/kanban/QuickAddOpportunity.tsx:106` |
| **Issue** | Modal backdrop click does not dismiss |
| **Fix** | Add click handler on backdrop or use Radix Dialog |
| **Effort** | 10 min |

**MCP Query:**
```
Show me shadcn dialog overlay implementation. I need the click-outside
dismissal pattern that Radix Dialog uses.
```

- [x] Fixed ✅ (Verified 2025-12-24: Line 116 has backdrop onClick handler)

---

### P0-5: ColumnsButton Manual Portal Bypass
| Detail | Value |
|--------|-------|
| **File** | `src/components/admin/columns-button.tsx:86` |
| **Issue** | Uses `createPortal` manually, bypassing Radix focus management |
| **Risk** | Z-index conflicts, broken focus traps |
| **Fix** | Refactor to use standard Radix Popover pattern |
| **Effort** | 30 min |

**MCP Query:**
```
Show me the shadcn popover component implementation. I need to refactor
a custom portal to use proper Radix Popover with focus management.
```

- [x] Fixed ✅ (Verified 2025-12-24: Uses Radix `<Popover>` components at lines 67-88)

---

## HIGH PRIORITY (P1) - 17 Issues - Fix This Sprint

### P1-1: Header NavigationTab < 44px
| Detail | Value |
|--------|-------|
| **File** | `src/atomic-crm/layout/Header.tsx:130-141` |
| **Issue** | NavigationTab uses `py-3` (~36px) without min-height |
| **Fix** | Add `min-h-11` to class |
| **Effort** | 5 min |

**MCP Query:**
```
Show me shadcn navigation-menu trigger sizing. I need the correct
classes for 44px minimum touch targets on navigation tabs.
```

- [ ] Fixed

---

### P1-2: Header NavigationTab No Focus Ring
| Detail | Value |
|--------|-------|
| **File** | `src/atomic-crm/layout/Header.tsx:130-141` |
| **Issue** | No focus ring styles defined |
| **Fix** | Add `focus-visible:ring-2 focus-visible:ring-ring` |
| **Effort** | 5 min |

**MCP Query:**
```
Show me the shadcn button or link focus ring pattern. I need the
standard focus-visible classes for interactive navigation elements.
```

- [ ] Fixed

---

### P1-3: Sidebar sm Variant h-7 (28px)
| Detail | Value |
|--------|-------|
| **File** | `src/components/ui/sidebar.tsx:446` |
| **Issue** | `sm: "h-7 text-xs"` = 28px (violates 44px) |
| **Fix** | Change to `min-h-11` or remove variant entirely |
| **Effort** | 5 min |

**MCP Query:**
```
Show me the shadcn sidebar component size variants. What's the
recommended minimum height for sidebar menu buttons?
```

- [ ] Fixed

---

### P1-4: contextMenu Main Items < 44px
| Detail | Value |
|--------|-------|
| **File** | `src/atomic-crm/utils/contextMenu.tsx:94` |
| **Issue** | Menu items use `py-3` (~36px) without min-height |
| **Fix** | Add `min-h-11` |
| **Effort** | 5 min |

**MCP Query:**
```
Show me shadcn context-menu or dropdown-menu item sizing. I need
the correct padding and min-height for 44px touch targets.
```

- [ ] Fixed

---

### P1-5: contextMenu Submenu Items < 44px
| Detail | Value |
|--------|-------|
| **File** | `src/atomic-crm/utils/contextMenu.tsx:138` |
| **Issue** | Submenu items `py-1.5` = ~32px |
| **Fix** | Add `min-h-11` |
| **Effort** | 5 min |

**MCP Query:**
```
Show me shadcn dropdown-menu sub-trigger and sub-content patterns.
I need proper sizing for submenu items.
```

- [ ] Fixed

---

### P1-6: ColumnsButton Clear Button 16px
| Detail | Value |
|--------|-------|
| **File** | `src/components/admin/columns-button.tsx:170` |
| **Issue** | Clear button `h-4 w-4` = 16px |
| **Fix** | Change to `h-11 w-11` with position adjustments |
| **Effort** | 10 min |

**MCP Query:**
```
Show me shadcn button icon patterns for small action buttons.
How do I make a 44px touch target that looks compact visually?
```

- [ ] Fixed

---

### P1-7: QuickAddOpportunity Buttons Not 44px
| Detail | Value |
|--------|-------|
| **File** | `src/atomic-crm/opportunities/kanban/QuickAddOpportunity.tsx:167-191` |
| **Issue** | Cancel and Create buttons lack explicit `h-11` |
| **Fix** | Add `h-11` class to both buttons |
| **Effort** | 5 min |

**MCP Query:**
```
Show me shadcn button default sizing. What classes ensure
44px minimum height for form action buttons?
```

- [ ] Fixed

---

### P1-8: ProductList Popover Button No Size
| Detail | Value |
|--------|-------|
| **File** | `src/atomic-crm/products/ProductList.tsx:57-60` |
| **Issue** | Popover trigger button missing explicit size |
| **Fix** | Add `h-11` or `size="default"` |
| **Effort** | 5 min |

**MCP Query:**
```
Show me shadcn popover trigger button patterns. I need the
correct button sizing for popover triggers.
```

- [ ] Fixed

---

### P1-9: select-input.tsx Loading Skeleton 36px
| Detail | Value |
|--------|-------|
| **File** | `src/components/admin/select-input.tsx:184` |
| **Issue** | Loading skeleton `h-9` = 36px |
| **Fix** | Change to `h-11` |
| **Effort** | 5 min |

**MCP Query:**
```
Show me shadcn skeleton component. What height should loading
skeletons be for form inputs (44px minimum)?
```

- [ ] Fixed

---

### P1-10: ContactList Name No Truncation
| Detail | Value |
|--------|-------|
| **File** | `src/atomic-crm/contacts/ContactList.tsx:126` |
| **Issue** | `formatFullName()` output has no truncation |
| **Fix** | Add `truncate` class and `max-w-*` |
| **Effort** | 10 min |

**MCP Query:**
```
Show me shadcn table cell patterns for text truncation.
I need proper overflow handling for long names in lists.
```

- [ ] Fixed

---

### P1-11: ContactDetailsTab Notes No Max-Height
| Detail | Value |
|--------|-------|
| **File** | `src/atomic-crm/contacts/ContactDetailsTab.tsx:215` |
| **Issue** | Notes `whitespace-pre-wrap` has no max-height |
| **Fix** | Add `max-h-96 overflow-y-auto` |
| **Effort** | 5 min |

**MCP Query:**
```
Show me shadcn scroll-area component. I need scrollable
content areas with max-height constraints.
```

- [ ] Fixed

---

### P1-12: theme-mode-toggle modal={false}
| Detail | Value |
|--------|-------|
| **File** | `src/components/admin/theme-mode-toggle.tsx:50` |
| **Issue** | `modal={false}` disables focus management |
| **Fix** | Remove `modal={false}` prop |
| **Effort** | 2 min |

**MCP Query:**
```
Show me shadcn dropdown-menu focus management. Should I use
modal={true} or modal={false} for accessibility?
```

- [ ] Fixed

---

### P1-13: locales-menu-button modal={false}
| Detail | Value |
|--------|-------|
| **File** | `src/components/admin/locales-menu-button.tsx:29` |
| **Issue** | `modal={false}` disables focus management |
| **Fix** | Remove `modal={false}` prop |
| **Effort** | 2 min |

**MCP Query:**
```
Show me shadcn dropdown-menu accessibility patterns. What's the
correct modal prop setting for language/locale menus?
```

- [ ] Fixed

---

### P1-14: StandardListLayout Missing min-w
| Detail | Value |
|--------|-------|
| **File** | `src/components/layouts/StandardListLayout.tsx:180` |
| **Issue** | No min-width constraint on main content |
| **Fix** | Add `min-w-[600px]` or similar |
| **Effort** | 5 min |

**MCP Query:**
```
Show me shadcn layout patterns for responsive main content areas.
I need min-width constraints to prevent content collapse.
```

- [ ] Fixed

---

### P1-15: AddTask Invalid max-h-9/10 Class
| Detail | Value |
|--------|-------|
| **File** | `src/atomic-crm/tasks/AddTask.tsx` |
| **Issue** | `max-h-9/10` is invalid Tailwind CSS |
| **Fix** | Change to `max-h-[90vh]` |
| **Effort** | 2 min |

**MCP Query:**
```
Show me shadcn dialog sizing patterns. What's the correct
max-height class for modal dialogs (90vh)?
```

- [ ] Fixed

---

### P1-16: LogActivityFAB z-50 Conflict
| Detail | Value |
|--------|-------|
| **File** | `src/atomic-crm/dashboard/v3/components/LogActivityFAB.tsx` |
| **Issue** | FAB button `z-50` conflicts with Sheet `z-50` |
| **Fix** | Change FAB to `z-40` |
| **Effort** | 2 min |

**MCP Query:**
```
What z-index values does shadcn use? I need the recommended
z-index scale for FABs vs modal overlays.
```

- [ ] Fixed

---

### P1-17: SimilarOpportunitiesDialog Non-Standard CSS Var
| Detail | Value |
|--------|-------|
| **File** | `src/atomic-crm/opportunities/components/SimilarOpportunitiesDialog.tsx:111` |
| **Issue** | Uses `var(--text-on-color)` not in design system |
| **Fix** | Use `text-foreground` or `text-primary-foreground` |
| **Effort** | 5 min |

**MCP Query:**
```
Show me shadcn color tokens and CSS variables. What semantic
color classes should I use for text on colored backgrounds?
```

- [ ] Fixed

---

## MEDIUM PRIORITY (P2) - 23 Issues - Fix Next Sprint

### P2-1: ColumnCustomizationMenu Missing ESC Handler
| File | `ColumnCustomizationMenu.tsx:23-36` |
| Fix | Add useEffect ESC key listener |

**MCP Query:** `Show me keyboard event handling patterns in shadcn popover`

- [ ] Fixed

---

### P2-2: button.constants.ts gap-1.5 < gap-2
| File | `button.constants.ts:29` |
| Fix | Change `gap-1.5` to `gap-2` |

**MCP Query:** `Show me shadcn button internal spacing. What gap should be between icon and text?`

- [ ] Fixed

---

### P2-3: ResourceSlideOver gap-1 in Header
| File | `ResourceSlideOver.tsx:188` |
| Fix | Change `gap-1` to `gap-2` |

**MCP Query:** `Show me shadcn sheet header patterns with proper spacing`

- [ ] Fixed

---

### P2-4: ResourceSlideOver gap-1 in TabsList
| File | `ResourceSlideOver.tsx:241` |
| Fix | Change `gap-1` to `gap-2` |

**MCP Query:** `Show me shadcn tabs spacing patterns`

- [ ] Fixed

---

### P2-5: ResourceSlideOver gap-1 in TabsTrigger
| File | `ResourceSlideOver.tsx:252` |
| Fix | Change `gap-1` to `gap-2` |

**MCP Query:** `Show me shadcn tabs trigger internal spacing`

- [ ] Fixed

---

### P2-6: badge.constants.ts gap-1
| File | `badge.constants.ts:12` |
| Fix | Change `gap-1` to `gap-2` |

**MCP Query:** `Show me shadcn badge spacing between icon and text`

- [ ] Fixed

---

### P2-7: calendar.tsx 32px Day Cells
| File | `calendar.tsx:27` |
| Fix | Increase `--cell-size` to 44px |

**MCP Query:** `Show me shadcn calendar day cell sizing for touch targets`

- [ ] Fixed

---

### P2-8: breadcrumb.tsx BreadcrumbLink No Focus Ring
| File | `breadcrumb.tsx:46` |
| Fix | Add focus-visible styles |

**MCP Query:** `Show me shadcn breadcrumb link focus patterns`

- [ ] Fixed

---

### P2-9: sidebar.tsx SidebarInput h-8
| File | `sidebar.tsx:294` |
| Fix | Change to `h-11` |

**MCP Query:** `Show me shadcn sidebar input sizing`

- [ ] Fixed

---

### P2-10: contextMenu.tsx z-[9999] (if still present)
| File | `contextMenu.tsx:82` |
| Fix | Change to `z-50` |

**MCP Query:** `What z-index does shadcn context-menu use?`

- [ ] Fixed

---

### P2-11: columns-button.tsx forceMount
| File | `columns-button.tsx:86` |
| Fix | Remove `forceMount` if not needed |

**MCP Query:** `When should I use forceMount on shadcn popover?`

- [ ] Fixed

---

### P2-12: user-menu.tsx forceMount
| File | `user-menu.tsx:48` |
| Fix | Remove `forceMount` if not needed |

**MCP Query:** `When should I use forceMount on shadcn dropdown-menu?`

- [ ] Fixed

---

### P2-13: DashboardTabPanel forceMount on All Tabs
| File | `DashboardTabPanel.tsx:102-138` |
| Fix | Remove forceMount, use lazy loading |

**MCP Query:** `Show me shadcn tabs lazy loading vs forceMount patterns`

- [ ] Fixed

---

### P2-14: KPISummaryRow Missing md: Breakpoint
| File | `KPISummaryRow.tsx` |
| Fix | Add `md:` responsive breakpoints |

**MCP Query:** `Show me shadcn responsive grid patterns for dashboard KPIs`

- [ ] Fixed

---

### P2-15: Avatar.tsx charAt(0) Breaks on Emoji
| File | `Avatar.tsx` |
| Fix | Use proper grapheme handling |

**MCP Query:** `Show me shadcn avatar fallback implementation for emoji-safe initials`

- [ ] Fixed

---

### P2-16: BooleanInput readOnly Ignored
| File | `boolean-input.tsx` |
| Fix | Implement readOnly behavior |

**MCP Query:** `Show me shadcn switch readOnly or disabled patterns`

- [ ] Fixed

---

### P2-17: OpportunitySlideOverDetailsTab No Max-Height
| File | `OpportunitySlideOverDetailsTab.tsx:361,457,485` |
| Fix | Add `max-h-96 overflow-y-auto` |

**MCP Query:** `Show me shadcn scroll-area for long content sections`

- [ ] Fixed

---

### P2-18: CloseOpportunityModal X Clickable During Submit
| File | `CloseOpportunityModal.tsx` |
| Fix | Disable during submission |

**MCP Query:** `Show me shadcn dialog patterns for disabling close during form submission`

- [ ] Fixed

---

### P2-19: OpportunityCard Principal Badge No Truncation
| File | `OpportunityCard.tsx:196-197` |
| Fix | Add `truncate max-w-*` |

**MCP Query:** `Show me shadcn badge truncation patterns`

- [ ] Fixed

---

### P2-20: OpportunityCard Contact Name No Truncation
| File | `OpportunityCard.tsx:208-209` |
| Fix | Add `truncate max-w-*` |

**MCP Query:** `Show me shadcn card text truncation patterns`

- [ ] Fixed

---

### P2-21: OrganizationList Name No Truncation
| File | `OrganizationList.tsx:150` |
| Fix | Add `truncate` class |

**MCP Query:** `Show me shadcn table column text overflow handling`

- [ ] Fixed

---

### P2-22: Filtered Empty State Shows Blank
| File | `ContactList/OpportunityList` |
| Fix | Add empty state message |

**MCP Query:** `Show me shadcn empty state patterns for filtered lists`

- [ ] Fixed

---

### P2-23: radio-button-group-input Loading Skeleton 36px
| File | `radio-button-group-input.tsx:94` |
| Fix | Change `h-9` to `h-11` |

**MCP Query:** `Show me shadcn skeleton sizing for radio groups`

- [ ] Fixed

---

## LOW PRIORITY (P3) - 15 Issues - Backlog

### P3-1: alert-dialog.tsx Mobile-First sm: Breakpoints
| File | `alert-dialog.tsx:47,53` |
| Fix | Change `sm:` to desktop-first pattern |

**MCP Query:** `Show me shadcn alert-dialog footer layout - desktop-first vs mobile-first`

- [ ] Fixed

---

### P3-2: dialog.tsx Mobile-First sm: Breakpoints
| File | `dialog.tsx:72,82` |
| Fix | Change to desktop-first pattern |

**MCP Query:** `Show me shadcn dialog footer responsive patterns`

- [ ] Fixed

---

### P3-3: drawer.tsx bg-black/80 Hardcoded
| File | `drawer.tsx:30` |
| Fix | Change to `bg-overlay` semantic token |

**MCP Query:** `Show me shadcn drawer overlay color tokens`

- [ ] Fixed

---

### P3-4: sheet.tsx sm:max-w-sm Mobile-First
| File | `Sheet.tsx:56` |
| Fix | Use desktop-first breakpoints |

**MCP Query:** `Show me shadcn sheet width responsive patterns`

- [ ] Fixed

---

### P3-5: navigation-menu.tsx z-[1] Non-Standard
| File | `navigation-menu.tsx:137` |
| Fix | Change to `z-10` |

**MCP Query:** `What z-index does shadcn navigation-menu indicator use?`

- [ ] Fixed

---

### P3-6: ContactHierarchyBreadcrumb gap-0.5
| File | `ContactHierarchyBreadcrumb.tsx:33` |
| Fix | Change to `gap-2` |

**MCP Query:** `Show me shadcn breadcrumb spacing patterns`

- [ ] Fixed

---

### P3-7: TutorialProvider rgba() Hardcoded
| File | `TutorialProvider.tsx:126` |
| Fix | Use semantic color token |

**MCP Query:** `Show me shadcn color tokens for tutorial/tooltip backgrounds`

- [ ] Fixed

---

### P3-8: OpportunityCreateFormTutorial rgba() Hardcoded
| File | `OpportunityCreateFormTutorial.tsx:65` |
| Fix | Use semantic color token |

**MCP Query:** `Show me shadcn tooltip/popover background color patterns`

- [ ] Fixed

---

### P3-9: Combobox No Max-Height on CommandList
| File | `Combobox.tsx` |
| Fix | Add `max-h-*` constraint |

**MCP Query:** `Show me shadcn combobox command-list height patterns`

- [ ] Fixed

---

### P3-10: number-input.tsx parseFloat English Only
| File | `number-input.tsx` |
| Fix | Use locale-aware parsing |

**MCP Query:** `Show me shadcn input number patterns for i18n decimal handling`

- [ ] Fixed

---

### P3-11: formatRelativeTime.ts Hardcoded Strings
| File | `formatRelativeTime.ts` |
| Fix | Use i18n translation keys |

**MCP Query:** `How do shadcn examples handle relative time i18n?`

- [ ] Fixed

---

### P3-12: OpportunityCard Hardcoded Date Format
| File | `OpportunityCard date format` |
| Fix | Use locale-aware date formatting |

**MCP Query:** `Show me date formatting patterns in shadcn calendar/date-picker`

- [ ] Fixed

---

### P3-13: Stories/Header size="small" Buttons
| File | `Stories/Header.tsx:45,49,50` |
| Fix | Use standard size variant |

**MCP Query:** `Show me shadcn button size variants for Storybook`

- [ ] Fixed

---

### P3-14: Stories Hardcoded #FFF, #999
| File | `Stories/Header.tsx:25, Page.tsx:64` |
| Fix | Use semantic color tokens |

**MCP Query:** `Show me shadcn color tokens for story/demo backgrounds`

- [ ] Fixed

---

### P3-15: Input Components No dir="auto" RTL
| File | `Multiple input components` |
| Fix | Add `dir="auto"` attribute |

**MCP Query:** `Show me shadcn input RTL/bidirectional text support patterns`

- [ ] Fixed

---

## Progress Tracking

### Summary
| Priority | Total | Fixed | Remaining |
|----------|-------|-------|-----------|
| P0 Critical | 5 | **5** | **0** ✅ |
| P1 High | 17 | 0 | 17 |
| P2 Medium | 23 | 0 | 23 |
| P3 Low | 15 | 0 | 15 |
| **TOTAL** | **60** | **5** | **55** |

### Score Projection
| Milestone | Expected Score |
|-----------|---------------|
| Current | 8.2/10 |
| After P0+Quick Wins | 9.0/10 |
| After P1 | 9.5/10 |
| After P2 | 9.8/10 |
| After P3 | 10.0/10 |

---

## Quick Wins Batch (40 min → +1.0 score)

Run these 8 fixes in one session:

1. [x] ColumnCustomizationMenu 32px → `h-11 w-11` ✅ (Already fixed)
2. [ ] Header NavigationTab → add `min-h-11`
3. [ ] contextMenu items → add `min-h-11`
4. [ ] Sidebar sm variant → change `h-7` to `min-h-11`
5. [ ] theme/locales `modal={false}` → remove prop
6. [ ] ContactList truncation → add `truncate` class
7. [ ] AddTask invalid Tailwind → change `max-h-9/10` to `max-h-[90vh]`
8. [x] QuickAddOpportunity ESC → add useEffect ESC listener ✅ (Already fixed)

---

*Guide generated from UI/UX audit reports in `docs/ui-ux/audits/`*
