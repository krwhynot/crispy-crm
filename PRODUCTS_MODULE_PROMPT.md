# Claude Code Prompt: Products Module Implementation

## Task
Implement a complete Products module for the Atomic CRM system following existing React Admin patterns and the test HTML page design at `test-products.html`.

## Database Schema Already Exists
The following tables are already in the database with full schemas:
- `products` - 40+ columns including core info, pricing, physical properties, compliance
- `product_pricing_tiers` - Volume-based pricing with quantity ranges
- `product_inventory` - Multi-warehouse inventory tracking
- `product_distribution_rights` - Territory and channel distribution management

## Required Implementation

### 1. Create Module Structure
Create `/src/atomic-crm/products/` directory with:

```
products/
├── index.ts              # Resource config with lazy loading
├── ProductList.tsx       # DataGrid with filters
├── ProductShow.tsx       # TabbedShowLayout display
├── ProductEdit.tsx       # TabbedForm with all fields
├── ProductCreate.tsx     # Simplified creation form
└── ProductInputs.tsx     # Shared custom input components
```

### 2. Component Requirements

#### ProductList.tsx
- Use DataGrid with columns: name, sku, category, brand, status, list_price
- Filters: SearchInput (q), category, status, brand, principal_id
- Actions: Create, Export, bulk delete
- Follow pattern from `opportunities/OpportunityList.tsx`

#### ProductShow.tsx
- Use TabbedShowLayout with 6 tabs matching test HTML
- Display all fields in read-only format
- Show related pricing tiers and inventory in sub-tables
- Use ReferenceManyField for one-to-many relationships

#### ProductEdit.tsx
- Implement TabbedForm with 6 tabs:
  1. Basic Information - core fields
  2. Pricing & Tiers - standard pricing + volume tiers table
  3. Physical & Inventory - dimensions, warehouse stock levels
  4. Compliance & Safety - certifications, allergens, storage
  5. Marketing - images, features, benefits arrays
  6. Distribution Rights - territory/channel management

#### ProductCreate.tsx
- Simplified form with only required fields initially
- Fields: name, sku, principal_id, category, status
- Option to "Continue editing" after creation for full details

#### ProductInputs.tsx
Custom input components for:
- DimensionsInput - for JSONB dimensions field (length, width, height)
- NutritionalInfoInput - for JSONB nutritional data
- PricingTiersInput - inline editing of pricing tiers
- InventoryLocationsInput - multi-warehouse inventory management

### 3. DataProvider Customization

Extend `/src/atomic-crm/providers/supabase/dataProvider.ts` to handle:

```typescript
// In the create and update methods, detect products resource
if (resource === 'products') {
  // Extract nested data
  const { product_pricing_tiers, product_inventory, ...productData } = params.data;

  // 1. Save/update main product
  const product = await supabase.from('products').upsert(productData);

  // 2. Handle pricing tiers (upsert array)
  if (product_pricing_tiers) {
    await supabase.from('product_pricing_tiers')
      .upsert(product_pricing_tiers.map(tier => ({
        ...tier,
        product_id: product.id
      })));
  }

  // 3. Handle inventory (upsert array)
  if (product_inventory) {
    await supabase.from('product_inventory')
      .upsert(product_inventory.map(inv => ({
        ...inv,
        product_id: product.id
      })));
  }
}
```

### 4. Validation Schema

Create `/src/atomic-crm/validation/products.ts`:

```typescript
import { z } from 'zod';

export const productSchema = z.object({
  name: z.string().min(1),
  sku: z.string().min(1),
  principal_id: z.number(),
  category: z.enum(['food_beverage', 'health_wellness', 'personal_care']),
  status: z.enum(['active', 'discontinued', 'pre_order']).optional(),
  dimensions: z.object({
    length: z.number().optional(),
    width: z.number().optional(),
    height: z.number().optional(),
  }).optional(),
  // ... other fields
});

export const pricingTierSchema = z.object({
  tier_name: z.string(),
  min_quantity: z.number().min(1),
  max_quantity: z.number().optional(),
  unit_price: z.number().positive(),
  discount_percent: z.number().min(0).max(100).optional(),
});
```

### 5. Registration

In `/src/atomic-crm/root/CRM.tsx` at line 153, add:

```typescript
import products from "../products";

// In the Admin component, after tags resource:
<Resource name="products" {...products} />
<Resource name="product_pricing_tiers" />
<Resource name="product_inventory" />
<Resource name="product_distribution_rights" />
```

### 6. Key Implementation Notes

1. **Follow existing patterns exactly** - Check opportunities/contacts for reference
2. **Use semantic color variables only** - No hex codes, use var(--primary), etc.
3. **Array fields** - Use ArrayInput with SimpleFormIterator for certifications, allergens, features, benefits
4. **JSONB fields** - Create custom inputs that present structured UI but save as JSON
5. **Relationships** - Use ReferenceInput for principal_id, ReferenceArrayInput for nested data
6. **Lazy loading** - All components must use React.lazy() in index.ts
7. **Validation** - Only at API boundary in dataProvider, not in forms
8. **Component hierarchy** - shadcn/ui base → admin layer → feature components

### 7. Testing Checklist

After implementation, verify:
- [ ] All CRUD operations work for main product
- [ ] Pricing tiers save and update correctly
- [ ] Inventory updates across multiple warehouses
- [ ] JSONB fields (dimensions, nutritional_info) save properly
- [ ] Array fields (certifications, allergens) work
- [ ] Search and filters function in list view
- [ ] Tabs display all data correctly in show view
- [ ] Form validation prevents invalid data
- [ ] Related records cascade properly on delete

### 8. File References

Use these existing files as patterns:
- List pattern: `/src/atomic-crm/opportunities/OpportunityList.tsx`
- Show pattern: `/src/atomic-crm/contacts/ContactShow.tsx`
- Edit pattern: `/src/atomic-crm/organizations/OrganizationEdit.tsx`
- Custom inputs: `/src/atomic-crm/contacts/ContactInputs.tsx`
- DataProvider: `/src/atomic-crm/providers/supabase/dataProvider.ts`

### 9. Visual Reference

The test HTML page at `/home/krwhynot/Projects/atomic/test-products.html` shows the exact layout and field organization to implement in React Admin components.

## Execution Order

1. Create validation schema first
2. Implement ProductInputs.tsx with custom components
3. Build ProductList.tsx with basic display
4. Create ProductCreate.tsx for simple creation
5. Implement full ProductEdit.tsx with all tabs
6. Build ProductShow.tsx for display
7. Update DataProvider for nested saves
8. Register in CRM.tsx
9. Test all operations

## Success Criteria

The implementation is complete when:
- Products appear in the navigation menu
- All CRUD operations work including nested data
- The UI matches the test HTML page design
- All 40+ fields are editable and save correctly
- Related tables (pricing, inventory) update properly
- The module follows all existing patterns in the codebase