# CSV Import Field Mappings

> **Status**: ENABLED (Phase 1 Complete)
> **Last Updated**: 2025-11-29
> **Tests**: 127 unit tests passing

## Quick Reference

### Required Fields

| CSV Header (any of these) | Target Field | Notes |
|---------------------------|--------------|-------|
| `first_name`, `first name`, `firstname`, `fname` | `first_name` | Or use Full Name column |
| `last_name`, `last name`, `lastname`, `surname` | `last_name` | Or use Full Name column |
| `organization_name`, `company`, `organization` | `organization_name` | **MANDATORY** |

### Full Name Handling

If your CSV has a combined "Full Name" column, the system automatically splits it:

| CSV Header | Result |
|------------|--------|
| `name`, `full name`, `fullname`, `contact name` | Split into `first_name` + `last_name` |
| `John Smith` | `first_name: John`, `last_name: Smith` |
| `Mary Jane Smith` | `first_name: Mary`, `last_name: Jane Smith` |
| `Smith` (single name) | `first_name: (empty)`, `last_name: Smith` |

---

## Complete Field Alias Reference

### Core Identity Fields

```
first_name:
  - first_name, first name, first, firstname
  - fname, given name, given_name, givenname
  - forename, christian name, prenom, vorname

last_name:
  - last_name, last name, last, lastname
  - lname, surname, family name, family_name
  - familyname, nom, nachname, apellido
```

### Organization Fields

```
organization_name:
  - organization_name, organization name, organization
  - organisations, organizations, organizations (dropdown)
  - organisation, company, company name, company_name
  - companyname, business, business name, business_name
  - org, org name, org_name, employer, enterprise
  - firm, client, client name, customer, account

organization_role:
  - organization_role, organization role, role
  - job role, job_role, position, position (dropdown)
  - title, job title, job_title, jobtitle
  - designation, function, responsibility
```

### Email Fields

```
email_work (default for generic "email"):
  - email_work, email work, work email, work_email
  - workemail, business email, business_email
  - professional email, office email, company email
  - email, e-mail, e mail, email address, mail
  - email_primary, primary email

email_home:
  - email_home, email home, home email, home_email
  - homeemail, personal email, personal_email
  - private email, secondary email, email_secondary

email_other:
  - email_other, email other, other email, other_email
  - alternate email, alternative email, additional email
  - backup email, tertiary email
```

### Phone Fields

```
phone_work (default for generic "phone"):
  - phone_work, phone work, work phone, work_phone
  - business phone, office phone, company phone, desk phone
  - phone, phone number, telephone, tel
  - mobile, mobile phone, cell, cell phone
  - contact number, primary phone

phone_home:
  - phone_home, phone home, home phone, home_phone
  - personal phone, private phone, residential phone
  - house phone, secondary phone

phone_other:
  - phone_other, phone other, other phone, other_phone
  - alternate phone, alternative phone, additional phone
  - backup phone, fax, fax number, tertiary phone
```

### Other Fields

```
title:
  - title, job title, job_title, jobtitle
  - position title, professional title, role title
  - designation, job position, work title

gender:
  - gender, sex, gender identity, m/f, pronouns

tags:
  - tags, tag, categories, category
  - labels, label, groups, group
  - segments, segment, keywords

linkedin_url:
  - linkedin_url, linkedin url, linkedin
  - linkedin profile, linkedin link
  - social media, li url

notes:
  - notes, note, comments, comment
  - description, remarks, memo
  - additional info, details, observations

first_seen:
  - first_seen, first seen, date added
  - created, created date, creation date
  - added on, first contact, initial contact

last_seen:
  - last_seen, last seen, last contact
  - last contacted, last activity
  - last interaction, recent contact
  - updated, modified
```

---

## Sample CSV Template

Download from the import dialog or use this format:

```csv
first_name,last_name,organization_name,email_work,phone_work,title,tags,linkedin_url
John,Doe,Acme Corporation,john@acme.com,555-0100,Sales Executive,"influencer, developer",https://linkedin.com/in/johndoe
Jane,Smith,Tech Corp,jane@tech.com,555-0200,UX Designer,design,https://linkedin.com/in/janesmith
```

### Alternative Headers (All Valid)

```csv
First Name,Last Name,Company,Email,Phone,Job Title,Tags
Full Name,Organization,Work Email,Mobile,Position
Name,Business,E-Mail,Telephone,Role
```

---

## Data Transformations

### Email/Phone Consolidation

CSV columns like `email_work`, `email_home`, `email_other` are consolidated into a JSONB array:

```json
// CSV: email_work=john@acme.com, email_home=john@gmail.com
// Database:
{
  "email": [
    { "email": "john@acme.com", "type": "Work" },
    { "email": "john@gmail.com", "type": "Home" }
  ]
}
```

### Tags Parsing

Comma-separated tags are split and each tag is created if it doesn't exist:

```
CSV: "influencer, developer, VIP"
Result: Creates/links 3 tag records
```

### Date Handling

Dates are parsed and converted to ISO 8601:

```
Input: "2024-07-01" or "07/01/2024" or "July 1, 2024"
Output: "2024-07-01T00:00:00.000Z"
```

---

## Security Features

### Formula Injection Protection

All CSV values are sanitized to prevent Excel formula injection:

```
Input: "=cmd|'/c calc'!A0"
Output: "'=cmd|'/c calc'!A0" (prefixed with single quote)
```

### File Validation

Before parsing:
- File type: `.csv` only
- Max file size: 5MB
- Max rows: 10,000
- Max cell length: 10,000 characters

---

## Testing

### Unit Test Coverage

```bash
# Run all CSV import tests
npm test -- src/atomic-crm/contacts/__tests__/useColumnMapping.test.ts \
            src/atomic-crm/contacts/__tests__/contactImport.helpers.test.ts \
            src/atomic-crm/contacts/__tests__/useImportWizard.test.ts \
            src/atomic-crm/utils/__tests__/csvUploadValidator.test.ts

# 127 tests passing
```

### Test Fixtures

Located in `tests/fixtures/`:
- `contacts-valid.csv` - Standard valid CSV
- `contacts-invalid.csv` - Missing required fields
- `contacts-formula-injection.csv` - Security test cases

---

## Architecture

```
ContactImportButton
  └── ContactImportDialog (state machine)
        ├── useImportWizard (FSM: idle → parsing → preview → importing → complete)
        ├── useColumnMapping (header mapping + reprocessing)
        ├── usePapaParse (CSV parsing with PapaParse)
        └── useContactImport (business logic)
              ├── organizationsCache (Map<string, Organization>)
              ├── tagsCache (Map<string, Tag>)
              └── dataProvider (unifiedDataProvider)
```

### Key Files

| File | Purpose |
|------|---------|
| `columnAliases.ts` | 100+ header aliases mapped to canonical fields |
| `csvProcessor.ts` | Raw CSV → ContactImportSchema transformation |
| `csvConstants.ts` | Shared constants (FULL_NAME_SPLIT_MARKER) |
| `contactImport.types.ts` | TypeScript interfaces |
| `contactImport.helpers.ts` | Data quality analysis functions |
| `contactImport.logic.ts` | Predicate functions |
| `csvUploadValidator.ts` | Security validation |

---

## Known Limitations

1. **Single Organization**: Import assigns one primary organization per contact
2. **No Duplicate Detection**: Importing the same CSV twice creates duplicates
3. **Tag Colors**: All new tags default to "gray" color
4. **Browser Memory**: Very large CSVs (10k+ rows) may cause performance issues

---

## Related Documentation

- [Engineering Constitution](../claude/engineering-constitution.md)
- [CSV Import Current State](csv-import-current-state.docs.md) (archived)
- [Import Contacts](import-contacts.md) (user guide)
