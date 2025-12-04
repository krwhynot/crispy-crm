# Parallel Code Review Report: File Handling Implementation

**Date:** 2025-12-03
**Scope:** File handling code vs `docs/decisions/file-handling-best-practices.md`
**Method:** 3 parallel agents (Security, Architecture, UI/UX) + consolidation

---

## Executive Summary

The file handling implementation shows **strong security on imports** but **critical vulnerabilities on exports**. The codebase follows fail-fast principles correctly and uses semantic colors throughout. Primary concerns are CSV injection in exports, missing accessibility attributes, and code duplication.

| Category | Status | Critical | High | Medium | Low |
|----------|--------|----------|------|--------|-----|
| Security | ⚠️ NEEDS FIX | 2 | 1 | 4 | 3 |
| Architecture | ✅ GOOD | 0 | 1 | 3 | 2 |
| UI/UX | ⚠️ NEEDS FIX | 0 | 6 | 2 | 1 |
| **TOTAL** | | **2** | **8** | **9** | **6** |

---

## Critical Issues (BLOCKS MERGE)

### 1. CSV Injection in Contact Exports
**File:** `src/atomic-crm/contacts/contactExporter.ts:69-74`
**Agent:** Security

```typescript
// WRONG: Raw data exported without sanitization
return jsonExport(contacts, {}, (err: Error | null, csv: string) => {
  if (err) throw new Error(`CSV export failed: ${err.message}`);
  downloadCSV(csv, "contacts");
});
```

**Risk:** Data containing `=`, `-`, `+`, `@` at start of values will execute as Excel formulas, enabling remote code execution.

**Fix:**
```typescript
const sanitizeForCSV = (value: any): string => {
  if (typeof value !== 'string') return String(value ?? '');
  const formulaTriggers = ['=', '-', '+', '@', '\t', '\r'];
  if (formulaTriggers.some(char => value.startsWith(char))) {
    return `\t${value}`;  // Tab prefix neutralizes formulas
  }
  return value;
};

const safeContacts = contacts.map(row =>
  Object.fromEntries(
    Object.entries(row).map(([k, v]) => [k, sanitizeForCSV(v)])
  )
);

return jsonExport(safeContacts, {
  endOfLine: '\r\n',  // Excel compatibility
}, callback);
```

### 2. CSV Injection in Opportunity Exports
**File:** `src/atomic-crm/opportunities/opportunityExporter.ts:109-114`
**Agent:** Security

Same vulnerability as contact exports. Apply identical fix.

---

## High Priority Issues (Fix Before Merge)

### 3. Missing Dropzone Accessibility Attributes
**File:** `src/components/admin/file-input.tsx:180-189`
**Agent:** UI/UX

```tsx
// WRONG: Missing keyboard and screen reader support
<div {...getRootProps({ className: cn(...) })}>
```

**Fix:**
```tsx
<div
  {...getRootProps({
    className: cn(...),
    role: 'button',
    'aria-label': multiple ? translate(labelMultiple) : translate(labelSingle),
    tabIndex: disabled || readOnly ? -1 : 0,
  })}
>
```

### 4. Missing Dropzone Accessibility in ImageEditorField
**File:** `src/components/ui/image-editor-field.tsx:119-123, 142-148`
**Agent:** UI/UX

```tsx
// WRONG: Dropzone missing accessibility
const { getRootProps, getInputProps } = useDropzone({
  accept: { "image/jpeg": [".jpeg", ".png"] },
  onDrop,
  maxFiles: 1,
});
```

**Fix:** Add `role='button'`, `aria-label='Upload and crop image'`, `tabIndex={0}` to getRootProps.

### 5. Missing role="alert" on Error Messages
**Files:** `ContactImportDialog.tsx:454-464`, `OrganizationImportDialog.tsx:914-924`
**Agent:** UI/UX

Verify Alert component implements `role="alert"`. If not, add explicitly:
```tsx
<Alert variant="destructive" role="alert" aria-live="polite">
```

### 6. Missing Cropper Accessibility
**File:** `src/components/ui/image-editor-field.tsx:151-157`
**Agent:** UI/UX

```tsx
// WRONG: Cropper lacks accessibility
<Cropper ref={cropperRef} src={imageSrc} ... />
```

**Fix:**
```tsx
<div role="application" aria-label="Image cropper - adjust crop area">
  <Cropper ref={cropperRef} src={imageSrc} ... />
</div>
```

### 7. Missing jsonexport Configuration
**Files:** `contactExporter.ts`, `opportunityExporter.ts`
**Agent:** Architecture

```typescript
// WRONG: Empty config object
return jsonExport(contacts, {}, callback);
```

**Fix:**
```typescript
return jsonExport(contacts, {
  endOfLine: '\r\n',  // Windows/Excel compatibility
  typeHandlers: {
    Boolean: (value: boolean) => value ? 'Yes' : 'No',
    Date: (value: Date) => value.toISOString().split('T')[0],
    Undefined: () => '',
    Null: () => '',
  },
}, callback);
```

### 8. FileInput Missing maxSize Default
**File:** `src/components/admin/file-input.tsx:156-164`
**Agent:** Security

```tsx
// WRONG: No default maxSize = DoS risk
const { getRootProps, getInputProps } = useDropzone({
  accept,
  maxSize,  // May be undefined
  ...
});
```

**Fix:**
```tsx
const MAX_FILE_SIZE_DEFAULT = 5 * 1024 * 1024; // 5MB
const { getRootProps, getInputProps } = useDropzone({
  accept,
  maxSize: maxSize ?? MAX_FILE_SIZE_DEFAULT,
  ...
});
```

---

## Medium Priority Issues (Fix When Convenient)

### 9. ImageEditorField Missing maxSize
**File:** `image-editor-field.tsx:119-123`
**Agent:** Security

Add `maxSize: 5 * 1024 * 1024` to dropzone config.

### 10. FileInput Missing Filename Validation
**File:** `file-input.tsx:156-164`
**Agent:** Security

Add validator function:
```typescript
validator: (file) => {
  if (file.name.length > 255) {
    return { code: 'name-too-long', message: 'Filename exceeds 255 characters' };
  }
  if (/[<>:"/\\|?*]/.test(file.name)) {
    return { code: 'invalid-chars', message: 'Filename contains invalid characters' };
  }
  return null;
}
```

### 11. Cropper Missing Output Size Limits
**File:** `image-editor-field.tsx:86-91`
**Agent:** Security

```typescript
// WRONG: No size limits
const croppedImage = cropper?.getCroppedCanvas().toDataURL();
```

**Fix:**
```typescript
const croppedImage = cropper?.getCroppedCanvas({
  maxWidth: 1024,
  maxHeight: 1024,
  imageSmoothingEnabled: true,
  imageSmoothingQuality: 'high',
}).toDataURL('image/jpeg', 0.85);
```

### 12. Cropper Missing checkOrientation
**File:** `image-editor-field.tsx:151-157`
**Agent:** Security

Add `checkOrientation={true}` to Cropper component for camera photo support.

### 13. Code Duplication in OrganizationImportDialog
**File:** `OrganizationImportDialog.tsx:146-441`
**Agent:** Architecture

`resolveAccountManagers` and `resolveSegments` have ~300 lines of duplicated logic. Extract generic helper:
```typescript
async function resolveForeignKeyReferences<T>(
  rows: any[],
  headers: string[],
  mappings: Record<string, string | null>,
  targetField: string,
  resource: string,
  nameField: string,
  cacheRef: React.MutableRefObject<Map<string, T>>,
  createRecord: (name: string) => Partial<T>
): Promise<void>
```

### 14. Inconsistent Batch Processing Patterns
**Files:** `ContactImportDialog.tsx` vs `OrganizationImportDialog.tsx`
**Agent:** Architecture

Contact uses state machine (`useImportWizard`), Organization uses `useRef`. Standardize on state machine pattern.

### 15. Missing aria-describedby for Helper Text
**File:** `file-input.tsx:191-206`
**Agent:** UI/UX

Connect input to helper text with `aria-describedby`.

---

## Low Priority Issues (Optional)

### 16. PapaParse Missing Worker for Large Files
**File:** `usePapaParse.tsx:68-74`
**Agent:** Security

Add `worker: file.size > 1024 * 1024` for files >1MB.

### 17. OrganizationImportDialog Not Streaming
**File:** `OrganizationImportDialog.tsx:734-832`
**Agent:** Security

Consider using `step` callback for streaming large files.

### 18. Unused papaConfig Parameter
**File:** `ContactImportDialog.tsx:240`
**Agent:** Architecture

Remove unused `papaConfig` parameter or add support to `usePapaParse` hook.

### 19. "Change" Button Missing aria-label
**File:** `image-editor-field.tsx:60-66`
**Agent:** UI/UX

Add `aria-label="Change profile image"` for context.

---

## Compliant Patterns (Strengths)

### Security ✅
- CSV import sanitization properly implemented (`csvProcessor.ts`)
- Formula injection prevention on import (`sanitizeCsvValue()`)
- File validation comprehensive (size, extension, binary detection, magic bytes)
- `dynamicTyping: false` prevents phone number corruption
- Both import dialogs use `validateCsvFile()` before processing

### Architecture ✅
- No retry logic (fail-fast compliant)
- No circuit breakers (fail-fast compliant)
- No graceful fallbacks (fail-fast compliant)
- Single source of truth for CSV transformation (`csvProcessor.ts`)
- Proper separation of concerns
- Correct TypeScript usage (interface vs type)

### UI/UX ✅
- Zero hardcoded colors (exemplary semantic token usage)
- Touch targets meet 44x44px minimum
- Consistent use of `bg-muted`, `text-muted-foreground`, `border-border`
- Proper disabled state styling

---

## Recommendations (Priority Order)

| Priority | Action | Files | Effort |
|----------|--------|-------|--------|
| 1 | Fix CSV export injection | `contactExporter.ts`, `opportunityExporter.ts` | 30 min |
| 2 | Add dropzone accessibility | `file-input.tsx`, `image-editor-field.tsx` | 20 min |
| 3 | Add maxSize defaults | `file-input.tsx`, `image-editor-field.tsx` | 10 min |
| 4 | Add cropper output limits | `image-editor-field.tsx` | 10 min |
| 5 | Verify Alert role="alert" | Check Alert component | 5 min |
| 6 | Add jsonexport config | `contactExporter.ts`, `opportunityExporter.ts` | 15 min |

---

## Files Reviewed

| File | Security | Architecture | UI/UX |
|------|----------|--------------|-------|
| `usePapaParse.tsx` | ⚠️ | ✅ | N/A |
| `csvProcessor.ts` | ✅ | ✅ | N/A |
| `csvUploadValidator.ts` | ✅ | ✅ | N/A |
| `contactExporter.ts` | ❌ CRITICAL | ⚠️ | N/A |
| `opportunityExporter.ts` | ❌ CRITICAL | ⚠️ | N/A |
| `file-input.tsx` | ⚠️ | ✅ | ⚠️ |
| `image-editor-field.tsx` | ⚠️ | ✅ | ⚠️ |
| `ContactImportDialog.tsx` | ✅ | ✅ | ⚠️ |
| `OrganizationImportDialog.tsx` | ✅ | ⚠️ | ⚠️ |

---

**Generated by:** Parallel Code Review (3 agents)
**Standards Reference:** `docs/decisions/file-handling-best-practices.md`
