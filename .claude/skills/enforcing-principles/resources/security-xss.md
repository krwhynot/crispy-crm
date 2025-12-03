# Security: XSS Prevention

## Purpose

Document XSS prevention patterns using React auto-escaping, sanitization, and URL validation.

## Pattern: React Auto-Escaping

```typescript
// ✅ CORRECT - React auto-escapes user input
function ContactName({ name }: { name: string }) {
  return <h1>{name}</h1>; // Safe - React escapes HTML
}

// User input: <script>alert('XSS')</script>
// Rendered as: &lt;script&gt;alert('XSS')&lt;/script&gt;
```

## Pattern: DangerouslySetInnerHTML (Avoid)

```typescript
// ❌ WRONG - Allows XSS
function ContactNotes({ notes }: { notes: string }) {
  return <div dangerouslySetInnerHTML={{ __html: notes }} />;
  // If notes contains <script>, it WILL execute!
}

// ✅ CORRECT - Use markdown library with sanitization
import { marked } from 'marked';
import DOMPurify from 'dompurify';

function ContactNotes({ notes }: { notes: string }) {
  const sanitized = DOMPurify.sanitize(marked.parse(notes));
  return <div dangerouslySetInnerHTML={{ __html: sanitized }} />;
}
```

## Pattern: URL Validation

```typescript
// Validate URLs before rendering links
const LINKEDIN_URL_REGEX = /^http(?:s)?:\/\/(?:www\.)?linkedin\.com\//;

const linkedinUrlSchema = z
  .string()
  .refine(
    (url) => {
      if (!url) return true;
      try {
        const parsedUrl = new URL(url);
        return parsedUrl.href.match(LINKEDIN_URL_REGEX) !== null;
      } catch {
        return false;
      }
    },
    { message: "URL must be from linkedin.com" }
  );

// Only render validated URLs
function ContactLinkedIn({ url }: { url: string }) {
  const validated = linkedinUrlSchema.safeParse(url);

  if (!validated.success) return null;

  return (
    <a href={validated.data} target="_blank" rel="noopener noreferrer">
      LinkedIn
    </a>
  );
}
```

## Security Decision Tree

```
User input received
│
├─ Rendering HTML?
│  ├─ Use React (auto-escapes)
│  ├─ Avoid dangerouslySetInnerHTML
│  └─ Sanitize if rendering user HTML (DOMPurify)
│
├─ Rendering URL?
│  ├─ Validate URL format
│  ├─ Check domain whitelist
│  └─ Add rel="noopener noreferrer"
│
└─ Admin action?
   ├─ Check user role
   └─ Show confirmation dialog
```

## Quick Reference

| Pattern | Safe | Why |
|---------|------|-----|
| React `{variable}` | ✅ | Auto-escapes |
| `dangerouslySetInnerHTML` raw | ❌ | XSS |
| `dangerouslySetInnerHTML` + DOMPurify | ✅ | Sanitized |
| Unvalidated URLs | ❌ | javascript: protocol |
| Zod-validated URLs | ✅ | Format checked |

## Best Practices

### DO

✅ Use React's auto-escaping (XSS prevention)
✅ Validate URLs before rendering links
✅ Use DOMPurify when rendering user HTML
✅ Add `rel="noopener noreferrer"` to external links
✅ Show confirmation dialogs for destructive actions

### DON'T

❌ Use `dangerouslySetInnerHTML` without sanitization
❌ Render user URLs without validation
❌ Skip confirmation on delete actions
❌ Ignore security warnings in console

## Related Resources

- [security-csv.md](security-csv.md) - CSV validation
- [security-sql.md](security-sql.md) - SQL injection
- [security-rls.md](security-rls.md) - RLS policies

---

**Last Updated:** 2025-12-02
**Version:** 2.0.0
