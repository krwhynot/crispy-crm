# Internationalization (i18n) Edge Cases Audit

**Date:** 2025-12-15
**Scope:** UI/UX edge case analysis for internationalization across Crispy CRM
**Methodology:** Static code analysis of text display, form inputs, date/number formatting, and RTL support

---

## Executive Summary

This audit evaluates Crispy CRM's handling of internationalization edge cases including RTL text, special characters, Unicode, long words, and locale-specific formatting. Overall, the codebase shows **good XSS protection** via React's automatic escaping and DOMPurify sanitization utilities, but has **minimal RTL support** and **inconsistent locale formatting**.

### Key Findings

- **XSS Protection:** EXCELLENT - No dangerouslySetInnerHTML usage found; DOMPurify sanitization utilities in place
- **RTL Support:** POOR - No `dir` attribute handling; layout would break with Arabic/Hebrew text
- **Unicode/Emoji:** GOOD - React handles this natively; no encoding issues detected
- **Long Words:** PARTIAL - Some components use `line-clamp` but missing `break-words` or `hyphens`
- **Number Formatting:** GOOD - `Intl.NumberFormat` used in display fields with locale awareness
- **Date Formatting:** GOOD - `Intl.DateTimeFormat` used consistently with locale support

---

## 1. Text Display Components

### 1.1 ContactOption.tsx

**File:** `/home/krwhynot/projects/crispy-crm/src/atomic-crm/contacts/ContactOption.tsx`
**Displays:** Contact name (first_name, last_name), title, organization_name

| Test | Input | Expected | Actual | Issue? |
|------|-------|----------|--------|--------|
| RTL | "مرحبا" | Align right | Left-aligned, no `dir` | YES |
| XSS | `<script>alert('xss')</script>` | Escaped | React auto-escapes | NO |
| Unicode | "John 🚀 Smith" | Display correctly | Native React support | NO |
| Long Word | "Donaudampfschiff..." | Break/truncate | No `break-words` | YES |
| Numbers | N/A | N/A | N/A | N/A |
| Dates | N/A | N/A | N/A | N/A |

**i18n Violations:**
- No RTL support - `dir` attribute missing on text containers
- Missing `break-words` for long names (German compound names, etc.)

**Security Concerns:** None - React automatically escapes user content

---

### 1.2 Avatar.tsx

**File:** `/home/krwhynot/projects/crispy-crm/src/atomic-crm/contacts/Avatar.tsx`
**Displays:** Contact initials (first_name, last_name charAt(0))

| Test | Input | Expected | Actual | Issue? |
|------|-------|----------|--------|--------|
| RTL | "محمد علي" | Show "م ع" | Shows "م ع" but no RTL layout | PARTIAL |
| XSS | `<script>x</script>` | Escaped | React auto-escapes | NO |
| Unicode | "Müller 🎉" | "M" | Works but emoji lost (charAt(0)) | MINOR |
| Long Word | N/A (initials only) | N/A | N/A | N/A |

**i18n Violations:**
- RTL text extracts correct characters but layout doesn't mirror
- Emoji/Unicode in names: `.charAt(0)` on "🚀John" returns half of emoji (surrogate pair issue)

**Security Concerns:** None

**Recommendation:** Use `Array.from(name)[0]` instead of `.charAt(0)` for proper Unicode handling:
```typescript
// Current (breaks on emoji)
record.first_name?.charAt(0).toUpperCase()

// Better (handles emoji)
Array.from(record.first_name || '')[0]?.toUpperCase()
```

---

### 1.3 OrganizationAvatar.tsx

**File:** `/home/krwhynot/projects/crispy-crm/src/atomic-crm/organizations/OrganizationAvatar.tsx`
**Displays:** Organization name (charAt(0) for fallback)

Same issues as Avatar.tsx - `.charAt(0)` doesn't handle emoji/Unicode properly.

---

### 1.4 Status.tsx

**File:** `/home/krwhynot/projects/crispy-crm/src/atomic-crm/shared/components/Status.tsx`
**Displays:** Status label in tooltip (`statusObject.label`)

| Test | Input | Expected | Actual | Issue? |
|------|-------|----------|--------|--------|
| RTL | "حار" (hot) | Align right | Left-aligned | YES |
| XSS | `<script>` | Escaped | React escapes | NO |
| Unicode | "🔥 Hot" | Display | Works | NO |
| Long Word | "Langlaufend..." | Truncate | `whitespace-nowrap` prevents wrap | YES |

**i18n Violations:**
- Tooltip uses `whitespace-nowrap` - long status labels would overflow
- No RTL support for status labels

**Code:**
```tsx
<div className="... whitespace-nowrap ...">
  {statusObject.label}
</div>
```

**Recommendation:** Add max-width and ellipsis for long labels:
```tsx
className="... max-w-xs truncate"
```

---

## 2. Form Input Components

### 2.1 TextInput.tsx

**File:** `/home/krwhynot/projects/crispy-crm/src/components/admin/text-input.tsx`
**Displays:** User-entered text via Input/Textarea components

| Test | Input | Expected | Actual | Issue? |
|------|-------|----------|--------|--------|
| RTL | "مرحبا" | Auto-detect direction | No `dir="auto"` | YES |
| XSS | `<script>` | Escaped on display | React escapes in `value` prop | NO |
| Unicode | "Café ☕" | Display correctly | Native input support | NO |
| Long Word | "Donaudampf..." | Wrap/scroll | Input scrolls, Textarea wraps | NO |

**i18n Violations:**
- No `dir="auto"` attribute on input elements
- RTL text appears left-aligned in inputs

**Security:** Secure - React escapes all `value` props, form submissions go through Zod validation

---

### 2.2 Input.tsx

**File:** `/home/krwhynot/projects/crispy-crm/src/components/ui/input.tsx`
**Base input component**

No i18n-specific handling. Relies on browser native input behavior.

**Recommendation:** Add `dir="auto"` to auto-detect RTL text:
```tsx
<input
  dir="auto"
  // ... other props
/>
```

---

### 2.3 Textarea.tsx

**File:** `/home/krwhynot/projects/crispy-crm/src/components/ui/textarea.tsx`

Same as Input.tsx - no RTL support.

---

### 2.4 NumberInput.tsx

**File:** `/home/krwhynot/projects/crispy-crm/src/components/admin/number-input.tsx`

| Test | Input | Expected | Actual | Issue? |
|------|-------|----------|--------|--------|
| Locale Formats | "1.234,56" (DE) | Parse correctly | Only handles "1234.56" (EN) | YES |

**i18n Violations:**
- `parseFloat()` only handles English decimal format (period as separator)
- Does not handle European comma decimals ("1,5" for 1.5)
- Number formatting on display not locale-aware

**Code:**
```typescript
const float = parseFloat(value);
```

**Impact:** German/French users entering "1,5" will get NaN or 15 instead of 1.5

**Recommendation:** Use `Intl.NumberFormat().formatToParts()` for locale-aware parsing

---

## 3. Date/Time Components

### 3.1 DateField.tsx

**File:** `/home/krwhynot/projects/crispy-crm/src/components/admin/date-field.tsx`

| Test | Input | Expected | Actual | Issue? |
|------|-------|----------|--------|--------|
| Date Format | 2024-01-15 | Locale-specific | Uses `toLocaleDateString(locales, options)` | NO |

**i18n Compliance:** EXCELLENT

Uses `Intl.DateTimeFormat` via `toLocaleDateString(locales, options)`:
```typescript
dateString = toLocaleStringSupportsLocales
  ? date.toLocaleDateString(locales, dateOptions)
  : date.toLocaleDateString();
```

Supports:
- Locale prop: `<DateField locales="fr-FR" />`
- Options prop for custom formatting
- Fallback to browser locale if `Intl` unavailable

---

### 3.2 Calendar.tsx

**File:** `/home/krwhynot/projects/crispy-crm/src/components/ui/calendar.tsx`

**i18n Compliance:** GOOD

- RTL navigation arrows rotate via Tailwind classes:
  ```tsx
  String.raw`rtl:**:[.rdp-button\_next>svg]:rotate-180`
  ```
- Month dropdown uses locale string:
  ```typescript
  formatMonthDropdown: (date) => date.toLocaleString("default", { month: "short" })
  ```

**Minor Issue:** Hardcoded "default" locale instead of accepting locale prop

---

### 3.3 formatRelativeTime.ts

**File:** `/home/krwhynot/projects/crispy-crm/src/atomic-crm/utils/formatRelativeTime.ts`

| Test | Input | Expected | Actual | Issue? |
|------|-------|----------|--------|--------|
| Locale | Date | Localized text | Hardcoded "ago", "now" (English) | YES |

**i18n Violations:**
- Hardcoded English strings: "now", "m ago", "h ago", "d ago"
- Month abbreviations hardcoded to `"en-US"`:
  ```typescript
  const month = targetDate.toLocaleDateString("en-US", { month: "short" });
  ```

**Impact:** Non-English users see mixed language ("3m ago" in UI, rest in their language)

**Recommendation:** Use `Intl.RelativeTimeFormat` or i18n library:
```typescript
const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
rtf.format(-1, 'day'); // "yesterday"
```

---

### 3.4 TimeZoneSelect.tsx

**File:** `/home/krwhynot/projects/crispy-crm/src/atomic-crm/settings/TimeZoneSelect.tsx`

**i18n Compliance:** GOOD

Timezone identifiers use IANA standard (`America/New_York`). Display labels are English but functional.

---

## 4. Number Display Components

### 4.1 NumberField.tsx

**File:** `/home/krwhynot/projects/crispy-crm/src/components/admin/number-field.tsx`

**i18n Compliance:** EXCELLENT

Uses `Intl.NumberFormat` for locale-aware display:
```typescript
value.toLocaleString(locales, options)
```

Supports locale prop: `<NumberField locales="de-DE" />`

---

### 4.2 KPICard.tsx (Reports)

**File:** `/home/krwhynot/projects/crispy-crm/src/atomic-crm/reports/components/KPICard.tsx`

| Test | Input | Expected | Actual | Issue? |
|------|-------|----------|--------|--------|
| Number Format | 1234567 | "1,234,567" (EN) | Raw number | YES |

**i18n Violations:**
- Numbers displayed without formatting: `{value}`
- Should use `value.toLocaleString()`

---

### 4.3 KPICard.tsx (Dashboard v3)

**File:** `/home/krwhynot/projects/crispy-crm/src/atomic-crm/dashboard/v3/components/KPICard.tsx`

**i18n Compliance:** GOOD

Uses `toLocaleString()`:
```typescript
formatValue: (value) => value.toLocaleString()
```

---

### 4.4 MyPerformanceWidget.tsx

**File:** `/home/krwhynot/projects/crispy-crm/src/atomic-crm/dashboard/v3/components/MyPerformanceWidget.tsx`

**i18n Compliance:** GOOD

Uses `toLocaleString()`:
```typescript
{metric.value.toLocaleString()}
```

---

## 5. Tables/Lists (User Data Display)

### 5.1 ContactList.tsx

**File:** `/home/krwhynot/projects/crispy-crm/src/atomic-crm/contacts/ContactList.tsx`

| Test | Input | Expected | Actual | Issue? |
|------|-------|----------|--------|--------|
| RTL Names | "محمد علي" | Align right | Left-aligned | YES |
| Long Names | "Donaudampf..." | Wrap/truncate | No `break-words` | YES |
| Unicode | "Café ☕" | Display | Works | NO |

**i18n Violations:**
- No RTL text direction handling
- Long names overflow cells (no `truncate` or `break-words`)

**Recommendations:**
1. Add `dir="auto"` to text cells
2. Add `truncate` to name columns:
   ```tsx
   <span className="truncate">{formatFullName(...)}</span>
   ```

---

### 5.2 OpportunityRowListView.tsx

**File:** `/home/krwhynot/projects/crispy-crm/src/atomic-crm/opportunities/OpportunityRowListView.tsx`

**i18n Violations:**
- Opportunity names use `truncate` (line 141) - GOOD
- But no RTL support

**Code:**
```tsx
className="... truncate ..."
```

---

### 5.3 OpportunityCard.tsx (Kanban)

**File:** `/home/krwhynot/projects/crispy-crm/src/atomic-crm/opportunities/kanban/OpportunityCard.tsx`

**i18n Compliance:** PARTIAL

- Uses `line-clamp-3` for name (line 150) - prevents overflow
- Uses `line-clamp-2` for description (line 186)
- Date formatting: `format(date, "MMM d, yyyy")` - hardcoded English format

**i18n Violations:**
- Date format not locale-aware (line 88)
- Hardcoded English strings: "days in stage", "task", "product", "overdue"

---

## 6. Formatters & Utilities

### 6.1 formatName.ts

**File:** `/home/krwhynot/projects/crispy-crm/src/atomic-crm/utils/formatName.ts`

**i18n Compliance:** GOOD

Simple string concatenation - no locale issues. Returns "--" for empty (neutral symbol).

---

### 6.2 formatFullName / formatRoleAndDept

**File:** `/home/krwhynot/projects/crispy-crm/src/atomic-crm/utils/formatters.ts`

**i18n Compliance:** GOOD

Uses `EMPTY_PLACEHOLDER = "--"` - language-neutral.

---

## 7. Security Analysis: XSS Protection

### 7.1 DOMPurify Sanitization

**File:** `/home/krwhynot/projects/crispy-crm/src/lib/sanitization.ts`

**Security:** EXCELLENT

Comprehensive HTML sanitization library with:
- `sanitizeHtml()` - configurable tag/attribute allowlist
- `sanitizeToPlainText()` - strips all HTML
- `sanitizeBasicHtml()` - basic formatting only
- Forbidden tags: `script`, `object`, `embed`, `form`, `input`
- Forbidden attributes: `onerror`, `onload`, `onclick`, etc.

**Usage:** Found in email generation, CSV processing, report rendering

---

### 7.2 React Auto-Escaping

**Result:** No `dangerouslySetInnerHTML` found in component files

All user content rendered via:
- `{record.name}` - React auto-escapes
- `<Input value={field.value} />` - React escapes value prop
- `<span>{statusObject.label}</span>` - React escapes

**Verdict:** XSS protection is EXCELLENT

---

## 8. Long Word Handling

### Components with `line-clamp`

Good overflow protection via Tailwind's `line-clamp-*`:
- OpportunityCard.tsx: `line-clamp-3` (name), `line-clamp-2` (description)
- TaskKanbanCard.tsx: `line-clamp-2`
- ProductCard.tsx: `line-clamp-1`
- ActivityLogNote.tsx: `line-clamp-3`

### Components with `truncate`

Good single-line truncation:
- OpportunityRowListView.tsx: Opportunity name
- KPICard.tsx: Label and value
- MyPerformanceWidget.tsx: Metric labels
- ContactList: Name columns (via FunctionField)

### Components with `whitespace-nowrap`

**Potential overflow issues:**
- Status.tsx tooltip (line 28)
- Table headers/cells (table.tsx)
- Badge components
- FilterChipBar.tsx label (line 107)

**Recommendation:** Add `max-w-*` constraint to prevent unbounded growth:
```tsx
className="whitespace-nowrap max-w-xs truncate"
```

---

## 9. Missing RTL Support

### No `dir` attribute found

Search for `dir=|direction:|text-direction` returned only unrelated files (CSS properties in hooks, not HTML attributes).

**Impact:**
- RTL text (Arabic, Hebrew, Persian) displays left-to-right
- Layout doesn't mirror for RTL languages
- Reading order is incorrect

**Recommendation:** Add `dir="auto"` to text inputs and containers:
```tsx
// Inputs
<input dir="auto" {...props} />

// Text containers
<div dir="auto" className="...">
  {record.name}
</div>
```

---

## 10. Summary of Violations

### Critical (P0)

None - no XSS vulnerabilities found

### High (P1)

1. **No RTL Support** - Arabic/Hebrew text breaks layout
   - Affects: All text inputs, all display components
   - Fix: Add `dir="auto"` to Input, Textarea, and text containers

2. **Number Input Not Locale-Aware** - European decimal formats fail
   - Affects: NumberInput.tsx
   - Fix: Use locale-aware parsing

### Medium (P2)

1. **Hardcoded English in formatRelativeTime.ts**
   - Fix: Use `Intl.RelativeTimeFormat` or i18n library

2. **Emoji/Unicode charAt(0) Bug** - Avatar initials break on emoji
   - Affects: Avatar.tsx, OrganizationAvatar.tsx
   - Fix: Use `Array.from(str)[0]` instead of `charAt(0)`

3. **Hardcoded Date Formats in Kanban**
   - Fix: Use `toLocaleDateString()` instead of `format(date, "MMM d")`

### Low (P3)

1. **Missing locale prop in Calendar month formatter**
   - Fix: Accept and use locale prop

2. **KPICard (Reports) missing number formatting**
   - Fix: Use `value.toLocaleString()`

3. **Long text in whitespace-nowrap elements**
   - Fix: Add `max-w-*` constraint

---

## 11. Recommendations

### Immediate Actions

1. **Add RTL Support**
   ```tsx
   // src/components/ui/input.tsx
   <input dir="auto" {...props} />

   // src/components/ui/textarea.tsx
   <textarea dir="auto" {...props} />
   ```

2. **Fix Avatar charAt(0) Bug**
   ```tsx
   // src/atomic-crm/contacts/Avatar.tsx
   const initials = [
     Array.from(record.first_name || '')[0]?.toUpperCase(),
     Array.from(record.last_name || '')[0]?.toUpperCase()
   ].filter(Boolean).join('');
   ```

3. **Fix NumberInput Locale Parsing**
   - Use `Intl.NumberFormat().formatToParts()` for parsing
   - Or add locale-aware validation to Zod schema

### Future Enhancements

1. **Add i18n Library** (e.g., react-i18next)
   - Translate hardcoded strings
   - Locale-aware date/time formatting
   - RTL layout mirroring

2. **Test Suite for i18n Edge Cases**
   - RTL text rendering
   - Emoji in names
   - Long German compound words
   - European number formats

3. **Accessibility Improvements**
   - Add `lang` attribute to HTML root
   - Add `hreflang` for multi-language support (future)

---

## 12. Test Cases for Validation

### Manual Test Data

**RTL Names:**
```
محمد علي (Arabic)
דוד כהן (Hebrew)
```

**Unicode/Emoji:**
```
José Müller ☕
🚀 John Smith
Café René
```

**Long Words:**
```
Donaudampfschifffahrtselektrizitätenhauptbetriebswerkbauunterbeamtengesellschaft
Rindfleischetikettierungsüberwachungsaufgabenübertragungsgesetz
```

**Number Formats:**
```
1.234,56 (German)
1 234,56 (French)
1,234.56 (English)
```

**XSS Payloads:**
```html
<script>alert('xss')</script>
<img src=x onerror=alert('xss')>
<svg onload=alert('xss')>
```

### Expected Results

- RTL text auto-detects direction (requires `dir="auto"`)
- Unicode/emoji displays correctly
- Long words wrap or truncate (no overflow)
- Numbers parse correctly based on locale
- XSS payloads are escaped/sanitized (already working)

---

## Conclusion

Crispy CRM has **excellent XSS protection** via React's auto-escaping and DOMPurify sanitization, but **lacks RTL support** and has **inconsistent locale handling** for number inputs and relative time formatting.

**Priority fixes:**
1. Add `dir="auto"` to inputs (RTL support)
2. Fix NumberInput locale parsing
3. Fix Avatar emoji handling with `Array.from()`

**Grade by Category:**
- XSS Security: A+ (Excellent)
- RTL Support: D (Poor)
- Unicode/Emoji: B (Good, minor charAt bug)
- Long Word Handling: B+ (Good, some missing constraints)
- Number Formatting: A- (Good display, poor input parsing)
- Date Formatting: A (Excellent)

**Overall i18n Grade: B-**
