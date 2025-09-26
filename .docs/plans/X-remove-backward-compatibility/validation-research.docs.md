# Validation Schema Architecture Research

Research findings on the current validation schema structure, backward compatibility implementations, and Zod schema integration patterns in the Atomic CRM codebase.

## Relevant Files
- `/home/krwhynot/Projects/atomic/src/atomic-crm/validation/contacts.ts` - Contact validation with backward compatibility fields
- `/home/krwhynot/Projects/atomic/src/atomic-crm/validation/opportunities.ts` - Opportunity validation with legacy field support
- `/home/krwhynot/Projects/atomic/src/atomic-crm/validation/organizations.ts` - Organization validation (minimal backward compatibility)
- `/home/krwhynot/Projects/atomic/src/atomic-crm/validation/index.ts` - Main validation module exports
- `/home/krwhynot/Projects/atomic/src/atomic-crm/providers/supabase/unifiedDataProvider.ts` - API boundary validation integration
- `/home/krwhynot/Projects/atomic/src/atomic-crm/validation/tasks.ts` - Task validation (clean schema, no backward compatibility)
- `/home/krwhynot/Projects/atomic/src/atomic-crm/validation/tags.ts` - Tag validation with color migration support
- `/home/krwhynot/Projects/atomic/src/atomic-crm/validation/notes.ts` - Note validation (clean schema)

## Architectural Patterns

### **Validation Architecture**: Zod schemas provide single-point validation at API boundaries
- All validation functions called through `unifiedDataProvider.ts` at lines 34-36, 47-56
- Validation registry pattern at lines 45-85 maps resources to validation functions
- Consistent async validation signature: `async (data: any) => Promise<void>`
- React Admin error format conversion in all validation functions

### **Schema Structure**: Three-tier schema organization per entity
- Base schema: Full entity definition with all fields
- Create schema: Omits system fields (id, timestamps, computed fields)
- Update schema: Partial base schema with required ID field
- Specialized validation functions for specific operations

### **Error Handling**: Consistent Zod error transformation to React Admin format
- All validation functions catch `z.ZodError` and convert to `{ message, errors }` format
- Path-based error mapping: `err.path.join('.')` creates field-specific errors
- Standard error structure across all validation modules

## Backward Compatibility Fields & Locations

### **Contact Schema Backward Compatibility** (`/home/krwhynot/Projects/atomic/src/atomic-crm/validation/contacts.ts`)

#### contactOrganizationSchema (lines 70-82):
- Line 75: `is_primary_contact: z.boolean().optional()` - **Legacy backward compatibility**

#### contactSchema (lines 84-122):
- Line 90: `company_id: z.union([z.string(), z.number()]).optional()` - **Backward compatibility**
- Lines 104-109: Primary organization fields section marked as **backward compatibility**
  - Line 107: `is_primary_contact: z.boolean().optional()`
  - Line 108: `purchase_influence: purchaseInfluenceSchema.optional()`
  - Line 109: `decision_authority: decisionAuthoritySchema.optional()`

### **Opportunity Schema Backward Compatibility** (`/home/krwhynot/Projects/atomic/src/atomic-crm/validation/opportunities.ts`)

#### opportunitySchema (lines 70-125):
- Lines 117-120: Section explicitly marked as **"Backward compatibility fields (may be present but not used)"**
- Line 118: `company_id: z.union([z.string(), z.number()]).optional()`
- Line 119: `archived_at: z.string().optional().nullable()`

### **Organization Schema** (`/home/krwhynot/Projects/atomic/src/atomic-crm/validation/organizations.ts`)
- Line 6: File comment notes **"backward compatibility"** in naming convention
- Line 80: `parent_company_id` - Not backward compatibility but hierarchical relationship support
- **No explicit backward compatibility fields identified**

### **Clean Schemas** (No Backward Compatibility)
- **Tasks**: `/home/krwhynot/Projects/atomic/src/atomic-crm/validation/tasks.ts` - Clean opportunities-based schema
- **Tags**: `/home/krwhynot/Projects/atomic/src/atomic-crm/validation/tags.ts` - Has color migration logic but no legacy fields
- **Notes**: `/home/krwhynot/Projects/atomic/src/atomic-crm/validation/notes.ts` - Clean schema design

## Integration Points & Dependencies

### **unifiedDataProvider Integration** (`/home/krwhynot/Projects/atomic/src/atomic-crm/providers/supabase/unifiedDataProvider.ts`)
- Lines 34-36: Direct imports of validation functions
- Lines 47-56: Validation registry mapping resources to validation functions
- Lines 178-192: `validateData()` function calls appropriate validators
- Lines 197-207: `processForDatabase()` calls validation before database operations
- Lines 299, 320, 344: Validation called in create, update, updateMany operations

### **Validation Function Signatures**
- **Standard**: `async function validateEntityForm(data: any): Promise<void>`
- **Alternative**: `function validateCreateEntity(data: unknown): EntityType`
- **React Admin Integration**: All throw formatted errors with `{ message, errors }` structure

### **Current Data Provider Usage**
- Line 94: Base Supabase data provider initialization
- Lines 47-56: Resource validation mapping in registry
- Error logging integration at lines 99-120
- Search parameter handling at lines 125-156

## Dependencies and Integration Points

### **Validation Dependencies**
- All schemas depend on `zod` for validation logic
- Contact validation imports custom role/influence enums
- Organization validation includes URL and LinkedIn validation
- Tags validation imports semantic color type definitions

### **Data Provider Integration Chain**
1. React Admin form submission
2. `unifiedDataProvider` method call (create/update)
3. `processForDatabase()` validation (line 203)
4. Resource-specific validation function via registry
5. Zod schema parsing and validation
6. Database operation or formatted error response

### **Testing Integration**
- Comprehensive test suites in `validation/__tests__/` directory
- Tests validate both schema parsing and error formatting
- Business rule validation testing (uniqueness, format constraints)
- Mock implementation testing for data provider integration

## Specific Line Numbers for Changes Needed

### **Contacts Validation** (`/home/krwhynot/Projects/atomic/src/atomic-crm/validation/contacts.ts`)
- **Line 75**: Remove `is_primary_contact: z.boolean().optional()` from contactOrganizationSchema
- **Line 90**: Remove `company_id: z.union([z.string(), z.number()]).optional()` from contactSchema
- **Lines 104-109**: Remove entire "Primary organization fields (backward compatibility)" section
- **Lines 168-180**: Update createContactSchema to remove omitted backward compatibility fields
- **Lines 183-185**: Update updateContactSchema if needed

### **Opportunities Validation** (`/home/krwhynot/Projects/atomic/src/atomic-crm/validation/opportunities.ts`)
- **Line 118**: Remove `company_id: z.union([z.string(), z.number()]).optional()`
- **Line 119**: Remove `archived_at: z.string().optional().nullable()`
- **Lines 117-120**: Remove entire "Backward compatibility fields" section
- **Lines 156-165**: Update createOpportunitySchema to remove backward compatibility fields
- **Lines 168-170**: Update updateOpportunitySchema if needed

### **Test Files** (Likely locations for test updates)
- `/home/krwhynot/Projects/atomic/src/atomic-crm/validation/__tests__/contacts.test.ts`
- `/home/krwhynot/Projects/atomic/src/atomic-crm/validation/__tests__/opportunities.test.ts`
- Remove tests that validate backward compatibility field acceptance
- Update type inference tests to reflect schema changes

## Implementation Notes

### **Impact Assessment**
- **Low Risk**: Organizations schema has minimal backward compatibility
- **Medium Risk**: Opportunities have 2 backward compatibility fields
- **High Risk**: Contacts have 4+ backward compatibility fields across multiple schema sections
- **Zero Risk**: Tasks, Tags, Notes already use clean schemas

### **Migration Strategy**
1. Update validation schemas by removing identified backward compatibility fields
2. Update create/update schemas to reflect base schema changes
3. Update test suites to remove backward compatibility field tests
4. Verify unifiedDataProvider integration remains intact
5. Update TypeScript types to reflect schema changes

### **Validation Function Consistency**
- All validation functions follow consistent error formatting
- React Admin integration pattern is standardized
- No changes needed to validation function signatures or error handling
- Registry pattern in unifiedDataProvider will continue to work unchanged