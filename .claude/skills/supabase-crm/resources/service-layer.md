# Service Layer Architecture

## Purpose

Service classes orchestrate business logic and abstract data access through the DataProvider pattern. This follows Engineering Constitution principle #2 (Single Source of Truth) and principle #14 (Service Layer orchestration).

## Core Pattern

### DataProvider Abstraction

**All data access goes through DataProvider - never direct Supabase client access.**

```typescript
// ✅ GOOD - Uses DataProvider (single source of truth)
export class OrganizationService {
  constructor(private dataProvider: DataProvider) {}

  async getOrganization(id: string): Promise<Organization> {
    const { data } = await this.dataProvider.getOne('organizations', { id });
    return data;
  }
}

// ❌ BAD - Bypasses abstraction layer
export class OrganizationService {
  constructor(private supabase: SupabaseClient) {}

  async getOrganization(id: string): Promise<Organization> {
    const { data } = await this.supabase
      .from('organizations')
      .select('*')
      .eq('id', id)
      .single();
    return data;
  }
}
```

**Why:** DataProvider provides:
- Consistent error handling
- Transformation layer for data normalization
- Validation integration
- Logging and monitoring
- Testability (easy to mock)

## Service Class Structure

### Template

```typescript
import type { DataProvider } from 'ra-core';
import { z } from 'zod';

// 1. Define validation schemas
const CreateEntitySchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  status: z.enum(['active', 'inactive'])
});

const UpdateEntitySchema = CreateEntitySchema.partial();

// 2. Infer types from schemas
export type CreateEntityInput = z.infer<typeof CreateEntitySchema>;
export type UpdateEntityInput = z.infer<typeof UpdateEntitySchema>;

// 3. Define service class
export class EntityService {
  constructor(
    private dataProvider: DataProvider & {
      invoke?: <T = any>(functionName: string, options?: any) => Promise<T>;
    }
  ) {}

  /**
   * Create entity with validation and business rules
   */
  async createEntity(input: CreateEntityInput): Promise<Entity> {
    // Step 1: Validate at boundary
    const validated = CreateEntitySchema.parse(input);

    // Step 2: Apply business rules
    await this.validateBusinessRules(validated);

    // Step 3: Use DataProvider
    try {
      const { data } = await this.dataProvider.create<Entity>('entities', {
        data: validated
      });

      return data;
    } catch (error: any) {
      console.error(`[EntityService] Failed to create entity`, {
        input: validated,
        error
      });
      throw new Error(`Entity creation failed: ${error.message}`);
    }
  }

  /**
   * Update entity with partial data
   */
  async updateEntity(id: string, input: UpdateEntityInput): Promise<Entity> {
    const validated = UpdateEntitySchema.parse(input);

    try {
      const { data } = await this.dataProvider.update<Entity>('entities', {
        id,
        data: validated,
        previousData: {} // Optional: for optimistic updates
      });

      return data;
    } catch (error: any) {
      console.error(`[EntityService] Failed to update entity`, {
        id,
        input: validated,
        error
      });
      throw new Error(`Entity update failed: ${error.message}`);
    }
  }

  /**
   * Get single entity by ID
   */
  async getEntity(id: string): Promise<Entity> {
    try {
      const { data } = await this.dataProvider.getOne<Entity>('entities', {
        id
      });

      return data;
    } catch (error: any) {
      console.error(`[EntityService] Failed to get entity`, {
        id,
        error
      });
      throw new Error(`Entity retrieval failed: ${error.message}`);
    }
  }

  /**
   * List entities with filtering and pagination
   */
  async listEntities(params: {
    filter?: Record<string, any>;
    sort?: { field: string; order: 'ASC' | 'DESC' };
    pagination?: { page: number; perPage: number };
  }): Promise<{ data: Entity[]; total: number }> {
    try {
      const result = await this.dataProvider.getList<Entity>('entities', {
        filter: params.filter || {},
        sort: params.sort || { field: 'created_at', order: 'DESC' },
        pagination: params.pagination || { page: 1, perPage: 25 }
      });

      return result;
    } catch (error: any) {
      console.error(`[EntityService] Failed to list entities`, {
        params,
        error
      });
      throw new Error(`Entity list failed: ${error.message}`);
    }
  }

  /**
   * Soft delete entity
   */
  async deleteEntity(id: string): Promise<void> {
    try {
      await this.dataProvider.delete('entities', {
        id,
        previousData: {} // Optional: for optimistic updates
      });
    } catch (error: any) {
      console.error(`[EntityService] Failed to delete entity`, {
        id,
        error
      });
      throw new Error(`Entity deletion failed: ${error.message}`);
    }
  }

  /**
   * Business rule validation
   */
  private async validateBusinessRules(input: CreateEntityInput): Promise<void> {
    // Example: Check for duplicates
    const existing = await this.dataProvider.getList<Entity>('entities', {
      filter: { name: input.name },
      pagination: { page: 1, perPage: 1 }
    });

    if (existing.total > 0) {
      throw new Error(`Entity with name "${input.name}" already exists`);
    }
  }
}
```

## Real-World Example: SalesService

**From Crispy-CRM codebase:**

```typescript
import type { DataProvider, Identifier } from "ra-core";
import type { Sale, SalesFormData } from "../types";

/**
 * Sales service handles sales user management operations through Edge functions
 * Follows Engineering Constitution principle #14: Service Layer orchestration
 */
export class SalesService {
  constructor(
    private dataProvider: DataProvider & {
      invoke?: <T = any>(functionName: string, options?: any) => Promise<T>;
    }
  ) {}

  /**
   * Create a new sales account manager via Edge function
   * @param body Sales form data including credentials and profile info
   * @returns Created sale record
   */
  async salesCreate(body: SalesFormData): Promise<Sale> {
    // Verify invoke capability exists
    if (!this.dataProvider.invoke) {
      console.error(`[SalesService] DataProvider missing invoke capability`, {
        operation: 'salesCreate',
        body
      });
      throw new Error(`Sales creation failed: DataProvider does not support Edge Function operations`);
    }

    try {
      const data = await this.dataProvider.invoke<Sale>("users", {
        method: "POST",
        body,
      });

      if (!data) {
        console.error(`[SalesService] Create account manager returned no data`, {
          body
        });
        throw new Error(`Sales creation failed: No data returned from Edge Function`);
      }

      return data;
    } catch (error: any) {
      console.error(`[SalesService] Failed to create account manager`, {
        body,
        error
      });
      throw new Error(`Sales creation failed: ${error.message}`);
    }
  }

  /**
   * Update sales account manager profile via Edge function
   */
  async salesUpdate(id: Identifier, body: Partial<SalesFormData>): Promise<Sale> {
    if (!this.dataProvider.invoke) {
      throw new Error(`Sales update failed: DataProvider does not support Edge Function operations`);
    }

    try {
      const data = await this.dataProvider.invoke<Sale>("users", {
        method: "PATCH",
        body: { id, ...body },
      });

      if (!data) {
        throw new Error(`Sales update failed: No data returned from Edge Function`);
      }

      return data;
    } catch (error: any) {
      console.error(`[SalesService] Failed to update account manager`, {
        id,
        body,
        error
      });
      throw new Error(`Sales update failed: ${error.message}`);
    }
  }
}
```

## Service Initialization

### In unifiedDataProvider.ts

```typescript
import { supabaseDataProvider } from "ra-supabase-core";
import {
  SalesService,
  OpportunitiesService,
  ActivitiesService,
  JunctionsService,
} from "../../services";

// Create base data provider
const baseDataProvider = supabaseDataProvider({
  instanceUrl: import.meta.env.VITE_SUPABASE_URL,
  apiKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
  supabaseClient: supabase,
});

// Initialize service layer instances
const salesService = new SalesService(baseDataProvider);
const opportunitiesService = new OpportunitiesService(baseDataProvider);
const activitiesService = new ActivitiesService(baseDataProvider);
const junctionsService = new JunctionsService(baseDataProvider);

// Export unified data provider with service methods
export const unifiedDataProvider: DataProvider & {
  salesCreate: typeof salesService.salesCreate;
  salesUpdate: typeof salesService.salesUpdate;
  // ... other service methods
} = {
  ...baseDataProvider,
  salesCreate: salesService.salesCreate.bind(salesService),
  salesUpdate: salesService.salesUpdate.bind(salesService),
  // ... other service methods
};
```

## CRM-Specific Patterns

### Organization Hierarchy Validation

```typescript
export class OrganizationService {
  /**
   * Validate organization hierarchy before creating child
   */
  async validateHierarchy(parentId: string, childId?: string): Promise<void> {
    // 1. Prevent circular references
    if (childId) {
      const ancestors = await this.getAncestors(childId);
      if (ancestors.some(a => a.id === parentId)) {
        throw new Error('Circular organization hierarchy detected');
      }
    }

    // 2. Enforce max depth (example: 3 levels)
    const depth = await this.getHierarchyDepth(parentId);
    if (depth >= 3) {
      throw new Error('Maximum hierarchy depth (3 levels) exceeded');
    }
  }

  /**
   * Get organization ancestors using recursive CTE
   */
  private async getAncestors(orgId: string): Promise<Organization[]> {
    // Use Supabase RPC for recursive query
    if (!this.dataProvider.invoke) {
      throw new Error('DataProvider does not support RPC calls');
    }

    const data = await this.dataProvider.invoke<Organization[]>(
      'get_org_ancestors',
      { org_id: orgId }
    );

    return data || [];
  }

  /**
   * Calculate hierarchy depth
   */
  private async getHierarchyDepth(orgId: string): Promise<number> {
    const ancestors = await this.getAncestors(orgId);
    return ancestors.length;
  }
}
```

### Multi-Organization Contact Linking

```typescript
export class ContactService {
  /**
   * Link contact to organization with role
   */
  async linkToOrganization(
    contactId: string,
    orgId: string,
    role?: string
  ): Promise<void> {
    // 1. Validate both exist
    await this.getContact(contactId);
    await this.organizationService.getOrganization(orgId);

    // 2. Create junction record
    try {
      await this.dataProvider.create('contact_organizations', {
        data: {
          contact_id: contactId,
          organization_id: orgId,
          role: role || 'Contact',
        }
      });
    } catch (error: any) {
      throw new Error(`Failed to link contact to organization: ${error.message}`);
    }
  }

  /**
   * Get all organizations for a contact
   */
  async getOrganizations(contactId: string): Promise<Organization[]> {
    const { data } = await this.dataProvider.getList('contact_organizations', {
      filter: { contact_id: contactId },
      pagination: { page: 1, perPage: 100 }
    });

    // Extract organization data from junction records
    return data.map(junction => junction.organization);
  }
}
```

### Opportunity Stage Workflow

```typescript
export class OpportunityService {
  private readonly VALID_TRANSITIONS: Record<string, string[]> = {
    'lead': ['qualified', 'disqualified'],
    'qualified': ['proposal', 'disqualified'],
    'proposal': ['negotiation', 'disqualified'],
    'negotiation': ['closed_won', 'closed_lost'],
  };

  /**
   * Update opportunity stage with validation
   */
  async updateStage(oppId: string, newStage: string): Promise<Opportunity> {
    // 1. Get current opportunity
    const opportunity = await this.getOpportunity(oppId);

    // 2. Validate transition
    const allowedTransitions = this.VALID_TRANSITIONS[opportunity.stage];
    if (!allowedTransitions?.includes(newStage)) {
      throw new Error(
        `Invalid stage transition: ${opportunity.stage} → ${newStage}`
      );
    }

    // 3. Update with timestamp
    try {
      const { data } = await this.dataProvider.update<Opportunity>('opportunities', {
        id: oppId,
        data: {
          stage: newStage,
          stage_changed_at: new Date().toISOString(),
        },
        previousData: opportunity
      });

      return data;
    } catch (error: any) {
      throw new Error(`Failed to update opportunity stage: ${error.message}`);
    }
  }
}
```

## Error Handling

### Custom Error Hierarchy

```typescript
export class ServiceError extends Error {
  constructor(
    public message: string,
    public code: string,
    public context?: Record<string, any>
  ) {
    super(message);
    this.name = 'ServiceError';
  }
}

export class ValidationError extends ServiceError {
  constructor(message: string, context?: Record<string, any>) {
    super(message, 'VALIDATION_ERROR', context);
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends ServiceError {
  constructor(entity: string, id: string) {
    super(`${entity} not found: ${id}`, 'NOT_FOUND', { entity, id });
    this.name = 'NotFoundError';
  }
}

export class BusinessRuleError extends ServiceError {
  constructor(message: string, context?: Record<string, any>) {
    super(message, 'BUSINESS_RULE_VIOLATION', context);
    this.name = 'BusinessRuleError';
  }
}
```

### Using Custom Errors

```typescript
export class OrganizationService {
  async getOrganization(id: string): Promise<Organization> {
    try {
      const { data } = await this.dataProvider.getOne<Organization>('organizations', {
        id
      });

      if (!data) {
        throw new NotFoundError('Organization', id);
      }

      return data;
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }

      console.error(`[OrganizationService] Unexpected error`, {
        id,
        error
      });

      throw new ServiceError(
        'Failed to retrieve organization',
        'DATABASE_ERROR',
        { id, originalError: error }
      );
    }
  }
}
```

## Testing Services

### Unit Test Example

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { OrganizationService } from './organization.service';
import type { DataProvider } from 'ra-core';

describe('OrganizationService', () => {
  let service: OrganizationService;
  let mockDataProvider: DataProvider;

  beforeEach(() => {
    mockDataProvider = {
      getOne: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      getList: vi.fn(),
    } as any;

    service = new OrganizationService(mockDataProvider);
  });

  it('should create organization with valid data', async () => {
    const input = {
      name: 'Test Corp',
      org_type: 'restaurant'
    };

    const expected = {
      id: '123',
      ...input,
      created_at: new Date().toISOString()
    };

    vi.mocked(mockDataProvider.create).mockResolvedValue({
      data: expected
    });

    const result = await service.createOrganization(input);

    expect(result).toEqual(expected);
    expect(mockDataProvider.create).toHaveBeenCalledWith('organizations', {
      data: input
    });
  });

  it('should throw ValidationError for invalid data', async () => {
    const input = {
      name: '', // Invalid: empty name
      org_type: 'restaurant'
    };

    await expect(service.createOrganization(input as any))
      .rejects
      .toThrow(ValidationError);
  });

  it('should enforce hierarchy depth limit', async () => {
    const parentId = 'parent-123';

    // Mock getAncestors to return 3 levels
    vi.spyOn(service as any, 'getAncestors').mockResolvedValue([
      { id: '1' },
      { id: '2' },
      { id: '3' }
    ]);

    await expect(service.validateHierarchy(parentId))
      .rejects
      .toThrow('Maximum hierarchy depth');
  });
});
```

## Best Practices

### DO
✅ Always use DataProvider for data access
✅ Validate inputs at service boundaries using Zod
✅ Apply business rules before database operations
✅ Log errors with context for debugging
✅ Use custom error classes for different failure types
✅ Keep service methods focused and single-purpose
✅ Test services with mocked DataProvider

### DON'T
❌ Access Supabase client directly from services
❌ Put business logic in React components
❌ Skip input validation
❌ Swallow errors without logging
❌ Create god services with too many responsibilities
❌ Mix UI concerns with business logic
❌ Bypass the service layer from components

## Related Resources

- [Validation Patterns](validation-patterns.md) - Zod schemas and type inference
- [Error Handling](error-handling.md) - Error types and patterns
- [Edge Functions](edge-functions.md) - Complex operations via invoke()
- [Query Optimization](query-optimization.md) - Efficient queries and indexing
