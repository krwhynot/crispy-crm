# CSV Import UI Implementation Plan

## Overview

This document provides a detailed implementation plan for the CSV import UI components. It follows React Admin patterns, Material-UI design principles, and the existing atomic-crm module structure.

## Component Architecture

### File Structure
```
src/atomic-crm/contacts/
├── ContactImportButton.tsx       # Entry point - toolbar button
├── ContactImportDialog.tsx       # Main dialog orchestrator
├── ContactImportPreview.tsx      # Preview & validation display
├── ContactImportProgress.tsx     # Progress bar during import
├── ContactImportResult.tsx       # Final results modal
├── useContactImport.tsx          # Business logic hook (exists)
└── columnAliases.ts              # Column mapping registry
```

### Component Responsibilities

| Component | Purpose | Key Features |
|-----------|---------|--------------|
| ContactImportButton | Toolbar integration point | Opens dialog, manages top-level state |
| ContactImportDialog | Main orchestrator | State machine, step management, file handling |
| ContactImportPreview | Validation display | Column mappings, entity details, warnings |
| ContactImportProgress | Real-time progress | Progress bar, ETA, error count, stop button |
| ContactImportResult | Final summary | Success/error details, downloadable report |

## State Machine Implementation

### State Definitions
```typescript
type ImportState =
  | 'idle'        // Initial state - file selector shown
  | 'parsing'     // PapaParse is reading the CSV
  | 'previewing'  // Showing validation results
  | 'running'     // Import in progress
  | 'complete'    // Success state with results
  | 'error';      // Error state with details
```

### State Transitions
```
idle → parsing → previewing → running → complete
         ↓           ↓           ↓         ↓
       error       error       error     error
```

### Implementation Pattern
```typescript
function ContactImportDialog({ open, onClose }) {
  const [state, setState] = useState<ImportState>('idle');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<PreviewData | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      setState('idle');
      setFile(null);
      setPreview(null);
      setResult(null);
    }
  }, [open]);

  // State machine prevents impossible transitions
  const canProceed = {
    idle: ['parsing'],
    parsing: ['previewing', 'error'],
    previewing: ['running', 'idle'],
    running: ['complete', 'error'],
    complete: ['idle'],
    error: ['idle']
  };

  const transition = (newState: ImportState) => {
    if (canProceed[state].includes(newState)) {
      setState(newState);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      {state === 'idle' && <FileSelector onSelect={handleFileSelect} />}
      {state === 'parsing' && <LoadingIndicator />}
      {state === 'previewing' && <ContactImportPreview preview={preview} />}
      {state === 'running' && <ContactImportProgress progress={progress} />}
      {state === 'complete' && <ContactImportResult result={result} />}
      {state === 'error' && <ErrorDisplay error={error} onRetry={handleRetry} />}
    </Dialog>
  );
}
```

## Component Implementations

### 1. ContactImportButton

**Location**: `src/atomic-crm/contacts/ContactImportButton.tsx`

```typescript
import { Button } from 'react-admin';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import { useState } from 'react';
import ContactImportDialog from './ContactImportDialog';

export function ContactImportButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        label="Import CSV"
        onClick={() => setOpen(true)}
        startIcon={<CloudUploadIcon />}
      />
      <ContactImportDialog
        open={open}
        onClose={() => setOpen(false)}
      />
    </>
  );
}
```

**Integration Point**: Add to `ContactList.tsx` toolbar:
```typescript
const ListActions = () => (
  <TopToolbar>
    <CreateButton />
    <ContactImportButton />  {/* New button */}
    <ExportButton />
  </TopToolbar>
);
```

### 2. File Upload Section

**Features**:
- HTML5 file input with drag-and-drop
- File size warning for files > 10MB
- Template download link
- Clear file requirements display

```typescript
function FileSelector({ onSelect }) {
  const notify = useNotify();
  const [dragActive, setDragActive] = useState(false);

  const handleFile = (file: File) => {
    // Security check
    if (!file.name.endsWith('.csv')) {
      notify('Please select a CSV file', { type: 'error' });
      return;
    }

    // Size warning (non-blocking)
    if (file.size > 10 * 1024 * 1024) { // 10MB
      notify(
        'Large file detected. This may impact browser performance. ' +
        'Consider splitting into smaller files.',
        { type: 'warning' }
      );
    }

    onSelect(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <Box
      sx={{
        p: 4,
        textAlign: 'center',
        border: '2px dashed',
        borderColor: dragActive ? 'primary.main' : 'divider',
        borderRadius: 2,
        bgcolor: dragActive ? 'action.hover' : 'background.paper',
        transition: 'all 0.2s'
      }}
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
    >
      <CloudUploadIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />

      <Typography variant="h6" gutterBottom>
        Upload Contacts CSV
      </Typography>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Drag and drop your CSV file here, or click to browse
      </Typography>

      <Button variant="contained" component="label">
        Choose File
        <input
          type="file"
          accept=".csv"
          hidden
          onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
        />
      </Button>

      <Box sx={{ mt: 3 }}>
        <Link
          href="/templates/contacts-import.csv"
          download
          sx={{ display: 'inline-flex', alignItems: 'center', gap: 1 }}
        >
          <DownloadIcon fontSize="small" />
          Download Template
        </Link>
      </Box>

      <Typography variant="caption" display="block" sx={{ mt: 2 }}>
        Maximum file size: 50MB • Format: CSV (UTF-8)
      </Typography>
    </Box>
  );
}
```

### 3. Preview Component

**Location**: `src/atomic-crm/contacts/ContactImportPreview.tsx`

```typescript
function ContactImportPreview({
  preview,
  onContinue,
  onCancel,
  onRemap // Phase 2
}) {
  const [expandedSections, setExpandedSections] = useState({
    organizations: false,
    tags: false,
    errors: false
  });

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  return (
    <Box sx={{ p: 2 }}>
      <DialogTitle>Preview Import</DialogTitle>

      <DialogContent>
        {/* Step indicator */}
        <Stepper activeStep={1} sx={{ mb: 3 }}>
          <Step completed><StepLabel>Upload</StepLabel></Step>
          <Step active><StepLabel>Preview</StepLabel></Step>
          <Step><StepLabel>Import</StepLabel></Step>
          <Step><StepLabel>Complete</StepLabel></Step>
        </Stepper>

        {/* Column Mapping Table */}
        <Typography variant="subtitle2" gutterBottom>
          Column Mappings
        </Typography>
        <TableContainer component={Paper} variant="outlined" sx={{ mb: 2 }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>CSV Column</TableCell>
                <TableCell align="center">→</TableCell>
                <TableCell>CRM Field</TableCell>
                <TableCell align="center">Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {preview.mappings.map((mapping, index) => (
                <TableRow key={index}>
                  <TableCell>{mapping.source}</TableCell>
                  <TableCell align="center">→</TableCell>
                  <TableCell>
                    {mapping.target ? (
                      <Chip
                        label={mapping.target}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                    ) : (
                      <Chip
                        label="Skipped"
                        size="small"
                        color="default"
                      />
                    )}
                  </TableCell>
                  <TableCell align="center">
                    {mapping.confidence >= 0.8 ? (
                      <CheckCircleIcon color="success" fontSize="small" />
                    ) : mapping.confidence >= 0.5 ? (
                      <WarningIcon color="warning" fontSize="small" />
                    ) : (
                      <HelpIcon color="disabled" fontSize="small" />
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Validation Summary */}
        <Alert
          severity={preview.hasErrors ? 'warning' : 'success'}
          sx={{ mb: 2 }}
        >
          <AlertTitle>
            {preview.hasErrors ? '⚠️ Review Required' : '✅ Ready to Import'}
          </AlertTitle>

          <List dense>
            <ListItem>
              <ListItemIcon><PersonIcon /></ListItemIcon>
              <ListItemText
                primary={`${preview.validCount} contacts will be imported`}
              />
            </ListItem>

            {preview.skipCount > 0 && (
              <ListItem>
                <ListItemIcon><SkipNextIcon /></ListItemIcon>
                <ListItemText
                  primary={`${preview.skipCount} rows will be skipped`}
                  secondary="Missing required fields"
                />
              </ListItem>
            )}

            {/* Collapsible Organizations Section */}
            {preview.newOrganizations.length > 0 && (
              <ListItem>
                <ListItemIcon><BusinessIcon /></ListItemIcon>
                <ListItemText
                  primary={`${preview.newOrganizations.length} new organizations will be created`}
                />
                <ListItemSecondaryAction>
                  <IconButton
                    size="small"
                    onClick={() => toggleSection('organizations')}
                  >
                    {expandedSections.organizations ? <ExpandLess /> : <ExpandMore />}
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
            )}
            <Collapse in={expandedSections.organizations}>
              <Box sx={{ pl: 7, pr: 2, pb: 1 }}>
                {preview.newOrganizations.map((org, index) => (
                  <Chip
                    key={index}
                    label={org}
                    size="small"
                    variant="outlined"
                    sx={{ m: 0.5 }}
                  />
                ))}
              </Box>
            </Collapse>

            {/* Collapsible Tags Section */}
            {preview.newTags.length > 0 && (
              <ListItem>
                <ListItemIcon><LabelIcon /></ListItemIcon>
                <ListItemText
                  primary={`${preview.newTags.length} new tags will be created`}
                />
                <ListItemSecondaryAction>
                  <IconButton
                    size="small"
                    onClick={() => toggleSection('tags')}
                  >
                    {expandedSections.tags ? <ExpandLess /> : <ExpandMore />}
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
            )}
            <Collapse in={expandedSections.tags}>
              <Box sx={{ pl: 7, pr: 2, pb: 1 }}>
                {preview.newTags.map((tag, index) => (
                  <Chip
                    key={index}
                    label={tag}
                    size="small"
                    color="secondary"
                    variant="outlined"
                    sx={{ m: 0.5 }}
                  />
                ))}
              </Box>
            </Collapse>
          </List>
        </Alert>

        {/* Validation Errors/Warnings */}
        {preview.errors.length > 0 && (
          <Alert severity="error" sx={{ mb: 2 }}>
            <AlertTitle>
              Validation Issues ({preview.errors.length})
              <IconButton
                size="small"
                onClick={() => toggleSection('errors')}
                sx={{ ml: 1 }}
              >
                {expandedSections.errors ? <ExpandLess /> : <ExpandMore />}
              </IconButton>
            </AlertTitle>
            <Collapse in={expandedSections.errors}>
              <List dense>
                {preview.errors.slice(0, 10).map((error, index) => (
                  <ListItem key={index}>
                    <ListItemText
                      primary={`Row ${error.row}: ${error.field}`}
                      secondary={error.message}
                    />
                  </ListItem>
                ))}
                {preview.errors.length > 10 && (
                  <ListItem>
                    <ListItemText
                      secondary={`... and ${preview.errors.length - 10} more errors`}
                    />
                  </ListItem>
                )}
              </List>
            </Collapse>
          </Alert>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onCancel}>Cancel</Button>
        {/* Phase 2: Interactive Remapping */}
        {preview.lowConfidenceMappings > 0 && (
          <Button onClick={onRemap} color="warning">
            Review Mappings
          </Button>
        )}
        <Button
          variant="contained"
          onClick={onContinue}
          disabled={preview.validCount === 0}
        >
          Continue Import ({preview.validCount} contacts)
        </Button>
      </DialogActions>
    </Box>
  );
}
```

### 4. Progress Component

**Location**: `src/atomic-crm/contacts/ContactImportProgress.tsx`

```typescript
function ContactImportProgress({
  progress,
  onStop
}) {
  const {
    processed,
    total,
    errors,
    timeRemaining,
    currentBatch,
    averageSpeed
  } = progress;

  const percentage = (processed / total) * 100;

  return (
    <Box sx={{ p: 3 }}>
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <span>Importing Contacts...</span>
          <Chip
            label={`Batch ${currentBatch}`}
            size="small"
            color="primary"
          />
        </Box>
      </DialogTitle>

      <DialogContent>
        {/* Main Progress */}
        <Box sx={{ mb: 3 }}>
          <Box display="flex" justifyContent="space-between" sx={{ mb: 1 }}>
            <Typography variant="h5">
              {processed.toLocaleString()} / {total.toLocaleString()}
            </Typography>
            <Typography variant="h5" color="primary">
              {Math.round(percentage)}%
            </Typography>
          </Box>

          <LinearProgress
            variant="determinate"
            value={percentage}
            sx={{
              height: 12,
              borderRadius: 1,
              '& .MuiLinearProgress-bar': {
                borderRadius: 1,
                background: errors.length > 0
                  ? 'linear-gradient(90deg, var(--primary) 0%, var(--warning) 100%)'
                  : undefined
              }
            }}
          />
        </Box>

        {/* Statistics Grid */}
        <Grid container spacing={2}>
          <Grid item xs={6}>
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Typography variant="caption" color="text.secondary">
                Processing Speed
              </Typography>
              <Typography variant="h6">
                {averageSpeed} contacts/sec
              </Typography>
            </Paper>
          </Grid>

          <Grid item xs={6}>
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Typography variant="caption" color="text.secondary">
                Time Remaining
              </Typography>
              <Typography variant="h6">
                {formatDuration(timeRemaining)}
              </Typography>
            </Paper>
          </Grid>

          <Grid item xs={6}>
            <Paper
              variant="outlined"
              sx={{
                p: 2,
                borderColor: 'success.main',
                bgcolor: 'success.lighter'
              }}
            >
              <Typography variant="caption" color="text.secondary">
                Successful
              </Typography>
              <Typography variant="h6" color="success.main">
                {(processed - errors.length).toLocaleString()}
              </Typography>
            </Paper>
          </Grid>

          <Grid item xs={6}>
            <Paper
              variant="outlined"
              sx={{
                p: 2,
                borderColor: errors.length > 0 ? 'error.main' : 'divider',
                bgcolor: errors.length > 0 ? 'error.lighter' : undefined
              }}
            >
              <Typography variant="caption" color="text.secondary">
                Errors
              </Typography>
              <Typography
                variant="h6"
                color={errors.length > 0 ? 'error.main' : 'text.primary'}
              >
                {errors.length}
              </Typography>
            </Paper>
          </Grid>
        </Grid>

        {/* Live Error Feed (Last 3) */}
        {errors.length > 0 && (
          <Alert severity="error" sx={{ mt: 2 }}>
            <AlertTitle>Recent Errors</AlertTitle>
            <List dense>
              {errors.slice(-3).map((error, index) => (
                <ListItem key={index}>
                  <ListItemText
                    primary={`Row ${error.row}`}
                    secondary={error.message}
                  />
                </ListItem>
              ))}
            </List>
          </Alert>
        )}
      </DialogContent>

      <DialogActions>
        <Button
          variant="outlined"
          color="error"
          onClick={onStop}
          startIcon={<StopIcon />}
        >
          Stop Import
        </Button>
      </DialogActions>
    </Box>
  );
}
```

### 5. Result Component

**Location**: `src/atomic-crm/contacts/ContactImportResult.tsx`

```typescript
function ContactImportResult({
  result,
  onClose,
  onDownloadReport // Phase 2
}) {
  const notify = useNotify();
  const [showErrors, setShowErrors] = useState(false);

  const copyErrorsToClipboard = () => {
    const errorText = result.errors
      .map(e => `Row ${e.row}: ${e.message}`)
      .join('\n');
    navigator.clipboard.writeText(errorText);
    notify('Errors copied to clipboard', { type: 'success' });
  };

  return (
    <Box sx={{ p: 3 }}>
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          {result.errors.length === 0 ? (
            <>
              <CheckCircleIcon color="success" />
              <span>Import Complete</span>
            </>
          ) : (
            <>
              <WarningIcon color="warning" />
              <span>Import Complete with Issues</span>
            </>
          )}
        </Box>
      </DialogTitle>

      <DialogContent>
        {/* Summary Statistics */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12}>
            <Paper
              elevation={0}
              sx={{
                p: 3,
                bgcolor: 'success.lighter',
                border: '1px solid',
                borderColor: 'success.main'
              }}
            >
              <Typography variant="h3" color="success.main" gutterBottom>
                {result.successCount.toLocaleString()}
              </Typography>
              <Typography variant="subtitle1">
                Contacts Successfully Imported
              </Typography>
            </Paper>
          </Grid>

          {result.newOrganizations > 0 && (
            <Grid item xs={6}>
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Typography variant="h6">
                  {result.newOrganizations}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  New Organizations Created
                </Typography>
              </Paper>
            </Grid>
          )}

          {result.newTags > 0 && (
            <Grid item xs={6}>
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Typography variant="h6">
                  {result.newTags}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  New Tags Created
                </Typography>
              </Paper>
            </Grid>
          )}
        </Grid>

        {/* Error Section */}
        {result.errors.length > 0 && (
          <Alert
            severity="error"
            sx={{ mb: 2 }}
            action={
              <Box>
                <IconButton
                  size="small"
                  onClick={() => setShowErrors(!showErrors)}
                >
                  {showErrors ? <ExpandLess /> : <ExpandMore />}
                </IconButton>
                <IconButton
                  size="small"
                  onClick={copyErrorsToClipboard}
                  title="Copy errors"
                >
                  <ContentCopyIcon />
                </IconButton>
              </Box>
            }
          >
            <AlertTitle>
              {result.errors.length} Import Errors
            </AlertTitle>
            <Typography variant="body2">
              These rows were not imported due to validation errors.
            </Typography>

            <Collapse in={showErrors}>
              <List dense sx={{ mt: 2 }}>
                {result.errors.map((error, index) => (
                  <ListItem key={index}>
                    <ListItemText
                      primary={`Row ${error.row}: ${error.field || 'General'}`}
                      secondary={error.message}
                    />
                  </ListItem>
                ))}
              </List>
            </Collapse>
          </Alert>
        )}

        {/* Processing Time */}
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          Total processing time: {formatDuration(result.totalTime)}
        </Typography>
      </DialogContent>

      <DialogActions>
        {result.errors.length > 0 && (
          <Button
            onClick={onDownloadReport}
            startIcon={<DownloadIcon />}
            disabled={!onDownloadReport} // Phase 2 feature
          >
            Download Error Report
          </Button>
        )}
        <Button
          variant="contained"
          onClick={onClose}
          autoFocus
        >
          Done
        </Button>
      </DialogActions>
    </Box>
  );
}
```

## Data Flow Implementation

### Column Mapping Algorithm

```typescript
// columnAliases.ts
export const columnAliases: Record<string, string[]> = {
  // Name fields
  'first_name': [
    'first name', 'first', 'fname', 'firstname',
    'given name', 'given_name', 'forename'
  ],
  'last_name': [
    'last name', 'last', 'lname', 'lastname',
    'surname', 'family name', 'family_name'
  ],
  'name': ['full name', 'fullname', 'name', 'contact name'],

  // Email fields
  'email_work': [
    'email', 'work email', 'business email', 'email_work',
    'professional email', 'company email'
  ],
  'email_home': [
    'personal email', 'home email', 'email_home',
    'private email'
  ],

  // Organization
  'organization_name': [
    'company', 'organization', 'org', 'business',
    'company name', 'employer', 'account'
  ],

  // Phone fields
  'phone_work': [
    'phone', 'work phone', 'business phone', 'office phone',
    'phone_work', 'tel', 'telephone'
  ],
  'phone_cell': [
    'mobile', 'cell', 'cell phone', 'mobile phone',
    'phone_mobile', 'phone_cell'
  ],

  // Tags
  'tags': ['tags', 'labels', 'categories', 'groups'],

  // Status
  'status': ['status', 'contact status', 'lead status', 'state']
};

// Mapping function with confidence scoring
export function mapColumns(headers: string[]): ColumnMapping[] {
  return headers.map(header => {
    const normalized = header.toLowerCase().trim();

    for (const [field, aliases] of Object.entries(columnAliases)) {
      // Exact match = high confidence
      if (aliases.includes(normalized)) {
        return {
          source: header,
          target: field,
          confidence: 1.0
        };
      }

      // Partial match = medium confidence
      const partialMatch = aliases.find(alias =>
        normalized.includes(alias) || alias.includes(normalized)
      );
      if (partialMatch) {
        return {
          source: header,
          target: field,
          confidence: 0.7
        };
      }
    }

    // No match
    return {
      source: header,
      target: null,
      confidence: 0
    };
  });
}
```

### Security Sanitization

```typescript
// utils/csvSanitizer.ts
export function sanitizeCSVData(data: any): any {
  const sanitized = { ...data };

  Object.keys(sanitized).forEach(key => {
    const value = sanitized[key];

    if (typeof value === 'string') {
      // CSV Formula Injection Protection
      if (/^[=+\-@]/.test(value)) {
        sanitized[key] = "'" + value;
      }

      // XSS Protection - Strip HTML tags
      sanitized[key] = sanitized[key].replace(/<[^>]*>/g, '');

      // Normalize whitespace
      sanitized[key] = sanitized[key].trim();
    }
  });

  return sanitized;
}
```

### DryRun Validation

```typescript
// In ContactImportDialog
async function validateWithDryRun(
  rows: any[],
  mappings: ColumnMapping[]
): Promise<ValidationResult> {
  const results = {
    valid: [],
    invalid: [],
    newOrganizations: new Set<string>(),
    newTags: new Set<string>()
  };

  // Test first 10 rows for preview
  const sample = rows.slice(0, Math.min(10, rows.length));

  for (const [index, row] of sample.entries()) {
    try {
      // Map CSV columns to CRM fields
      const mappedData = applyMappings(row, mappings);

      // Sanitize data
      const sanitizedData = sanitizeCSVData(mappedData);

      // Validate using dry-run
      const response = await dataProvider.create('contacts', {
        data: sanitizedData,
        meta: { dryRun: true }
      });

      results.valid.push({
        row: index + 1,
        data: response.data
      });

      // Track new entities
      if (response.data.organization_name) {
        results.newOrganizations.add(response.data.organization_name);
      }
      if (response.data.tags) {
        response.data.tags.forEach(tag => results.newTags.add(tag));
      }

    } catch (error) {
      results.invalid.push({
        row: index + 1,
        error: error.message,
        field: error.field
      });
    }
  }

  return results;
}
```

## Performance Optimizations

### Batch Processing Strategy
```typescript
const BATCH_SIZE = 10; // Optimal for API rate limits
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

class ImportCache {
  private organizations = new Map<string, { id: string, timestamp: number }>();
  private tags = new Map<string, { id: string, timestamp: number }>();

  get(type: 'organization' | 'tag', name: string) {
    const cache = type === 'organization' ? this.organizations : this.tags;
    const entry = cache.get(name);

    if (!entry) return null;
    if (Date.now() - entry.timestamp > CACHE_TTL) {
      cache.delete(name);
      return null;
    }

    return entry.id;
  }

  set(type: 'organization' | 'tag', name: string, id: string) {
    const cache = type === 'organization' ? this.organizations : this.tags;
    cache.set(name, { id, timestamp: Date.now() });
  }

  clear() {
    this.organizations.clear();
    this.tags.clear();
  }
}
```

### Memory Management
- Parse CSV in chunks for files > 10MB
- Clear parsed data after processing each batch
- Use WeakMap for temporary data that can be garbage collected

## Accessibility Features

### ARIA Labels
```typescript
<Dialog
  open={open}
  aria-labelledby="import-dialog-title"
  aria-describedby="import-dialog-description"
>
  <DialogTitle id="import-dialog-title">
    Import Contacts from CSV
  </DialogTitle>

  <div id="import-dialog-description" className="sr-only">
    Upload a CSV file to import multiple contacts at once.
    The system will validate and preview the data before importing.
  </div>
```

### Focus Management
```typescript
const dialogRef = useRef<HTMLDivElement>(null);
const previousFocus = useRef<HTMLElement | null>(null);

useEffect(() => {
  if (open) {
    // Store previous focus
    previousFocus.current = document.activeElement as HTMLElement;

    // Focus dialog
    dialogRef.current?.focus();
  } else {
    // Restore focus on close
    previousFocus.current?.focus();
  }
}, [open]);
```

### Screen Reader Announcements
```typescript
const announce = useAnnounce(); // Custom hook for aria-live

// Announce progress updates
useEffect(() => {
  if (state === 'running') {
    const progressText = `Importing contacts: ${processed} of ${total} completed`;
    announce(progressText, 'polite');
  }
}, [processed, total]);

// Announce completion
useEffect(() => {
  if (state === 'complete') {
    const resultText = `Import complete. ${successCount} contacts imported successfully.`;
    announce(resultText, 'assertive');
  }
}, [state, successCount]);
```

## Testing Strategy

### Unit Tests
```typescript
// ContactImportDialog.test.tsx
describe('ContactImportDialog', () => {
  it('should transition through states correctly', () => {
    // Test state machine transitions
  });

  it('should show file size warning for large files', () => {
    // Test > 10MB warning
  });

  it('should validate CSV headers against aliases', () => {
    // Test column mapping
  });
});
```

### Integration Tests
```typescript
// useContactImport.test.tsx
describe('useContactImport', () => {
  it('should use Promise.allSettled for batch processing', () => {
    // Ensure all rows are attempted
  });

  it('should cache organizations and tags', () => {
    // Test cache effectiveness
  });
});
```

### E2E Tests
```typescript
// cypress/e2e/contact-import.cy.ts
describe('Contact Import Flow', () => {
  it('should complete full import workflow', () => {
    cy.visit('/contacts');
    cy.findByRole('button', { name: /import csv/i }).click();
    cy.get('input[type="file"]').selectFile('fixtures/test-contacts.csv');
    cy.findByText(/ready to import/i).should('be.visible');
    cy.findByRole('button', { name: /continue import/i }).click();
    cy.findByText(/import complete/i).should('be.visible');
  });
});
```

## Implementation Timeline

### Phase 1 (Core Features) - 40 hours
- Week 1: Dialog structure, file upload, state machine
- Week 2: Preview component, column mapping
- Week 3: Progress tracking, error handling
- Week 4: Result display, testing

### Phase 2 (Enhancements) - 80 hours
- Interactive column mapping
- Error report downloads
- Duplicate detection
- Undo/rollback capability

## Success Metrics
- 85% automatic column mapping success rate
- < 3 clicks to complete import
- < 2 seconds per 100 contacts processing time
- Zero data loss on browser refresh (localStorage backup)