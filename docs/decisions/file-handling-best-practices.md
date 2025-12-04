# File Handling: Industry Standards & Best Practices

> **Generated:** 2025-12-03
> **Purpose:** Document industry standards, must-follows, and best practices for the file handling stack used in Crispy CRM.

---

## Technology Stack Overview

| Technology     | Version | Purpose           | Standards Reference |
|----------------|---------|-------------------|---------------------|
| PapaParse      | 5.5.3   | CSV parsing       | [RFC 4180](https://www.rfc-editor.org/rfc/rfc4180.html) |
| jsonexport     | 3.2.0   | JSON → CSV export | [RFC 4180](https://www.rfc-editor.org/rfc/rfc4180.html) |
| react-dropzone | 14.3.8  | File upload UI    | [OWASP File Upload Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/File_Upload_Cheat_Sheet.html) |
| react-cropper  | 2.3.3   | Image cropping    | [Cropper.js API](https://github.com/fengyuanchen/cropperjs) |

---

## 1. PapaParse (CSV Parsing)

### Industry Standard: RFC 4180
PapaParse is **fully RFC 4180 compliant**, the only formal standard for CSV files.

### Key Features & Best Practices

| Feature | Best Practice | Why |
|---------|--------------|-----|
| **Streaming** | Use `step` callback for large files | Prevents memory exhaustion |
| **Web Workers** | Enable `worker: true` for files >1MB | Keeps UI responsive |
| **Header Row** | Set `header: true` | Returns objects vs arrays |
| **Type Conversion** | Use `dynamicTyping: true` | Auto-converts numbers/booleans |
| **Delimiter Detection** | Use `delimiter: ""` (auto-detect) | Handles tabs, semicolons, etc. |

### MUST-FOLLOW Rules

```typescript
// ✅ CORRECT: Streaming with error handling
Papa.parse(file, {
  worker: true,                    // Don't block main thread
  header: true,                    // Object output
  dynamicTyping: true,             // Auto-type conversion
  skipEmptyLines: 'greedy',        // Remove blank rows
  step: (row, parser) => {
    if (row.errors.length > 0) {
      parser.abort();              // Fail fast on parse errors
      throw new Error(row.errors[0].message);
    }
    processRow(row.data);
  },
  error: (error) => {
    throw error;                   // Fail fast principle
  }
});

// ❌ WRONG: Loading entire file into memory
const results = Papa.parse(hugeFile, { header: true });
```

### Security Considerations

| Risk | Mitigation |
|------|------------|
| Memory exhaustion | Stream large files, set `preview` limit |
| Malformed data | Enable `transform` for sanitization |
| Encoding issues | Specify `encoding: 'UTF-8'` explicitly |

---

## 2. jsonexport (JSON → CSV Export)

### Purpose
Converts JavaScript objects/arrays to CSV format for Excel export functionality.

### Key Features & Configuration

| Option | Default | Best Practice |
|--------|---------|--------------|
| `rowDelimiter` | `,` | Use `,` for Excel compatibility |
| `textDelimiter` | `"` | Keep as quote for RFC 4180 |
| `endOfLine` | `\n` | Use `\r\n` for Windows/Excel |
| `headers` | Auto | Explicitly define for consistent output |
| `typeHandlers` | None | Define for Date, Boolean, null handling |

### MUST-FOLLOW: CSV Injection Prevention

**Critical Security Concern:** CSV files can contain malicious formulas that execute when opened in Excel.

```typescript
// ✅ CORRECT: Sanitize formula-triggering characters
const sanitizeForCSV = (value: string): string => {
  if (typeof value !== 'string') return value;

  // Prefix with tab if starts with formula triggers
  const formulaTriggers = ['=', '-', '+', '@', '\t', '\r'];
  if (formulaTriggers.some(char => value.startsWith(char))) {
    return `\t${value}`;  // Tab prefix neutralizes formulas
  }
  return value;
};

// Apply to all exported data
const safeData = data.map(row =>
  Object.fromEntries(
    Object.entries(row).map(([key, value]) =>
      [key, sanitizeForCSV(String(value))]
    )
  )
);

jsonexport(safeData, {
  rowDelimiter: ',',
  endOfLine: '\r\n',  // Windows/Excel compatibility
}, callback);
```

### Best Practice Configuration

```typescript
import jsonexport from 'jsonexport';

const exportToCSV = async (data: unknown[]): Promise<string> => {
  return new Promise((resolve, reject) => {
    jsonexport(data, {
      // RFC 4180 compliance
      rowDelimiter: ',',
      textDelimiter: '"',
      endOfLine: '\r\n',

      // Type handlers for consistent output
      typeHandlers: {
        Boolean: (value: boolean) => value ? 'Yes' : 'No',
        Date: (value: Date) => value.toISOString().split('T')[0],
        Undefined: () => '',
        Null: () => '',
      },
    }, (err, csv) => {
      if (err) reject(err);
      else resolve(csv);
    });
  });
};
```

### HTTP Response Headers for Downloads

```typescript
// MUST set proper headers for CSV downloads
res.setHeader('Content-Type', 'text/csv; charset=utf-8');
res.setHeader('Content-Disposition', 'attachment; filename="export.csv"');
```

---

## 3. react-dropzone (File Upload UI)

### Industry Standard: OWASP File Upload Cheat Sheet

### MUST-FOLLOW Security Rules

| Rule | Implementation | Risk Mitigated |
|------|----------------|----------------|
| **Allowlist Extensions** | `accept: { 'image/*': ['.png', '.jpg'] }` | Arbitrary file upload |
| **Validate Server-Side** | Never trust client validation alone | Client bypass |
| **Limit File Size** | `maxSize: 5 * 1024 * 1024` (5MB) | DoS attacks |
| **Validate Content-Type** | Check magic bytes server-side | MIME spoofing |
| **Generate Filenames** | UUID server-side, not user input | Path traversal |

### Best Practice Implementation

```tsx
import { useDropzone } from 'react-dropzone';

// ✅ CORRECT: Full validation with accessibility
function SecureDropzone({ onUpload }: { onUpload: (files: File[]) => void }) {
  const {
    getRootProps,
    getInputProps,
    isDragActive,
    fileRejections,
  } = useDropzone({
    // Allowlist - not denylist
    accept: {
      'image/png': ['.png'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'text/csv': ['.csv'],
    },

    // Size limits (5MB max)
    maxSize: 5 * 1024 * 1024,

    // Single file to reduce attack surface
    multiple: false,

    // Custom validation
    validator: (file) => {
      // Filename length limit
      if (file.name.length > 255) {
        return { code: 'name-too-long', message: 'Filename exceeds 255 characters' };
      }
      // Block dangerous characters
      if (/[<>:"/\\|?*]/.test(file.name)) {
        return { code: 'invalid-chars', message: 'Filename contains invalid characters' };
      }
      return null;
    },

    onDrop: (acceptedFiles) => {
      // Additional client-side checks before upload
      onUpload(acceptedFiles);
    },
  });

  return (
    <div
      {...getRootProps()}
      className="border-2 border-dashed p-8 rounded-lg"
      role="button"
      aria-label="Upload file"
      tabIndex={0}
    >
      <input {...getInputProps()} aria-describedby="upload-help" />
      <p id="upload-help">
        {isDragActive ? 'Drop file here...' : 'Drag file or click to upload'}
      </p>

      {/* Accessible error display */}
      {fileRejections.length > 0 && (
        <ul role="alert" aria-live="polite" className="text-destructive mt-2">
          {fileRejections.map(({ file, errors }) => (
            <li key={file.name}>
              {file.name}: {errors.map(e => e.message).join(', ')}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

### Server-Side Validation (CRITICAL)

Client-side validation is UX only. **All security validation MUST happen server-side:**

```typescript
// Edge Function / API Route
const validateUpload = async (file: File): Promise<void> => {
  // 1. Size check
  if (file.size > 5 * 1024 * 1024) {
    throw new Error('File exceeds 5MB limit');
  }

  // 2. Extension allowlist (NEVER denylist)
  const allowedExtensions = ['.png', '.jpg', '.jpeg', '.csv'];
  const ext = file.name.toLowerCase().slice(file.name.lastIndexOf('.'));
  if (!allowedExtensions.includes(ext)) {
    throw new Error('File type not allowed');
  }

  // 3. Magic byte validation (don't trust Content-Type)
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer.slice(0, 4));
  const magicBytes = {
    png: [0x89, 0x50, 0x4E, 0x47],
    jpg: [0xFF, 0xD8, 0xFF],
  };
  // Verify magic bytes match expected format...

  // 4. Generate safe filename (UUID)
  const safeFilename = `${crypto.randomUUID()}${ext}`;

  // 5. Store outside webroot or in protected storage
};
```

### Accessibility Requirements

| Requirement | Implementation |
|-------------|----------------|
| Keyboard accessible | `tabIndex={0}` on dropzone |
| Screen reader support | `role="button"` + `aria-label` |
| Error announcements | `role="alert"` + `aria-live="polite"` |
| Focus management | Focus dropzone after rejection |

### Known Caveats

1. **Don't use `<label>` as root** - Opens dialog twice
2. **Use `noClick` with custom buttons** - Prevents double-open
3. **File paths not available** - Browser security restriction
4. **React 16.8+ required** - Hook-based architecture

---

## 4. react-cropper (Image Cropping)

### Library Architecture
`react-cropper` wraps Cropper.js, which is now modular (v2.x uses web components).

### Key Configuration Options

| Option | Type | Best Practice |
|--------|------|---------------|
| `aspectRatio` | `number` | Set for profile pics (1), covers (16/9) |
| `viewMode` | `0-3` | Use `1` (restrict to image bounds) |
| `guides` | `boolean` | Enable for user guidance |
| `autoCropArea` | `0-1` | `0.8` for reasonable default crop |
| `responsive` | `boolean` | `true` for mobile support |
| `checkOrientation` | `boolean` | `true` for camera photos |

### Best Practice Implementation

```tsx
import Cropper from 'react-cropper';
import 'cropperjs/dist/cropper.css';

interface ImageCropperProps {
  src: string;
  aspectRatio?: number;
  onCrop: (dataUrl: string) => void;
}

function ImageCropper({ src, aspectRatio = 1, onCrop }: ImageCropperProps) {
  const cropperRef = useRef<ReactCropperElement>(null);

  const handleCrop = () => {
    const cropper = cropperRef.current?.cropper;
    if (!cropper) return;

    // Get cropped canvas with size limits
    const canvas = cropper.getCroppedCanvas({
      maxWidth: 1024,   // Prevent huge outputs
      maxHeight: 1024,
      imageSmoothingEnabled: true,
      imageSmoothingQuality: 'high',
    });

    // Convert to optimized format
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    onCrop(dataUrl);
  };

  return (
    <div role="application" aria-label="Image cropper">
      <Cropper
        ref={cropperRef}
        src={src}
        style={{ height: 400, width: '100%' }}
        aspectRatio={aspectRatio}
        viewMode={1}              // Restrict to image bounds
        guides={true}             // Show grid guides
        autoCropArea={0.8}        // 80% default selection
        responsive={true}         // Mobile support
        checkOrientation={true}   // Handle camera EXIF
        background={false}        // Transparent bg
      />
      <button onClick={handleCrop} className="mt-4">
        Apply Crop
      </button>
    </div>
  );
}
```

### Image Security Considerations

| Risk | Mitigation |
|------|------------|
| Malicious image payloads | Re-encode images server-side |
| Steganography | Strip EXIF metadata |
| Large dimensions | Limit `maxWidth`/`maxHeight` |
| Memory exhaustion | Resize before loading into cropper |

### Output Best Practices

```typescript
// ✅ CORRECT: Controlled output size and format
const getCroppedImage = (cropper: Cropper): Blob => {
  const canvas = cropper.getCroppedCanvas({
    maxWidth: 512,       // Profile pic size limit
    maxHeight: 512,
    fillColor: '#fff',   // Background for transparent images
  });

  return new Promise((resolve) => {
    canvas.toBlob(
      (blob) => resolve(blob!),
      'image/jpeg',      // Smaller than PNG
      0.85               // Quality/size balance
    );
  });
};
```

---

## Cross-Cutting Security Standards

### OWASP File Upload Requirements

| Requirement | Status | Implementation |
|-------------|--------|----------------|
| Extension allowlist | Required | Configure in dropzone `accept` |
| Content-Type validation | Required | Magic byte check server-side |
| Filename sanitization | Required | UUID generation server-side |
| Size limits | Required | `maxSize` client + server |
| Storage outside webroot | Required | Supabase Storage / S3 |
| Authentication required | Required | RLS policies |
| Antivirus scanning | Recommended | CDR service if handling untrusted files |

### CSV Injection Prevention (OWASP)

| Dangerous Character | Risk | Mitigation |
|---------------------|------|------------|
| `=` | Formula execution | Tab prefix |
| `-` | Negative formula | Tab prefix |
| `+` | Formula prefix | Tab prefix |
| `@` | External link | Tab prefix |
| `\t` `\r` | Cell manipulation | Tab prefix |

### Accessibility Standards (WCAG 2.1 AA)

| Component | Requirement |
|-----------|-------------|
| File dropzone | Keyboard operable, role="button" |
| Error messages | role="alert", aria-live |
| Image cropper | aria-label describing purpose |
| Progress indicators | aria-busy, aria-valuenow |

---

## Quick Reference: Configuration Checklist

### PapaParse

- [ ] `worker: true` for files > 1MB
- [ ] `header: true` for object output
- [ ] `skipEmptyLines: 'greedy'`
- [ ] Error handler with fail-fast

### jsonexport

- [ ] CSV injection sanitization
- [ ] `endOfLine: '\r\n'` for Excel
- [ ] Type handlers for dates/booleans
- [ ] Proper Content-Type/Disposition headers

### react-dropzone

- [ ] Extension allowlist (never denylist)
- [ ] `maxSize` limit configured
- [ ] Custom validator for filename
- [ ] Server-side validation implemented
- [ ] Accessible attributes added

### react-cropper

- [ ] `aspectRatio` set for use case
- [ ] `maxWidth`/`maxHeight` on output
- [ ] `checkOrientation: true` for photos
- [ ] Output quality optimized (0.85 JPEG)

---

## Sources

- [RFC 4180: CSV Standard](https://www.rfc-editor.org/rfc/rfc4180.html)
- [OWASP File Upload Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/File_Upload_Cheat_Sheet.html)
- [OWASP CSV Injection](https://owasp.org/www-community/attacks/CSV_Injection)
- [OWASP Input Validation Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Input_Validation_Cheat_Sheet.html)
- [PapaParse Documentation](https://www.papaparse.com/docs)
- [react-dropzone GitHub](https://github.com/react-dropzone/react-dropzone)
- [Cropper.js API Documentation](https://github.com/fengyuanchen/cropperjs)
- [jsonexport GitHub](https://github.com/kaue/jsonexport)
- [CSV Injection Prevention Best Practices](https://www.cyberchief.ai/2024/09/csv-formula-injection-attacks.html)
