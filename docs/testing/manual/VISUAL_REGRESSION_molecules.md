# Visual Regression Test: Molecule Layer Refactoring

**Branch:** `refactor/atomic-molecules`
**Date:** 2026-01-19
**Tester:** _______________

## Purpose

Verify that the extraction of form patterns into molecules (`EmailArrayField`, `PhoneArrayField`, `OrganizationPicker`) produces **identical visual output** to the original inline implementation.

---

## Pre-Test Setup

1. [ ] Start dev server: `just dev`
2. [ ] Open browser to `http://localhost:5173`
3. [ ] Log in as test user
4. [ ] Have screenshots of original Contact Create form (or compare against `main` branch)

---

## Test 1: Contact Create Form - Initial State

**Navigate to:** Contacts → Create New Contact

### 1.1 Name Section
| Check | Expected | Pass |
|-------|----------|------|
| First Name field visible | TextInput with label "First Name *" | [ ] |
| Last Name field visible | TextInput with label "Last Name *" | [ ] |
| Avatar placeholder visible | Gray circle to the right | [ ] |
| Section has progress indicator | Shows 0% or empty state | [ ] |

### 1.2 Organization Section
| Check | Expected | Pass |
|-------|----------|------|
| Organization picker visible | Autocomplete with label "Organization *" | [ ] |
| Account Manager dropdown visible | SelectInput with label "Account manager *" | [ ] |
| Organization uses autocomplete | Typing shows filtered results | [ ] |

### 1.3 Email Array Field
| Check | Expected | Pass |
|-------|----------|------|
| Email section visible | Label "Email addresses *" | [ ] |
| One empty email row present | TextInput + SelectInput (type) | [ ] |
| Type dropdown shows "work" default | SelectInput with "work" selected | [ ] |
| Add button visible | "+" or "Add" button to add rows | [ ] |
| Remove button NOT visible (single row) | No delete button on only row | [ ] |
| Email placeholder text | "name@company.com" | [ ] |

### 1.4 Phone Array Field
| Check | Expected | Pass |
|-------|----------|------|
| Phone section visible | Label "Phone numbers" | [ ] |
| One empty phone row present | TextInput + SelectInput (type) | [ ] |
| Type dropdown shows "work" default | SelectInput with "work" selected | [ ] |
| Phone placeholder text | "Phone number" | [ ] |

---

## Test 2: Email Array Field - Interactions

### 2.1 Add/Remove Rows
| Action | Expected | Pass |
|--------|----------|------|
| Click "Add" on email | New empty row appears | [ ] |
| Add 3 email rows total | All 3 visible, aligned properly | [ ] |
| Delete button appears on rows 2-3 | Remove button visible | [ ] |
| Click remove on row 2 | Row removed, others shift up | [ ] |

### 2.2 Type Selection
| Action | Expected | Pass |
|--------|----------|------|
| Click type dropdown | Shows: work, home, other | [ ] |
| Select "home" | Dropdown updates to "home" | [ ] |
| Select "other" | Dropdown updates to "other" | [ ] |

### 2.3 Email Validation
| Action | Expected | Pass |
|--------|----------|------|
| Type "invalid" and blur | Error message appears | [ ] |
| Type "test@example.com" and blur | No error, field valid | [ ] |
| Error message styling | Red text, field highlighted | [ ] |

### 2.4 Name Auto-Population (Critical!)
| Action | Expected | Pass |
|--------|----------|------|
| With empty name fields, paste "john.doe@example.com" | First Name → "John", Last Name → "Doe" | [ ] |
| With empty name fields, type "jane.smith@test.com" and blur | First Name → "Jane", Last Name → "Smith" | [ ] |
| With first name already filled, paste email | Name fields NOT changed | [ ] |

---

## Test 3: Phone Array Field - Interactions

### 3.1 Add/Remove Rows
| Action | Expected | Pass |
|--------|----------|------|
| Click "Add" on phone | New empty row appears | [ ] |
| Add 2 phone rows total | Both visible, aligned | [ ] |
| Remove one phone row | Row removed correctly | [ ] |

### 3.2 Type Selection
| Action | Expected | Pass |
|--------|----------|------|
| Click type dropdown | Shows: work, home, other | [ ] |
| All options selectable | No errors on selection | [ ] |

---

## Test 4: Organization Picker - Interactions

| Action | Expected | Pass |
|--------|----------|------|
| Click organization field | Dropdown or autocomplete opens | [ ] |
| Type "Test" | Filtered results appear | [ ] |
| Select an organization | Field populated, dropdown closes | [ ] |
| Clear selection | Field clears, can re-select | [ ] |

---

## Test 5: Form Submission

### 5.1 Validation Errors
| Action | Expected | Pass |
|--------|----------|------|
| Submit empty form | Validation errors on required fields | [ ] |
| Error on First Name | "First name is required" visible | [ ] |
| Error on Last Name | "Last name is required" visible | [ ] |
| Error on Organization | "Organization is required" visible | [ ] |
| Error on Email | "At least one email required" visible | [ ] |

### 5.2 Successful Submission
| Action | Expected | Pass |
|--------|----------|------|
| Fill all required fields | Progress shows ~100% | [ ] |
| Add valid email | Email validation passes | [ ] |
| Submit form | Contact created successfully | [ ] |
| Redirected to contact view | New contact displayed | [ ] |

---

## Test 6: Layout & Styling

### 6.1 Responsive Layout
| Check | Expected | Pass |
|-------|----------|------|
| Desktop (1440px+) | Full-width layout, comfortable spacing | [ ] |
| iPad (1024px) | Layout adapts, no overflow | [ ] |
| Form fields don't overlap | Clean grid alignment | [ ] |

### 6.2 Theme Consistency
| Check | Expected | Pass |
|-------|----------|------|
| Light mode | Proper contrast, readable text | [ ] |
| Dark mode | Proper contrast, no white flashes | [ ] |
| Focus states visible | Ring/border on focused fields | [ ] |

### 6.3 Alignment Comparison
| Check | Expected | Pass |
|-------|----------|------|
| Email row alignment | TextInput and SelectInput inline, same height | [ ] |
| Phone row alignment | Same as email rows | [ ] |
| Type dropdowns width | Fixed ~96px (w-24), not stretching | [ ] |
| SimpleFormIterator spacing | No extra borders between rows | [ ] |

---

## Test 7: Contact Edit Form

**Navigate to:** Contacts → Select existing contact → Edit

| Check | Expected | Pass |
|-------|----------|------|
| Existing emails pre-populated | All saved emails visible | [ ] |
| Existing phones pre-populated | All saved phones visible | [ ] |
| Organization pre-selected | Correct org displayed | [ ] |
| Can modify and save | Changes persist correctly | [ ] |

---

## Known Differences (Expected)

Document any **intentional** visual differences here:

1. _None expected - refactoring should be visually identical_

---

## Issues Found

| Issue | Severity | Screenshot | Notes |
|-------|----------|------------|-------|
| | | | |
| | | | |

---

## Sign-Off

**Visual Regression Status:** [ ] PASS / [ ] FAIL

**Tester Signature:** _______________

**Date:** _______________

---

## Rollback Instructions

If visual regression fails:

```bash
git checkout main
git branch -D refactor/atomic-molecules
```
