# Anti-Patterns: Validation & Forms

## Purpose

Document validation and form-related anti-patterns that violate single source of truth.

## Anti-Pattern 1: Multiple Validation Sources

### The Problem

Validating data in components, utils, AND Zod schemas.

### WRONG

```typescript
// ❌ Validation in component
function ContactForm() {
  const validateEmail = (email: string) => {
    if (!email.includes('@')) {
      return "Invalid email";
    }
    return undefined;
  };

  return <TextInput source="email" validate={validateEmail} />;
}

// ❌ Validation in utility
function isValidContact(data: any): boolean {
  if (!data.email?.includes('@')) return false;
  if (!data.first_name) return false;
  return true;
}

// ❌ Validation in schema (third definition!)
const contactSchema = z.object({
  email: z.string().email(),
  first_name: z.string().min(1),
});
```

**Why it's wrong:**
- Three different email validation definitions
- Rules can drift over time (component says valid, schema says invalid)
- Hard to maintain (change one, forget to change others)
- Violates single source of truth

### CORRECT

```typescript
// ✅ Single source of truth - Zod schema at API boundary
const contactSchema = z.object({
  email: z.string().email("Invalid email address"),
  first_name: z.string().min(1, "First name is required"),
});

// Component uses schema (no validation)
function ContactForm() {
  return <TextInput source="email" />; // Validation from schema
}

// Utility uses schema (no validation)
function isValidContact(data: any): boolean {
  return contactSchema.safeParse(data).success;
}
```

**Why it's right:**
- One definition of validation rules
- Changes in schema apply everywhere
- Type-safe with `z.infer`
- Easy to test

## Anti-Pattern 2: Hardcoded Form Defaults

### The Problem

Duplicating default values in components instead of deriving from schema.

### WRONG

```typescript
// ❌ Hardcoded defaults in component
const OpportunityCreate = () => {
  const formDefaults = {
    stage: 'new_lead',      // Out of sync with schema!
    priority: 'medium',
    estimated_close_date: '2025-12-31', // Wrong calculation
  };

  return <Form defaultValues={formDefaults}>...</Form>;
};

// ❌ Using defaultValue props
<SelectInput source="stage" defaultValue="new_lead" />
<SelectInput source="priority" defaultValue="medium" />
```

**Why it's wrong:**
- Defaults duplicated in schema and component
- Schema changes don't reflect in form
- Easy for defaults to drift over time

### CORRECT

```typescript
// ✅ Defaults from schema
const OpportunityCreate = () => {
  const formDefaults = {
    ...opportunitySchema.partial().parse({}), // Extracts .default() values
    opportunity_owner_id: identity?.id, // Runtime values merged
  };

  return <Form defaultValues={formDefaults}>...</Form>;
};

// NO defaultValue props
<SelectInput source="stage" /> // Default comes from schema
<SelectInput source="priority" /> // Default comes from schema
```

**Why it's right:**
- Single source of truth (Zod schema)
- Schema changes automatically apply to forms
- Type-safe
- Less code

## Anti-Pattern 3: Skipping CSV Validation

### The Problem

Not validating CSV uploads allows DoS attacks, formula injection, and malware.

### WRONG

```typescript
// ❌ No validation - accepts any file
function ContactImport() {
  const handleFileUpload = (file: File) => {
    Papa.parse(file, {
      complete: (results) => {
        // Directly importing without validation!
        importContacts(results.data);
      }
    });
  };

  return <input type="file" onChange={(e) => handleFileUpload(e.target.files[0])} />;
}
```

**Why it's wrong:**
- No file size limit (DoS via 1GB CSV)
- No format validation (accepts .exe renamed to .csv)
- No formula sanitization (Excel formula injection)
- No binary detection (malware uploads)

### CORRECT

```typescript
// ✅ Multi-layer validation
function ContactImport() {
  const handleFileUpload = async (file: File) => {
    // 1. Validate file
    const validation = await validateCsvFile(file);
    if (!validation.valid && validation.errors) {
      setValidationErrors(validation.errors);
      return;
    }

    // 2. Use secure config
    Papa.parse(file, {
      ...getSecurePapaParseConfig(),
      complete: async (results) => {
        // 3. Sanitize cells
        const sanitized = results.data.map(row => ({
          name: sanitizeCsvValue(row.name),
          email: sanitizeCsvValue(row.email),
        }));

        // 4. Validate with Zod
        await importContacts(sanitized);
      }
    });
  };

  return <input type="file" accept=".csv" onChange={...} />;
}
```

**Why it's right:**
- File size limit (10MB)
- Format validation (CSV only)
- Formula sanitization (prefix with ')
- Binary detection (magic bytes)
- Zod validation (API boundary)

## Checklist

Before committing, check for:

- [ ] ❌ Validation outside Zod schemas (centralize at API boundary)
- [ ] ❌ Hardcoded form defaults (use `schema.partial().parse({})`)
- [ ] ❌ Skipped CSV validation (DoS, formula injection, malware risks)
- [ ] ❌ `defaultValue` props on inputs (use form defaults from schema)
- [ ] ❌ `validate` prop with custom function (use Zod schema instead)

## Related Resources

- [validation-patterns.md](validation-patterns.md) - Correct validation patterns
- [form-state-management.md](form-state-management.md) - Correct form patterns
- [security-patterns.md](security-patterns.md) - CSV validation details

---

**Last Updated:** 2025-12-02
**Version:** 2.0.0
