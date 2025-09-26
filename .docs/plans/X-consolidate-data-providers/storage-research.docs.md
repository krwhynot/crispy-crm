# Storage and File Upload Research

Comprehensive analysis of file storage, upload patterns, and Supabase Storage usage in the Atomic CRM codebase.

## Relevant Files

- `/src/atomic-crm/providers/supabase/dataProvider.ts`: Main data provider with `uploadToBucket` function
- `/src/components/admin/file-input.tsx`: React Admin file input component with dropzone
- `/src/atomic-crm/misc/ImageEditorField.tsx`: Avatar/image cropping and editing component
- `/src/atomic-crm/notes/NoteAttachments.tsx`: Attachment display component for notes
- `/src/atomic-crm/contacts/Avatar.tsx`: Contact avatar display component
- `/src/atomic-crm/organizations/OrganizationInputs.tsx`: Organization form with logo upload
- `/src/atomic-crm/providers/commons/getContactAvatar.ts`: Contact avatar generation (Gravatar/favicon)
- `/src/atomic-crm/providers/commons/getOrganizationAvatar.ts`: Organization logo generation (favicon)
- `/src/atomic-crm/validation/notes.ts`: Zod validation schemas for attachments
- `/src/atomic-crm/types.ts`: RAFile and AttachmentNote type definitions
- `/supabase/config.toml`: Storage configuration (50MiB file size limit)

## Current File Upload Flow

### 1. Core Upload Function (`uploadToBucket`)
Located in data provider, handles all file uploads to Supabase Storage:

**Process Flow:**
1. **Path Validation**: Checks if file already exists in bucket using signed URL
2. **File Processing**: Converts blob/data URLs to file objects via `fetch()`
3. **Upload to Bucket**: Uploads to "attachments" bucket with random filename
4. **URL Generation**: Creates public URL and updates RAFile object
5. **Metadata Storage**: Saves MIME type and file path

**Key Features:**
- Uses random filename generation: `${Math.random()}.${fileExt}`
- Single "attachments" bucket for all files
- Public URL generation via `getPublicUrl()`
- Automatic MIME type detection and storage

### 2. Lifecycle Integration
Data provider uses React Admin lifecycle callbacks for automatic upload:

**Triggered Resources:**
- `contactNotes`: Uploads all attachments before save
- `opportunityNotes`: Uploads all attachments before save
- `sales`: Uploads avatar before save
- `organizations`: Processes logo on create/update via `processCompanyLogo`
- `contacts`: Processes avatar on create/update via `processContactAvatar`

## Storage Bucket Organization

### Single Bucket Architecture
- **Bucket Name**: "attachments"
- **File Structure**: Flat structure with random filenames
- **Access**: Public URLs for all uploaded files
- **Size Limit**: 50MiB per file (configured in supabase/config.toml)

### File Types Supported
Based on validation schemas and components:

**Attachments (Notes):**
- Documents: `.pdf`, `.doc`, `.docx`, `.txt`
- Images: `.png`, `.jpg`, `.jpeg`
- Size limit: 10MB (validation layer)

**Avatars/Logos:**
- Images: `.jpeg`, `.png` (ImageEditorField)
- Automatic cropping and resizing
- Fallback generation for missing avatars

## File Processing Functions

### Avatar Generation
**Contact Avatars (`getContactAvatar`):**
1. **Gravatar**: Attempts SHA-256 hashed email lookup
2. **Domain Favicon**: Falls back to email domain favicon
3. **Future**: LinkedIn image lookup (TODO comment)

**Organization Logos (`getOrganizationAvatar`):**
1. **Future**: LinkedIn lookup (TODO comment)
2. **Website Favicon**: Uses `https://favicon.show/${domain}` service

### Image Processing (`ImageEditorField`)
**Features:**
- Drag-and-drop file upload via react-dropzone
- Integrated Cropper.js for image editing
- Circular cropping for avatars
- Real-time preview and cropping
- Form integration with React Hook Form

**Process:**
1. File selection via dropzone
2. Preview generation with `URL.createObjectURL()`
3. Cropper.js integration for editing
4. Canvas export to base64 data URL
5. Form value update with RAFile object

## Components That Handle File Uploads

### 1. FileInput Component (`/components/admin/file-input.tsx`)
**React Admin integrated file input:**
- Multi-file support via `multiple` prop
- Drag-and-drop interface with react-dropzone
- File validation (size, type, count)
- Preview and removal functionality
- Integration with React Admin form validation

### 2. ImageEditorField (`/misc/ImageEditorField.tsx`)
**Specialized image/avatar uploader:**
- Avatar and general image support
- Integrated cropping with Cropper.js
- Dialog-based editing interface
- Automatic circular cropping for avatars
- Direct form integration

### 3. NoteAttachments (`/notes/NoteAttachments.tsx`)
**Display component for uploaded attachments:**
- Image attachments: Grid display with click-to-view
- Non-image attachments: List with download links
- MIME type detection for proper display
- Paperclip icon for document attachments

## Storage-Related Utility Functions

### 1. File Transformation (`FileInput`)
```typescript
const transformFile = (file: File) => ({
  rawFile: file,
  src: URL.createObjectURL(file),
  title: file.name,
});
```

### 2. Upload Integration (Data Provider)
```typescript
const uploadToBucket = async (fi: RAFile) => {
  // Path existence check
  // File upload to Supabase Storage
  // Public URL generation
  // Metadata updates
};
```

### 3. Avatar Fallback Generation
- Contact: Gravatar → domain favicon → LinkedIn (future)
- Organization: LinkedIn (future) → website favicon

## Database Schema Integration

### Attachment Storage
**Table Fields:**
- `contactNotes.attachments`: TEXT[] array of file paths/URLs
- `opportunityNotes.attachments`: TEXT[] array of file paths/URLs
- `activities.attachments`: TEXT[] array for activity attachments

**Avatar/Logo Fields:**
- Contact avatar stored as RAFile object in database
- Organization logo stored as RAFile object in database
- Sales user avatar stored as RAFile object

## Gotchas & Edge Cases

### 1. Random Filename Generation
- Risk of filename collisions with `Math.random()`
- No organized folder structure
- Difficult to track file ownership without database references

### 2. Public URL Access
- All uploaded files are publicly accessible
- No access control at storage level
- Relies on URL obscurity for security

### 3. Storage Cleanup
- No automatic cleanup for deleted records
- Orphaned files may accumulate in storage
- Manual cleanup required for file management

### 4. File Path Handling
- Mixed storage of file paths vs URLs in database arrays
- Inconsistent path format between different upload contexts
- Path validation relies on signed URL availability check

### 5. Avatar Processing
- Contact avatar processing only on create/update, not automatic refresh
- Organization logo processing bypassed if file object already has src
- Fallback avatar generation may fail silently

### 6. Type Safety
- RAFile type requires rawFile: File but may not always be present
- AttachmentNote type alias doesn't add semantic meaning
- Mixed string/File handling in upload pipeline

## Relevant Docs

- [Supabase Storage Documentation](https://supabase.com/docs/guides/storage)
- [React Dropzone](https://react-dropzone.js.org/)
- [Cropper.js Documentation](https://fengyuanchen.github.io/cropperjs/)
- [React Admin File Input Guide](https://marmelab.com/react-admin/FileInput.html)