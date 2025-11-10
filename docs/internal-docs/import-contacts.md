Main Components:
  1. ContactImportButton (entry point) - simple button with modal trigger
  2. ContactImportDialog (UI) - modal with file upload, progress tracking, 4 states
  3. usePapaParse (CSV parsing) - batch processing with PapaParse library
  4. useContactImport (business logic) - handles organization/tag lookup and contact creation

  Data Flow:
  1. User clicks Import button → Modal opens
  2. User selects CSV file → PapaParse parses file
  3. Batch processing (10 contacts at a time):
    - Fetch/create organizations (cached)
    - Fetch/create tags (cached)
    - Create contact records
    - Link primary organization via junction table
  4. Progress tracking with ETA calculation
  5. Auto-refresh list on completion

  Key Technical Points:
  - Uses React Admin's data provider for Supabase integration
  - Caching strategy reduces API calls
  - Batch size: 10 contacts per batch
  - Mandatory primary organization field
  - Supports multi-type emails/phones (work, home, other)
  - Comma-separated tags
  - Fail-fast on missing organization name

  Import Schema:
  - Required: first_name, last_name, organization_name
  - Optional: 11+ fields including gender, title, emails, phones, tags, LinkedIn, dates
  - Default organization role: "decision_maker"

  State Machine:
  idle → parsing → running → complete
                        ↓
                      error


  Contact Import Button: Complete Technical Analysis

  User Experience Flow

  Step 1: Initiating Import

  When a user navigates to the Contacts page, they see an Import button in the top toolbar (alongside Sort, Export, and Create buttons). Clicking this button opens a modal dialog titled "Import Contacts from CSV."

  Step 2: File Selection

  The modal presents:
  - A file upload input accepting CSV files
  - A link to download a sample template (contacts_export.csv) showing the expected format
  - Instructions about required fields

  Step 3: Import Processing

  Once a CSV file is selected and upload begins:
  - A progress indicator appears showing:
    - Current status (e.g., "Importing contacts...")
    - Progress count (e.g., "15 / 100 contacts imported")
    - Error count if any records fail
    - Estimated time remaining (calculated dynamically)
  - A "Stop Import" button allows cancellation mid-process
  - The close button is disabled to prevent accidental interruption

  Step 4: Completion

  After all batches process:
  - A success message displays the total imported (e.g., "100 contacts imported successfully")
  - Any errors are summarized
  - The contact list automatically refreshes to show new records
  - User can close the modal

  ---
  Technical Implementation Details

  Component Architecture

  The import functionality is built with four interconnected components:

  1. ContactImportButton.tsx (Entry Point)

  Location: src/atomic-crm/contacts/ContactImportButton.tsx:1

  <Button variant="outline" onClick={handleOpenModal}>
    <Upload /> Import
  </Button>
  <ContactImportDialog open={modalOpen} onClose={handleCloseModal} />

  This simple component manages modal visibility state and renders the trigger button with an Upload icon from lucide-react.

  2. ContactImportDialog.tsx (User Interface)

  Location: src/atomic-crm/contacts/ContactImportDialog.tsx:1

  This is the primary UI controller implementing a state machine with four states:

  - idle: Initial state showing file upload interface
  - parsing: CSV is being parsed by PapaParse (happens instantly for small files)
  - running: Active import with real-time progress tracking
  - complete: Import finished, showing summary statistics
  - error: CSV parsing failed (malformed file, wrong format, etc.)

  The component uses the usePapaParse and useContactImport hooks to separate UI concerns from business logic.

  3. usePapaParse.tsx (CSV Parsing Engine)

  Location: src/atomic-crm/misc/usePapaParse.tsx:1

  This reusable hook leverages the PapaParse library to:
  - Parse CSV files in the browser (no server upload needed)
  - Process data in configurable batches (default: 10 records)
  - Calculate estimated time remaining based on mean processing time per batch
  - Support cancellation via internal import ID tracking
  - Handle CSV parsing errors gracefully

  Key Technical Detail: The batch processing prevents overwhelming the Supabase API with hundreds of simultaneous requests. Each batch waits for the previous to complete before proceeding.

  4. useContactImport.tsx (Business Logic)

  Location: src/atomic-crm/contacts/useContactImport.tsx:1

  This hook contains all the domain-specific import logic for contacts.

  ---
  CSV Import Schema

  The import accepts a CSV with the following structure:

  Required Fields:
  - first_name - Contact's first name
  - last_name - Contact's last name
  - organization_name - CRITICAL: Primary organization (contact will be skipped if missing)

  Optional Fields:
  - gender - Contact gender
  - title - Job title
  - organization_role - Role at primary organization (defaults to "decision_maker")
  - email_work, email_home, email_other - Multiple email addresses
  - phone_work, phone_home, phone_other - Multiple phone numbers
  - avatar - URL to profile image
  - first_seen, last_seen - Timestamp fields (ISO 8601 format)
  - tags - Comma-separated tag list (e.g., "influencer, developer")
  - linkedin_url - LinkedIn profile URL

  Example Row:
  John,Doe,male,Sales Executive,Acme Corporation,decision_maker,2024-07-01,2024-07-01,"influencer, developer",https://linkedin.com/in/johndoe,john@acme.com,john@gmail.com,,555-0100,555-0200,

  ---
  Data Processing Flow

  When a CSV file is processed, here's exactly what happens for each batch of 10 contacts:

  Phase 1: Organization Resolution

  // For each unique organization_name in the batch
  1. Check organizationCache for existing organization
  2. If not cached:
     - Query Supabase: getList('organizations', { filter: { name: orgName } })
     - If not found: Create new organization record
  3. Add to cache for subsequent contacts in same import

  Why caching matters: If you're importing 100 contacts from the same 5 companies, this reduces 100 organization lookups to just 5 API calls.

  Phase 2: Tag Resolution

  // For each contact with tags field
  1. Split tags by comma: "influencer, developer" → ["influencer", "developer"]
  2. For each tag name:
     - Check tagCache for existing tag
     - If not cached: Query Supabase for tag by name
     - If not found: Create new tag record
  3. Collect tag IDs for association

  Phase 3: Contact Creation

  // For each contact in batch
  1. Create contact record with:
     - Basic info (first_name, last_name, gender, title, avatar)
     - Consolidated emails array: [email_work, email_home, email_other].filter(Boolean)
     - Consolidated phones array: [phone_work, phone_home, phone_other].filter(Boolean)
     - Dates (first_seen, last_seen)
     - LinkedIn URL
     - Tag IDs array
  2. Store returned contact.id for organization linking

  Important: Emails and phones in the CSV (spread across work/home/other columns) are consolidated into single arrays in the database. This matches the contacts table schema which stores multiple values per contact.

  Phase 4: Organization Linking

  // For each created contact
  1. Create contact_organizations junction table entry:
     - contact_id: new contact's ID
     - organization_id: resolved organization ID
     - is_primary: true (this is the main organization)
     - role: organization_role from CSV || "decision_maker"

  This creates the many-to-many relationship allowing contacts to belong to multiple organizations (though import only sets one primary organization).

  ---
  Error Handling & Edge Cases

  Fail-Fast Principle:
  Following the Engineering Constitution's "NO OVER-ENGINEERING" rule, the import implements simple error handling:

  - Missing organization_name: Contact is skipped entirely with console warning
  - Individual contact failures: Logged but don't stop the entire import
  - CSV parsing errors: Entire import stops, user sees error state
  - User cancellation: Import ID is tracked; subsequent batches are skipped

  No Duplicate Prevention:
  The import does NOT check for existing contacts with the same name/email. This is intentional - the system assumes users manage duplicates manually or have deduplicated their CSV beforehand.

  ---
  Performance Characteristics

  Batch Size: 10 contacts per batch (configurable via batchSize prop)

  Time Estimation Algorithm:
  meanTimePerContact = totalElapsedTime / contactsProcessedSoFar
  estimatedRemaining = meanTimePerContact × contactsRemaining

  This provides increasingly accurate estimates as more batches complete.

  API Call Optimization:
  - Without caching: 100 contacts × 3 lookups = 300+ API calls
  - With caching: ~15-30 API calls for typical imports (5-10 orgs, 5-10 unique tags)

  Browser-Based Processing:
  All CSV parsing happens in the browser using PapaParse. The actual CSV file is never uploaded to the server - only the parsed contact data is sent via API calls.

  ---
  Key Files & Line References

  | Component       | File Path                                       | Key Lines               |
  |-----------------|-------------------------------------------------|-------------------------|
  | Import Button   | src/atomic-crm/contacts/ContactImportButton.tsx | Full component          |
  | Import Dialog   | src/atomic-crm/contacts/ContactImportDialog.tsx | State machine: 55-120   |
  | CSV Parser      | src/atomic-crm/misc/usePapaParse.tsx            | Batch processing: 45-89 |
  | Business Logic  | src/atomic-crm/contacts/useContactImport.tsx    | processBatch: 35-150    |
  | Integration     | src/atomic-crm/contacts/ContactList.tsx         | Line 67 (toolbar)       |
  | Sample Template | src/atomic-crm/contacts/contacts_export.csv     | Full file               |

  ---
  Integration with CRM Architecture

  The import functionality follows Atomic CRM's architectural principles:

  1. React Admin Integration: Uses useDataProvider() hook for all Supabase operations
  2. Lazy Loading: ContactImportButton is exported via contacts/index.ts for code splitting
  3. Shadcn UI Components: Dialog, Button, and Progress components from shadcn-admin-kit
  4. Type Safety: Full TypeScript with ContactImportSchema interface validation
  5. Single Source of Truth: All data writes go through Supabase data provider (no direct DB access)

  ---
  Technical Considerations & Limitations

  Current Limitations:
  1. Single Organization: Import only assigns one primary organization per contact (though schema supports multiple)
  2. No Validation: CSV data is not validated against Zod schemas (imports trust the CSV format)
  3. No Rollback: Failed imports don't rollback successful batches (fail-forward approach)
  4. Browser Memory: Very large CSVs (10,000+ rows) may cause browser performance issues
  5. No Deduplication: System doesn't check for existing contacts before creating

  Why These Limitations Exist:
  Following the "NO OVER-ENGINEERING" principle from the Engineering Constitution, the import is intentionally simple. Features like validation, rollback, and duplicate detection can be added later if user feedback demands them.

  Production Considerations:
  - Row Level Security (RLS) policies apply to all imported records
  - All contacts created with current user's user_id
  - Timestamps automatically set by database triggers
  - No server-side processing means no additional infrastructure costs

  ---
  ★ Insight ─────────────────────────────────────
  Caching Strategy: The organization and tag caching during import is a perfect example of performance optimization without complexity. Instead of querying the database for "Acme Corporation" 50 times when importing 50 employees, the cache stores it after the first
  lookup. This reduces API calls by ~90% for typical imports.

  State Machine Pattern: The import dialog uses a classic finite state machine (idle → parsing → running → complete/error). This makes the UI predictable and prevents impossible states like "showing progress while idle" or "allowing file selection while importing."

  Browser-Side CSV Parsing: Using PapaParse in the browser (rather than uploading files to a server) provides instant feedback, reduces server load, and protects user privacy - the raw CSV never leaves their machine. Only the extracted, structured contact data is
  transmitted via API.