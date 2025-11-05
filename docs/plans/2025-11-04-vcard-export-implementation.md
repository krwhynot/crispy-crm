# vCard Export Implementation Plan

> **⏸️ STATUS: DEFERRED TO POST-MVP**
>
> **Reason:** CSV export is 100% functional and sufficient for Excel replacement goal (30 days). vCard is nice-to-have.
>
> **Rationale:** Per principal-centric redesign v2.0, vCard export is contact polish for mobile device integration. Not critical for core Account Manager workflows.

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement vCard export for contacts (single and bulk)

**Architecture:** Use vcard-creator library to generate vCard 4.0 files. Add export button to ContactShow and ContactList.

**Tech Stack:** vcard-creator npm package, React Admin
**Effort:** 2 days | **Priority:** ⏸️ DEFERRED | **Status:** 0% (PRD claim removed in Task 1)

**Note:** Task 1 (Fix vCard Export Documentation) removed incorrect PRD claim. Only implement if explicitly requested post-MVP.

---

## Implementation

### Task 1: Install vCard Library (Day 1 - Morning)

```bash
npm install vcard-creator --save
```

**Verify installation:**
```bash
npm list vcard-creator
```

---

### Task 2: Create vCard Export Utility (Day 1 - Morning)

**File:** `src/atomic-crm/contacts/utils/vcardExporter.ts`

```typescript
import VCard from "vcard-creator";

export type ContactRecord = {
  id: string;
  first_name: string;
  last_name: string;
  email: Array<{ email: string; type: string }>;
  phone: Array<{ number: string; type: string }>;
  title?: string;
  organization?: { name: string };
};

/**
 * Generate a vCard 4.0 file from a contact record
 */
export function generateVCard(contact: ContactRecord): string {
  const vCard = new VCard();

  // Name (required)
  vCard
    .addName(contact.last_name || "", contact.first_name || "")
    .addFormattedName(`${contact.first_name} ${contact.last_name}`);

  // Organization
  if (contact.organization?.name) {
    vCard.addCompany(contact.organization.name);
  }

  // Title
  if (contact.title) {
    vCard.addJobtitle(contact.title);
  }

  // Email addresses
  if (contact.email && contact.email.length > 0) {
    contact.email.forEach((emailObj) => {
      vCard.addEmail(emailObj.email, emailObj.type || "WORK");
    });
  }

  // Phone numbers
  if (contact.phone && contact.phone.length > 0) {
    contact.phone.forEach((phoneObj) => {
      const type = phoneObj.type?.toUpperCase() || "WORK";
      vCard.addPhoneNumber(phoneObj.number, type);
    });
  }

  // Note with CRM reference
  vCard.addNote(`Exported from Atomic CRM - Contact ID: ${contact.id}`);

  return vCard.toString();
}

/**
 * Download a vCard file
 */
export function downloadVCard(vcardContent: string, filename: string): void {
  const blob = new Blob([vcardContent], { type: "text/vcard;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${filename}.vcf`;
  link.click();
  URL.revokeObjectURL(url);
}

/**
 * Generate and download vCard for a single contact
 */
export function exportSingleContact(contact: ContactRecord): void {
  const vcardContent = generateVCard(contact);
  const filename = `${contact.first_name}_${contact.last_name}`.replace(
    /\s/g,
    "_"
  );
  downloadVCard(vcardContent, filename);
}

/**
 * Generate and download vCard for multiple contacts (batch)
 */
export function exportMultipleContacts(contacts: ContactRecord[]): void {
  // Combine multiple vCards into one file
  const vcardContents = contacts.map(generateVCard).join("\n\n");
  const filename = `contacts_export_${new Date().toISOString().split("T")[0]}`;
  downloadVCard(vcardContents, filename);
}
```

---

### Task 3: Add Export Button to Contact Show Page (Day 1 - Afternoon)

**File:** Modify `src/atomic-crm/contacts/ContactShow.tsx`

```typescript
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { exportSingleContact } from "./utils/vcardExporter";
import { useRecordContext, useNotify } from "react-admin";

// Add to ContactShowActions component
const ContactShowActions = () => {
  const record = useRecordContext();
  const notify = useNotify();

  const handleExportVCard = () => {
    if (!record) return;
    try {
      exportSingleContact(record);
      notify("vCard exported successfully", { type: "success" });
    } catch (error: any) {
      notify(`Export failed: ${error.message}`, { type: "error" });
    }
  };

  return (
    <TopToolbar>
      <Button
        variant="outline"
        onClick={handleExportVCard}
        className="flex items-center gap-2"
      >
        <Download className="h-4 w-4" />
        Export vCard
      </Button>
      <EditButton />
    </TopToolbar>
  );
};

export const ContactShow = () => (
  <Show actions={<ContactShowActions />}>
    <SimpleShowLayout>
      {/* existing fields */}
    </SimpleShowLayout>
  </Show>
);
```

---

### Task 4: Add Bulk Export to Contact List (Day 2 - Morning)

**File:** Modify `src/atomic-crm/contacts/ContactList.tsx`

```typescript
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { exportMultipleContacts } from "./utils/vcardExporter";
import { useListContext, useNotify } from "react-admin";

// Add vCard bulk export button
const VCardBulkExportButton = () => {
  const { selectedIds, data } = useListContext();
  const notify = useNotify();

  const handleBulkExport = () => {
    if (!data || selectedIds.length === 0) {
      notify("No contacts selected", { type: "warning" });
      return;
    }

    try {
      const selectedContacts = selectedIds.map((id) =>
        data.find((record) => record.id === id)
      );
      exportMultipleContacts(selectedContacts.filter(Boolean));
      notify(`Exported ${selectedIds.length} contacts as vCard`, {
        type: "success",
      });
    } catch (error: any) {
      notify(`Export failed: ${error.message}`, { type: "error" });
    }
  };

  return (
    <Button
      variant="outline"
      onClick={handleBulkExport}
      disabled={selectedIds.length === 0}
      className="flex items-center gap-2"
    >
      <Download className="h-4 w-4" />
      Export vCard ({selectedIds.length})
    </Button>
  );
};

// Add to list actions
const ContactListActions = () => (
  <TopToolbar>
    <FilterButton />
    <CreateButton />
    <ExportButton /> {/* CSV export */}
    <VCardBulkExportButton /> {/* vCard export */}
    <ContactImportButton />
  </TopToolbar>
);
```

---

### Task 5: Create Unit Tests (Day 2 - Afternoon)

**File:** `src/atomic-crm/contacts/utils/vcardExporter.test.ts`

```typescript
import { describe, it, expect } from "vitest";
import { generateVCard, exportSingleContact } from "./vcardExporter";

describe("vcardExporter", () => {
  const mockContact = {
    id: "123",
    first_name: "John",
    last_name: "Doe",
    email: [{ email: "john@example.com", type: "Work" }],
    phone: [{ number: "555-1234", type: "Home" }],
    title: "CEO",
    organization: { name: "Acme Corp" },
  };

  it("generates valid vCard 4.0 string", () => {
    const vcard = generateVCard(mockContact);

    expect(vcard).toContain("BEGIN:VCARD");
    expect(vcard).toContain("VERSION:4.0");
    expect(vcard).toContain("FN:John Doe");
    expect(vcard).toContain("N:Doe;John");
    expect(vcard).toContain("ORG:Acme Corp");
    expect(vcard).toContain("TITLE:CEO");
    expect(vcard).toContain("EMAIL;TYPE=WORK:john@example.com");
    expect(vcard).toContain("TEL;TYPE=HOME:555-1234");
    expect(vcard).toContain("END:VCARD");
  });

  it("handles missing optional fields", () => {
    const minimalContact = {
      id: "456",
      first_name: "Jane",
      last_name: "Smith",
      email: [],
      phone: [],
    };

    const vcard = generateVCard(minimalContact);

    expect(vcard).toContain("FN:Jane Smith");
    expect(vcard).not.toContain("ORG:");
    expect(vcard).not.toContain("TITLE:");
  });

  it("handles multiple email addresses", () => {
    const multiEmailContact = {
      ...mockContact,
      email: [
        { email: "work@example.com", type: "Work" },
        { email: "personal@example.com", type: "Home" },
      ],
    };

    const vcard = generateVCard(multiEmailContact);

    expect(vcard).toContain("EMAIL;TYPE=WORK:work@example.com");
    expect(vcard).toContain("EMAIL;TYPE=HOME:personal@example.com");
  });

  it("includes CRM reference in note", () => {
    const vcard = generateVCard(mockContact);

    expect(vcard).toContain("NOTE:Exported from Atomic CRM - Contact ID: 123");
  });
});
```

**Run tests:**
```bash
npm test -- vcardExporter.test.ts
```

---

### Task 6: Add Documentation (Day 2 - Afternoon)

**File:** Update `docs/prd/05-contacts-module.md`

Change status from "✅ Complete" to "✅ Complete" (confirm accuracy):

Lines 27, 33, 39 - Verify vCard export is now truly implemented.

**Add to PRD:**
```markdown
### vCard Export

**Status:** ✅ Complete (implemented 2025-11-04)

**Features:**
- Single contact vCard export from Show page
- Bulk vCard export from List page with selection
- vCard 4.0 format with full contact details
- Support for multiple email addresses and phone numbers
- Organization and title fields included

**Implementation:** `src/atomic-crm/contacts/utils/vcardExporter.ts`
```

---

### Task 7: Manual Testing & Commit

**Test Steps:**
```bash
npm run dev

# Test Single Export
1. Navigate to any contact's Show page
2. Click "Export vCard" button
3. Verify .vcf file downloads
4. Open in Contacts app (macOS/Windows)
5. Verify all fields imported correctly

# Test Bulk Export
1. Navigate to Contacts List
2. Select 3-5 contacts (checkboxes)
3. Click "Export vCard (N)" button
4. Verify .vcf file downloads
5. Import into Contacts app
6. Verify all contacts imported

# Edge Cases
- Contact with no phone/email
- Contact with organization
- Contact with multiple emails
```

**Commit:**
```bash
git add src/atomic-crm/contacts/utils/vcardExporter.ts
git add src/atomic-crm/contacts/ContactShow.tsx
git add src/atomic-crm/contacts/ContactList.tsx
git add src/atomic-crm/contacts/utils/vcardExporter.test.ts
git add docs/prd/05-contacts-module.md
git commit -m "feat: implement vCard export for contacts

- Add vcardExporter utility with vcard-creator library
- Generate vCard 4.0 with all contact fields
- Add single contact export button to Show page
- Add bulk vCard export to List page
- Include organization and title fields
- Add unit tests for vCard generation

Resolves PRD documentation inconsistency

🤖 Generated with Claude Code

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

**Plan Status:** ✅ Ready | **Time:** 2 days | **Impact:** LOW (Nice-to-have feature)

**Prerequisites:** Install vcard-creator package
**Validation:** Import exported vCards into native Contacts app
