# Contact CSV Import - Field Mappings

This document describes the CSV field mappings for the Contact Import feature.

## Overview

The CSV import uses intelligent column header detection to map your spreadsheet columns to CRM contact fields. Headers are normalized (lowercase, trimmed) and matched against a comprehensive alias registry.

**Required Fields:**
- `organization_name` - Must be non-empty (contacts cannot exist without an organization)
- `first_name` OR `last_name` - At least one name field required

## Supported Field Mappings

### Core Identity Fields

| CRM Field | Accepted CSV Headers |
|-----------|---------------------|
| `first_name` | first_name, first name, first, firstname, fname, given name, forename, prenom, vorname |
| `last_name` | last_name, last name, last, lastname, lname, surname, family name, familyname, nom, nachname, apellido |

**Full Name Splitting:** If your CSV has a single "Name" column, the import will automatically split it into first/last name. Recognized headers: `full name`, `fullname`, `name`, `contact name`, `display name`, `customer name`, `client name`, `person`

### Organization (Required)

| CRM Field | Accepted CSV Headers |
|-----------|---------------------|
| `organization_name` | organization_name, organization, organisation, company, company name, business, business name, org, employer, enterprise, firm, client, client name, customer, account, vendor |

**Behavior:** Organizations that don't exist in the CRM will be automatically created during import.

### Email Fields

| CRM Field | Accepted CSV Headers |
|-----------|---------------------|
| `email_work` | email_work, work email, business email, professional email, office email, email, e-mail, email address, mail, primary email |
| `email_home` | email_home, home email, personal email, private email, secondary email |
| `email_other` | email_other, other email, alternate email, alternative email, additional email, backup email |

**Note:** Generic `email` headers default to `email_work`.

### Phone Fields

| CRM Field | Accepted CSV Headers |
|-----------|---------------------|
| `phone_work` | phone_work, work phone, business phone, office phone, phone, phone number, telephone, tel, mobile, cell, cell phone, primary phone |
| `phone_home` | phone_home, home phone, personal phone, private phone, residential phone, secondary phone |
| `phone_other` | phone_other, other phone, alternate phone, additional phone, fax |

**Note:** Generic `phone` or `mobile` headers default to `phone_work`.

### Professional Info

| CRM Field | Accepted CSV Headers |
|-----------|---------------------|
| `title` | title, job title, jobtitle, position title, professional title, designation, job position, work title |
| `gender` | gender, sex, gender identity, m/f, male/female, pronouns |

### Date Fields

| CRM Field | Accepted CSV Headers |
|-----------|---------------------|
| `first_seen` | first_seen, first seen, date added, created, created date, added on, first contact, initial contact |
| `last_seen` | last_seen, last seen, last contact, last contacted, last activity, last interaction, updated, modified |

### Additional Fields

| CRM Field | Accepted CSV Headers |
|-----------|---------------------|
| `tags` | tags, tag, categories, category, labels, label, groups, group, segments, keywords |
| `linkedin_url` | linkedin_url, linkedin url, linkedin, linkedin profile, linkedin link, social media |
| `notes` | notes, note, comments, comment, description, remarks, memo, additional info, details, observations |
| `avatar` | avatar, photo, picture, profile picture, profile photo, headshot, image, image url, photo url |

**Tags:** Comma-separated values in a single column (e.g., `VIP, Customer, Priority`)

## Organization Lookup (TODO-052)

The import process handles organization assignment as follows:

1. **Lookup:** Searches for existing organization by exact name match
2. **Create if missing:** If organization doesn't exist, creates it automatically
3. **Assign:** Links the contact to the organization via `organization_id`

**Error Handling:**
- Rows missing `organization_name` will fail validation
- Rows where organization creation fails will report errors with the row number

## Data Quality Decisions

During import preview, users can make these decisions:

| Decision | Description |
|----------|-------------|
| Import Organizations Without Contacts | Import rows that have an org name but no contact name (creates "General Contact" placeholder) |
| Import Contacts Without Contact Info | Import contacts that have no email or phone (name + org only) |

## Validation Rules

1. **Organization Required:** `organization_name` cannot be empty
2. **Name Required:** At least one of `first_name` or `last_name` must be provided
3. **Email Format:** Valid email format when provided (empty values allowed)
4. **LinkedIn URL:** Must be valid URL from linkedin.com domain when provided

## Example CSV

```csv
First Name,Last Name,Company,Email,Phone,Tags
John,Doe,Acme Corp,john@acme.com,555-1234,"VIP, Customer"
Jane,Smith,Tech Inc,jane@tech.com,555-5678,Partner
```

## CSV Template

Download the sample template from the Import dialog to ensure proper formatting.

## Technical Implementation

- **Schema Validation:** `importContactSchema` in `src/atomic-crm/validation/contacts.ts`
- **Column Aliases:** `COLUMN_ALIASES` in `src/atomic-crm/contacts/columnAliases.ts`
- **Import Logic:** `useContactImport.tsx` handles batch processing with `Promise.allSettled()`
- **State Machine:** `useImportWizard.ts` manages wizard flow with abort support

---

*Last Updated: 2025-11-29*
*Version: 1.0 - Initial documentation for TODO-052 compliance*
