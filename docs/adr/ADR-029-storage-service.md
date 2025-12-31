# ADR-029: Storage Service with File Path Caching

## Status

**Accepted**

## Date

Documented: 2025-12-30

## Deciders

- krwhynot

---

## Context

File upload logic in `unifiedDataProvider.ts` had grown to approximately 200 lines embedded within the monolithic data provider. This violated the **Single Responsibility Principle** and made the provider difficult to maintain.

Key problems with the embedded approach:

1. **Mixed Concerns**: Data CRUD operations interleaved with blob handling, file uploads, and URL generation
2. **Re-upload Waste**: Existing files were re-uploaded on every save operation, wasting bandwidth and storage
3. **Scattered Logic**: File handling spread across multiple methods (`create`, `update`) with duplicated code
4. **Testing Difficulty**: Couldn't unit test storage operations without mocking entire data provider

Additionally, React Admin's file input components generate both `blob:` URLs (local file references) and `data:` URLs (base64 encoded), requiring detection logic to determine when uploads are actually needed.

### Alternatives Considered

| Alternative | Pros | Cons |
|------------|------|------|
| **Keep embedded in provider** | No refactor needed | Violates SRP, hard to test |
| **Utility functions** | Simple extraction | No state, repeated lookups |
| **Service class (chosen)** | Encapsulated, testable, stateful | Additional abstraction |
| **Edge Function** | Server-side control | Latency, complexity |

---

## Decision

Extract file storage operations into a dedicated **`StorageService` class** that handles all Supabase Storage interactions.

### Core Responsibilities

1. **Upload Management**: Handle new file uploads to `attachments` bucket
2. **Existence Checking**: Detect if file already exists (path caching)
3. **Blob/Data URL Detection**: Determine if upload is needed
4. **URL Generation**: Provide public URLs for stored files
5. **Cleanup**: Remove orphaned files

### Service Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    React Admin Form                          │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ FileInput generates:                                    │ │
│  │   • blob:http://... (local file, needs upload)          │ │
│  │   • data:image/png;base64,... (pasted, needs upload)    │ │
│  │   • https://...supabase.co/... (existing, skip upload)  │ │
│  └────────────────────────────────────────────────────────┘ │
└──────────────────────────┬──────────────────────────────────┘
                           │ RAFile objects
                           ▼
┌─────────────────────────────────────────────────────────────┐
│              unifiedDataProvider.create/update               │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ Delegates file handling to StorageService               │ │
│  │ storageService.uploadToBucket(file)                     │ │
│  └────────────────────────────────────────────────────────┘ │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                    StorageService                            │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ 1. Check if blob/data URL (needs upload)                │ │
│  │ 2. If existing path, verify with getPublicUrl()         │ │
│  │ 3. Upload to 'attachments' bucket if needed             │ │
│  │ 4. Return updated RAFile with path + public URL         │ │
│  └────────────────────────────────────────────────────────┘ │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
                    Supabase Storage
                    (attachments bucket)
```

### Blob/Data URL Detection

```typescript
// src/atomic-crm/providers/supabase/services/StorageService.ts:29-43

async uploadToBucket(fi: RAFile): Promise<RAFile> {
  // Skip upload if NOT a blob or data URL (already uploaded)
  if (!fi.src.startsWith("blob:") && !fi.src.startsWith("data:")) {
    // Verify file exists via public URL check
    if (fi.path) {
      try {
        const { data } = supabase.storage.from("attachments").getPublicUrl(fi.path);
        if (data?.publicUrl) {
          return fi;  // File exists, return unchanged
        }
      } catch {
        // File doesn't exist, proceed with upload
      }
    }
  }
  // ... upload logic
}
```

### File Naming Pattern

Files are stored with randomized names to prevent:
- **Filename collisions**: Multiple users uploading `resume.pdf`
- **Enumeration attacks**: Predictable paths like `/attachments/1.pdf`, `/attachments/2.pdf`

```typescript
// src/atomic-crm/providers/supabase/services/StorageService.ts:48-50

const fileExt = file.name.split(".").pop();
const fileName = `${Math.random()}.${fileExt}`;
const filePath = `${fileName}`;
```

**Note**: `Math.random()` produces values like `0.7349823749823`, resulting in paths like `0.7349823749823.pdf`. This is sufficient for the current scale but could be improved with `crypto.randomUUID()` for production.

### File Size Validation

```typescript
// src/atomic-crm/providers/supabase/services/StorageService.ts:77-81

async upload(bucket: string, path: string, file: File | Blob): Promise<{ path: string }> {
  // Validate file size (10MB limit)
  if (file.size > 10 * 1024 * 1024) {
    throw new HttpError("File size exceeds 10MB limit", 413);
  }
  // ...
}
```

---

## Code Examples

### Correct Pattern - Service Usage

```typescript
// In unifiedDataProvider.ts or feature handler

import { StorageService } from "./services/StorageService";

const storageService = new StorageService();

async function handleFileUpload(record: ContactData) {
  if (record.avatar) {
    // Service handles blob detection, existence check, and upload
    record.avatar = await storageService.uploadToBucket(record.avatar);
  }
  return record;
}
```

### Correct Pattern - Checking File Existence

```typescript
// Before referencing a stored file

const exists = await storageService.exists("attachments", "0.123456789.pdf");
if (!exists) {
  // Handle missing file - maybe re-request upload
  throw new Error("Referenced file no longer exists");
}
```

### Correct Pattern - Getting Public URLs

```typescript
// For displaying images or download links

const publicUrl = storageService.getPublicUrl("attachments", file.path);
// Returns: https://xxx.supabase.co/storage/v1/object/public/attachments/0.123.pdf
```

### Correct Pattern - Cleanup on Delete

```typescript
// When deleting a record with attachments

async function deleteContact(id: number, contact: Contact) {
  if (contact.avatar?.path) {
    await storageService.remove("attachments", [contact.avatar.path]);
  }
  // Then delete the database record
}
```

---

## Anti-Patterns

### 1. Embedding Storage Logic in Provider (NEVER DO THIS)

```typescript
// WRONG: Storage logic mixed with data operations
async function create(resource, params) {
  const data = params.data;

  // 50+ lines of file handling inline
  if (data.avatar && data.avatar.src.startsWith("blob:")) {
    const blob = await fetch(data.avatar.src).then(r => r.blob());
    const ext = data.avatar.rawFile.name.split(".").pop();
    const path = `${Math.random()}.${ext}`;
    // ... more file logic polluting the provider
  }

  // Finally, the actual create operation
  return baseProvider.create(resource, { data });
}
```

### 2. Always Re-uploading Files (NEVER DO THIS)

```typescript
// WRONG: Re-uploads existing files on every save
async function uploadToBucket(fi: RAFile) {
  // Missing existence check - wastes bandwidth
  const blob = await fetch(fi.src).then(r => r.blob());
  await supabase.storage.from("attachments").upload(path, blob);
  // Existing file overwritten needlessly
}
```

### 3. Predictable File Paths (NEVER DO THIS)

```typescript
// WRONG: Sequential or predictable naming
let fileCounter = 0;
const path = `uploads/${++fileCounter}.pdf`;
// Attackers can enumerate: /uploads/1.pdf, /uploads/2.pdf, ...
```

### 4. Direct Supabase Imports in Components (NEVER DO THIS)

```typescript
// WRONG: Components importing supabase directly
import { supabase } from "@/lib/supabase";

function AvatarUpload({ onUpload }) {
  const handleFile = async (file) => {
    // Violates single entry point principle
    const { data } = await supabase.storage
      .from("attachments")
      .upload(`avatars/${file.name}`, file);
    onUpload(data);
  };
}
```

---

## API Reference

### StorageService Methods

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `uploadToBucket` | `RAFile` | `Promise<RAFile>` | Smart upload with existence check |
| `upload` | `bucket, path, File` | `Promise<{path}>` | Direct upload with size validation |
| `getPublicUrl` | `bucket, path` | `string` | Generate public URL |
| `remove` | `bucket, paths[]` | `Promise<void>` | Delete files |
| `list` | `bucket, path?` | `Promise<FileObject[]>` | List bucket contents |
| `exists` | `bucket, path` | `Promise<boolean>` | Check if file exists |

---

## Consequences

### Positive

- **Single Responsibility**: Storage logic isolated from data operations
- **Testability**: Service can be unit tested with mocked Supabase client
- **Bandwidth Efficiency**: Existence checking prevents redundant uploads
- **Consistent API**: All storage operations through one interface
- **Error Handling**: Centralized storage error handling with appropriate HTTP codes

### Negative

- **Additional Abstraction**: One more class to understand and maintain
- **Instantiation Required**: Service must be instantiated (could be singleton)
- **Random Naming**: Filenames lose original names (could store in metadata)

### Neutral

- **10MB Limit**: Matches CSV upload limit, sufficient for attachments
- **Public Bucket**: `attachments` bucket is public (appropriate for CRM assets)

---

## Related ADRs

- **[ADR-001: Unified Data Provider Entry Point](./ADR-001-unified-data-provider.md)** - The provider that uses StorageService
- **[ADR-009: Composed Data Provider Pattern](./ADR-009-composed-data-provider.md)** - How services compose in the provider
- **[ADR-028: CSV Upload Validation](./ADR-028-csv-upload-validation.md)** - File validation before storage

---

## References

- Implementation: `src/atomic-crm/providers/supabase/services/StorageService.ts`
- RAFile Type: `src/atomic-crm/types/index.ts`
- Supabase Storage Docs: https://supabase.com/docs/guides/storage
- Original extraction commit: Provider refactoring for SRP compliance
