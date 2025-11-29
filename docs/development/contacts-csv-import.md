# Contact CSV Import - Field Mapping Reference

This document describes the CSV import functionality for contacts, including supported fields, column aliases, and data transformation rules.

## Overview

The contact CSV import supports:
- **Automatic column mapping** via intelligent header recognition
- **Full name splitting** - "John Doe" → first_name: "John", last_name: "Doe"
- **Multi-email/phone support** - Work, Home, Other variants
- **Organization auto-creation** - Creates organizations if they don't exist
- **Tag auto-creation** - Creates tags from comma-separated values
- **Data quality warnings** - Identifies contacts without contact info or organizations without contacts

## Supported Fields

### Required Fields

| Field | Description | Example |
|-------|-------------|---------|
| `first_name` | Contact's first name | "John" |
| `last_name` | Contact's last name | "Doe" |
| `organization_name` | Primary organization (auto-created if missing) | "Acme Inc" |

> **Note:** If a "Full Name" column is provided, it will be automatically split into first_name and last_name.

### Optional Fields

| Field | Description | Example |
|-------|-------------|---------|
| `gender` | Contact's gender | "male", "female", "other" |
| `title` | Job title | "Sales Director" |
| `email_work` | Work email address | "john@company.com" |
| `email_home` | Personal email address | "john@gmail.com" |
| `email_other` | Other email address | "john@other.com" |
| `phone_work` | Work phone number | "555-1234" |
| `phone_home` | Home phone number | "555-5678" |
| `phone_other` | Other phone number | "555-9012" |
| `first_seen` | Date first contacted (ISO format) | "2024-01-15" |
| `last_seen` | Date last contacted (ISO format) | "2024-06-20" |
| `tags` | Comma-separated tags (auto-created) | "VIP, Customer, Partner" |
| `linkedin_url` | LinkedIn profile URL | "https://linkedin.com/in/johndoe" |
| `notes` | Contact notes | "Met at trade show" |

## Column Alias Recognition

The import system recognizes common CSV header variations automatically. Below are the supported aliases for each field:

### Identity Fields

**first_name:**
- first_name, first name, first, firstname, fname
- given name, given_name, givenname, forename
- christian name, christian_name, prenom, vorname

**last_name:**
- last_name, last name, last, lastname, lname
- surname, family name, family_name, familyname
- nom, nachname, apellido

**Full Name (auto-split):**
- full name, fullname, full_name, name
- contact name, contact_name, contactname
- person name, person_name, display name
- customer name, client name, user name

### Organization

**organization_name:**
- organization_name, organization name, organization
- organisations, organizations, organisation
- company, company name, company_name, companyname
- business, business name, business_name
- org, org name, org_name, employer
- enterprise, firm, client, client name
- customer, account, account name, vendor

### Contact Information

**email_work (default for "email"):**
- email_work, email work, work email, work_email
- business email, business_email, professional email
- office email, company email, corporate email
- email, e-mail, e mail, email address
- mail, email_primary, primary email

**email_home:**
- email_home, email home, home email, home_email
- personal email, personal_email, private email
- email personal, secondary email, email_secondary

**email_other:**
- email_other, email other, other email, other_email
- alternate email, alternative email, additional email
- backup email, tertiary email

**phone_work (default for "phone"):**
- phone_work, phone work, work phone, work_phone
- business phone, office phone, company phone
- phone, phone number, telephone, tel
- mobile, mobile phone, cell, cell phone
- contact number, primary phone

**phone_home:**
- phone_home, phone home, home phone, home_phone
- personal phone, private phone, residential phone
- house phone, secondary phone

**phone_other:**
- phone_other, phone other, other phone, other_phone
- alternate phone, alternative phone, additional phone
- backup phone, fax, fax number, tertiary phone

### Professional Information

**title:**
- title, job title, job_title, jobtitle
- position title, position_title, professional title
- role title, designation, job position, work title

**gender:**
- gender, sex, gender identity, gender_identity
- m/f, male/female, pronouns

### Dates

**first_seen:**
- first_seen, first seen, date added, date_added
- created, created date, creation date
- added on, first contact, initial contact

**last_seen:**
- last_seen, last seen, last contact, last_contact
- last contacted, last activity, last_activity
- last interaction, recent contact
- updated, updated date, modified, modified date

### Tags

**tags:**
- tags, tag, categories, category
- labels, label, groups, group
- segments, segment, keywords, classifications

### Social Media

**linkedin_url:**
- linkedin_url, linkedin url, linkedin
- linkedin profile, linkedin_profile
- linkedin link, social media, li url

### Notes

**notes:**
- notes, note, comments, comment
- description, remarks, remark, memo
- additional info, additional information
- details, observations

## Data Transformation Rules

### Full Name Splitting
When a column is recognized as a "Full Name" column:
1. The value is split by whitespace
2. First word → `first_name`
3. Remaining words → `last_name`
4. Example: "John Michael Doe" → first_name: "John", last_name: "Michael Doe"

### Email/Phone Arrays
Imported email and phone values are transformed into JSONB arrays:
```json
// Emails
[
  { "email": "john@work.com", "type": "Work" },
  { "email": "john@home.com", "type": "Home" }
]

// Phones
[
  { "number": "555-1234", "type": "Work" },
  { "number": "555-5678", "type": "Home" }
]
```

### Tag Processing
Tags are processed as comma-separated values:
- Input: "VIP, Customer, Partner"
- Each tag is trimmed and deduplicated
- Tags that don't exist are automatically created

### Date Handling
- Dates are parsed and converted to ISO format
- If no date is provided, `first_seen` and `last_seen` default to the import date

## Data Quality Features

### Preview Mode
Before importing, users see:
- Column mapping with confidence scores
- Sample data preview (first 5 rows)
- Count of valid/skipped/error rows
- List of new organizations that will be created
- List of new tags that will be created

### Quality Warnings
The import identifies:
1. **Organizations without contacts** - Rows with org name but no first/last name
2. **Contacts without contact info** - Rows with names but no email or phone

Users can choose to import or skip these records.

## Security Features

- **File validation** - Maximum 10MB file size, CSV format only
- **Formula injection prevention** - Values starting with `=`, `@`, `+`, `-` are sanitized
- **Rate limiting** - Prevents rapid bulk imports
- **Batch processing** - Files are processed in batches of 10 for reliability

## Sample CSV Template

Download the sample CSV template from the import dialog, which includes all supported headers:

```csv
first_name,last_name,organization_name,email_work,phone_work,title,tags,notes
John,Doe,Acme Inc,john@acme.com,555-1234,Sales Director,"VIP, Customer",Met at trade show
Jane,Smith,Tech Corp,jane@tech.com,555-5678,CEO,Partner,Key account
```

## Troubleshooting

### Common Issues

1. **"Organization not found" errors**
   - Ensure organization_name column has valid values
   - Check for leading/trailing whitespace

2. **Names not splitting correctly**
   - Verify the column header matches a "Full Name" pattern
   - Or use separate first_name and last_name columns

3. **Tags not importing**
   - Use comma-separated format: "Tag1, Tag2, Tag3"
   - Avoid leading/trailing commas

4. **Date parsing errors**
   - Use ISO format (YYYY-MM-DD) for best results
   - Or use common formats like MM/DD/YYYY
