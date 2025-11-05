# Products Import/Export Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add CSV import/export functionality to Products module

**Architecture:** Replicate existing Contacts/Organizations import/export pattern. Use same DialogImport components and CSV export utilities.

**Tech Stack:** React, Papa Parse (CSV), existing import/export infrastructure
**Effort:** 3 days | **Priority:** LOW | **Status:** Contacts/Orgs 100%, Products 0%

---

## Implementation

### Task 1: Create Product Import Button (Day 1 - Morning)

**File:** `src/atomic-crm/products/ProductImportButton.tsx`

```typescript
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";
import { useState } from "react";
import { ProductImportDialog } from "./ProductImportDialog";

export const ProductImportButton = () => {
  const [modalOpen, setModalOpen] = useState(false);

  const handleOpenModal = () => {
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
  };

  return (
    <>
      <Button
        variant="outline"
        onClick={handleOpenModal}
        className="flex items-center gap-2 cursor-pointer"
      >
        <Upload /> Import
      </Button>
      <ProductImportDialog open={modalOpen} onClose={handleCloseModal} />
    </>
  );
};
```

---

### Task 2: Create Product Import Dialog (Day 1 - Afternoon)

**File:** `src/atomic-crm/products/ProductImportDialog.tsx`

```typescript
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useProductImport } from "./useProductImport";
import { ProductImportPreview } from "./ProductImportPreview";
import { ProductImportResult } from "./ProductImportResult";

export type ProductImportDialogProps = {
  open: boolean;
  onClose: () => void;
};

export const ProductImportDialog = ({ open, onClose }: ProductImportDialogProps) => {
  const [file, setFile] = useState<File | null>(null);
  const {
    preview,
    result,
    isLoading,
    parseFile,
    confirmImport,
    reset,
  } = useProductImport();

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      await parseFile(selectedFile);
    }
  };

  const handleConfirm = async () => {
    await confirmImport();
  };

  const handleClose = () => {
    reset();
    setFile(null);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import Products</DialogTitle>
          <DialogDescription>
            Upload a CSV file with product data. Required columns: name, sku
          </DialogDescription>
        </DialogHeader>

        {!preview && !result && (
          <div className="grid gap-4 py-4">
            <input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="cursor-pointer"
            />
          </div>
        )}

        {preview && !result && (
          <>
            <ProductImportPreview preview={preview} />
            <DialogFooter>
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button onClick={handleConfirm} disabled={isLoading}>
                {isLoading ? "Importing..." : `Import ${preview.totalRows} products`}
              </Button>
            </DialogFooter>
          </>
        )}

        {result && (
          <>
            <ProductImportResult result={result} />
            <DialogFooter>
              <Button onClick={handleClose}>Close</Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};
```

---

### Task 3: Create Product Import Hook (Day 2 - Morning)

**File:** `src/atomic-crm/products/useProductImport.tsx`

```typescript
import { useState } from "react";
import { useDataProvider, useNotify } from "react-admin";
import Papa from "papaparse";

export type ProductImportPreview = {
  totalRows: number;
  sampleRows: any[];
  columnMapping: Record<string, string>;
};

export type ProductImportResult = {
  success: number;
  failed: number;
  errors: string[];
};

export const useProductImport = () => {
  const [preview, setPreview] = useState<ProductImportPreview | null>(null);
  const [result, setResult] = useState<ProductImportResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [parsedData, setParsedData] = useState<any[]>([]);
  const dataProvider = useDataProvider();
  const notify = useNotify();

  const parseFile = async (file: File) => {
    setIsLoading(true);
    try {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          const rows = results.data;
          setParsedData(rows);
          setPreview({
            totalRows: rows.length,
            sampleRows: rows.slice(0, 5),
            columnMapping: {
              name: "name",
              sku: "sku",
              category: "category",
              description: "description",
              status: "status",
            },
          });
          setIsLoading(false);
        },
        error: (error) => {
          notify(`Error parsing CSV: ${error.message}`, { type: "error" });
          setIsLoading(false);
        },
      });
    } catch (error) {
      notify(`Error reading file: ${error}`, { type: "error" });
      setIsLoading(false);
    }
  };

  const confirmImport = async () => {
    setIsLoading(true);
    const errors: string[] = [];
    let successCount = 0;

    try {
      for (const row of parsedData) {
        try {
          // Validate required fields
          if (!row.name || !row.sku) {
            errors.push(`Row missing required fields: ${JSON.stringify(row)}`);
            continue;
          }

          // Create product
          await dataProvider.create("products", {
            data: {
              name: row.name,
              sku: row.sku,
              category: row.category || null,
              description: row.description || null,
              status: row.status || "active",
            },
          });
          successCount++;
        } catch (error: any) {
          errors.push(`Failed to import ${row.name}: ${error.message}`);
        }
      }

      setResult({
        success: successCount,
        failed: errors.length,
        errors: errors.slice(0, 10), // Limit to 10 errors
      });

      if (successCount > 0) {
        notify(`Successfully imported ${successCount} products`, {
          type: "success",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const reset = () => {
    setPreview(null);
    setResult(null);
    setParsedData([]);
  };

  return {
    preview,
    result,
    isLoading,
    parseFile,
    confirmImport,
    reset,
  };
};
```

---

### Task 4: Create Preview & Result Components (Day 2 - Afternoon)

**File:** `src/atomic-crm/products/ProductImportPreview.tsx`

```typescript
import { ProductImportPreview } from "./useProductImport";

export const ProductImportPreview = ({
  preview,
}: {
  preview: ProductImportPreview;
}) => {
  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm text-muted-foreground">
          Found {preview.totalRows} products. Preview:
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full border">
          <thead className="bg-muted">
            <tr>
              <th className="border px-2 py-1">Name</th>
              <th className="border px-2 py-1">SKU</th>
              <th className="border px-2 py-1">Category</th>
              <th className="border px-2 py-1">Status</th>
            </tr>
          </thead>
          <tbody>
            {preview.sampleRows.map((row, idx) => (
              <tr key={idx}>
                <td className="border px-2 py-1">{row.name}</td>
                <td className="border px-2 py-1">{row.sku}</td>
                <td className="border px-2 py-1">{row.category}</td>
                <td className="border px-2 py-1">{row.status || "active"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
```

**File:** `src/atomic-crm/products/ProductImportResult.tsx`

```typescript
import { ProductImportResult } from "./useProductImport";
import { CheckCircle2, XCircle } from "lucide-react";

export const ProductImportResult = ({
  result,
}: {
  result: ProductImportResult;
}) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <CheckCircle2 className="text-green-600" />
        <span>Successfully imported: {result.success} products</span>
      </div>
      {result.failed > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <XCircle className="text-red-600" />
            <span>Failed: {result.failed} products</span>
          </div>
          <div className="text-sm text-muted-foreground">
            <p>Errors (showing first 10):</p>
            <ul className="list-disc pl-5 space-y-1">
              {result.errors.map((error, idx) => (
                <li key={idx}>{error}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};
```

---

### Task 5: Add Export Functionality (Day 3 - Morning)

**File:** Modify `src/atomic-crm/products/ProductList.tsx`

Add import at top:
```typescript
import { ExportButton } from "@/components/admin/export-button";
```

Add to actions array:
```typescript
<ExportButton />
```

**Create custom exporter function:**

Add to ProductList.tsx (before the component):
```typescript
const productExporter = (records: any[]) => {
  const csv = records.map((record) => ({
    name: record.name,
    sku: record.sku,
    category: record.category || "",
    description: record.description || "",
    status: record.status,
    created_at: new Date(record.created_at).toLocaleDateString(),
  }));

  const csvContent = [
    ["Name", "SKU", "Category", "Description", "Status", "Created"],
    ...csv.map((row) => [
      row.name,
      row.sku,
      row.category,
      row.description,
      row.status,
      row.created_at,
    ]),
  ]
    .map((row) => row.join(","))
    .join("\n");

  const blob = new Blob([csvContent], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `products-export-${new Date().toISOString().split("T")[0]}.csv`;
  link.click();
  URL.revokeObjectURL(url);
};
```

Pass to List component:
```typescript
<List exporter={productExporter} actions={<ListActions />}>
```

---

### Task 6: Register Import Button in List Actions (Day 3 - Afternoon)

**File:** Modify `src/atomic-crm/products/ProductList.tsx`

```typescript
import { ProductImportButton } from "./ProductImportButton";

const ProductListActions = () => (
  <TopToolbar>
    <FilterButton />
    <CreateButton />
    <ExportButton />
    <ProductImportButton />
  </TopToolbar>
);

export const ProductList = () => (
  <List actions={<ProductListActions />} exporter={productExporter}>
    <Datagrid>...</Datagrid>
  </List>
);
```

---

### Task 7: Test & Commit

**Test CSV Example:**
Create `test-products.csv`:
```csv
name,sku,category,description,status
Widget Pro,WGT-001,Electronics,Premium widget,active
Gadget Lite,GDG-002,Electronics,Basic gadget,active
Tool Max,TL-003,Hardware,Professional tool,active
```

**Test Steps:**
```bash
npm run dev

# 1. Navigate to Products list
# 2. Click "Import" button
# 3. Upload test-products.csv
# 4. Verify preview shows 3 products
# 5. Click "Import X products"
# 6. Verify success message
# 7. Refresh list, verify products exist
# 8. Click "Export" button
# 9. Verify CSV downloads with correct data

# Run tests
npm test -- products/
```

**Commit:**
```bash
git add src/atomic-crm/products/
git commit -m "feat: add CSV import/export for products

- Create ProductImportButton with dialog
- Create ProductImportDialog with preview
- Create useProductImport hook with Papa Parse
- Add ProductImportPreview and ProductImportResult
- Add CSV export with custom exporter
- Integrate import/export in ProductList actions

Replicates Contacts/Organizations import/export pattern

🤖 Generated with Claude Code

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

**Plan Status:** ✅ Ready | **Time:** 3 days | **Impact:** LOW (Feature parity with Contacts/Orgs)
