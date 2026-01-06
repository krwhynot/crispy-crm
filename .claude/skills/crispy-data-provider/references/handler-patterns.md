# Handler Composition Patterns

## Table of Contents
1. [Explicit Composition Rule](#explicit-composition-rule)
2. [Standard Handler Template](#standard-handler-template)
3. [Wrapper Functions](#wrapper-functions)
4. [Lifecycle Callbacks](#lifecycle-callbacks)
5. [Complete Examples](#complete-examples)

---

## Explicit Composition Rule

**Principle:** Handlers must be composed explicitly to ensure correct order of operations.

### Composition Order (Inside → Outside)
1. **Validation** - Checks input correctness (Zod)
2. **Lifecycle** - Transforms data, strips fields
3. **Error Logging** - Catches and reports errors

```typescript
export const createHandler = () => {
  return withErrorLogging(        // 3. OUTER: Catch all errors
    withLifecycleCallbacks(       // 2. MIDDLE: Transform data
      withValidation(baseHandler), // 1. INNER: Validate first
      callbacks
    )
  );
};
```

### Why This Order?
- **Validation first:** Reject bad input before any processing
- **Lifecycle middle:** Transform validated data
- **Errors outer:** Catch anything that slips through

---

## Standard Handler Template

```typescript
// src/providers/supabase/handlers/[resource]Handler.ts

import { supabase } from '@/lib/supabase/client';
import { withErrorLogging } from '../wrappers/withErrorLogging';
import { withLifecycleCallbacks } from '../wrappers/withLifecycleCallbacks';
import { withValidation } from '../wrappers/withValidation';
import { resourceSchema } from '@/atomic-crm/validation/resourceSchema';
import { resourceCallbacks } from '../callbacks/resourceCallbacks';

// 1. Define base handler (raw Supabase interactions)
const baseHandler = {
  getList: async (params) => {
    const { page, perPage } = params.pagination;
    const { field, order } = params.sort;

    const { data, count } = await supabase
      .from('resources_summary')  // READ from View
      .select('*', { count: 'exact' })
      .order(field, { ascending: order === 'ASC' })
      .range((page - 1) * perPage, page * perPage - 1);

    return { data, total: count };
  },

  getOne: async (params) => {
    const { data } = await supabase
      .from('resources_summary')  // READ from View
      .select('*')
      .eq('id', params.id)
      .single();

    return { data };
  },

  create: async (params) => {
    const { data } = await supabase
      .from('resources')          // WRITE to Table
      .insert(params.data)
      .select()
      .single();

    return { data };
  },

  update: async (params) => {
    const { data } = await supabase
      .from('resources')          // WRITE to Table
      .update(params.data)
      .eq('id', params.id)
      .select()
      .single();

    return { data };
  },

  delete: async (params) => {
    // SOFT DELETE - Always
    const { data } = await supabase
      .from('resources')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', params.id)
      .select()
      .single();

    return { data };
  },
};

// 2. Compose and export
export const createResourceHandler = () => {
  return withErrorLogging(
    withLifecycleCallbacks(
      withValidation(baseHandler, resourceSchema),
      resourceCallbacks
    )
  );
};
```

---

## Wrapper Functions

### withValidation

```typescript
// src/providers/supabase/wrappers/withValidation.ts

import { HttpError } from 'react-admin';
import { ZodSchema, ZodError } from 'zod';

export const withValidation = (handler: any, schema: ZodSchema) => {
  return {
    ...handler,

    create: async (params: any) => {
      try {
        const validated = schema.parse(params.data);
        return handler.create({ ...params, data: validated });
      } catch (error) {
        if (error instanceof ZodError) {
          const fieldErrors = error.issues.reduce((acc, issue) => {
            acc[issue.path.join('.')] = issue.message;
            return acc;
          }, {} as Record<string, string>);

          throw new HttpError('Validation Error', 400, { errors: fieldErrors });
        }
        throw error;
      }
    },

    update: async (params: any) => {
      try {
        // Use partial schema for updates
        const validated = schema.partial().parse(params.data);
        return handler.update({ ...params, data: validated });
      } catch (error) {
        if (error instanceof ZodError) {
          const fieldErrors = error.issues.reduce((acc, issue) => {
            acc[issue.path.join('.')] = issue.message;
            return acc;
          }, {} as Record<string, string>);

          throw new HttpError('Validation Error', 400, { errors: fieldErrors });
        }
        throw error;
      }
    },
  };
};
```

### withErrorLogging

```typescript
// src/providers/supabase/wrappers/withErrorLogging.ts

export const withErrorLogging = (handler: any) => {
  const wrap = (method: string) => async (params: any) => {
    try {
      return await handler[method](params);
    } catch (error) {
      console.error(`[DataProvider] ${method} failed:`, {
        params,
        error: error instanceof Error ? error.message : error,
      });
      throw error; // Re-throw for React Admin to handle
    }
  };

  return {
    getList: wrap('getList'),
    getOne: wrap('getOne'),
    create: wrap('create'),
    update: wrap('update'),
    delete: wrap('delete'),
    getMany: handler.getMany ? wrap('getMany') : undefined,
    getManyReference: handler.getManyReference ? wrap('getManyReference') : undefined,
  };
};
```

### withLifecycleCallbacks

```typescript
// src/providers/supabase/wrappers/withLifecycleCallbacks.ts

interface Callbacks {
  beforeCreate?: (data: any) => any;
  afterCreate?: (data: any, result: any) => void;
  beforeUpdate?: (data: any) => any;
  afterUpdate?: (data: any, result: any) => void;
  beforeDelete?: (id: string) => void;
  afterDelete?: (id: string, result: any) => void;
}

export const withLifecycleCallbacks = (handler: any, callbacks: Callbacks) => {
  return {
    ...handler,

    create: async (params: any) => {
      let data = params.data;
      if (callbacks.beforeCreate) {
        data = callbacks.beforeCreate(data);
      }

      const result = await handler.create({ ...params, data });

      if (callbacks.afterCreate) {
        callbacks.afterCreate(data, result);
      }

      return result;
    },

    update: async (params: any) => {
      let data = params.data;
      if (callbacks.beforeUpdate) {
        data = callbacks.beforeUpdate(data);
      }

      const result = await handler.update({ ...params, data });

      if (callbacks.afterUpdate) {
        callbacks.afterUpdate(data, result);
      }

      return result;
    },

    delete: async (params: any) => {
      if (callbacks.beforeDelete) {
        callbacks.beforeDelete(params.id);
      }

      const result = await handler.delete(params);

      if (callbacks.afterDelete) {
        callbacks.afterDelete(params.id, result);
      }

      return result;
    },
  };
};
```

---

## Lifecycle Callbacks

### Purpose
Callbacks handle resource-specific transformations without polluting the base handler.

### Common Use Cases

```typescript
// src/providers/supabase/callbacks/contactsCallbacks.ts

export const contactsCallbacks = {
  // Strip view-only computed fields before write
  beforeCreate: (data: any) => {
    const {
      organization_name,     // Computed from join
      total_opportunities,   // Computed count
      last_activity_date,    // Computed from activities
      ...writeableData
    } = data;
    return writeableData;
  },

  beforeUpdate: (data: any) => {
    const {
      organization_name,
      total_opportunities,
      last_activity_date,
      ...writeableData
    } = data;
    return writeableData;
  },

  // Audit logging
  afterCreate: (data: any, result: any) => {
    console.log(`[Audit] Contact created: ${result.data.id}`);
  },

  afterDelete: (id: string) => {
    console.log(`[Audit] Contact soft-deleted: ${id}`);
  },
};
```

---

## Complete Examples

### Tasks Handler (Full Implementation)

```typescript
// src/providers/supabase/handlers/tasksHandler.ts

import { supabase } from '@/lib/supabase/client';
import { withErrorLogging } from '../wrappers/withErrorLogging';
import { withLifecycleCallbacks } from '../wrappers/withLifecycleCallbacks';
import { withValidation } from '../wrappers/withValidation';
import { taskSchema } from '@/atomic-crm/validation/taskSchema';

const baseHandler = {
  getList: async ({ pagination, sort, filter }) => {
    const { page, perPage } = pagination;
    const { field, order } = sort;

    let query = supabase
      .from('tasks_summary')
      .select('*', { count: 'exact' })
      .is('deleted_at', null);

    // Apply filters
    if (filter.status) {
      query = query.eq('status', filter.status);
    }
    if (filter.assigned_to) {
      query = query.eq('assigned_to', filter.assigned_to);
    }
    if (filter.due_before) {
      query = query.lte('due_date', filter.due_before);
    }

    const { data, count, error } = await query
      .order(field, { ascending: order === 'ASC' })
      .range((page - 1) * perPage, page * perPage - 1);

    if (error) throw error;
    return { data: data || [], total: count || 0 };
  },

  getOne: async ({ id }) => {
    const { data, error } = await supabase
      .from('tasks_summary')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return { data };
  },

  create: async ({ data }) => {
    const { data: result, error } = await supabase
      .from('tasks')
      .insert(data)
      .select()
      .single();

    if (error) throw error;
    return { data: result };
  },

  update: async ({ id, data }) => {
    const { data: result, error } = await supabase
      .from('tasks')
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return { data: result };
  },

  delete: async ({ id }) => {
    const { data, error } = await supabase
      .from('tasks')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return { data };
  },
};

const tasksCallbacks = {
  beforeCreate: (data: any) => {
    const { assignee_name, contact_name, ...writeable } = data;
    return {
      ...writeable,
      created_at: new Date().toISOString(),
    };
  },
  beforeUpdate: (data: any) => {
    const { assignee_name, contact_name, ...writeable } = data;
    return {
      ...writeable,
      updated_at: new Date().toISOString(),
    };
  },
};

export const createTasksHandler = () => {
  return withErrorLogging(
    withLifecycleCallbacks(
      withValidation(baseHandler, taskSchema),
      tasksCallbacks
    )
  );
};
```

---

## Anti-Patterns

### DON'T: Auto-CRUD Factory

```typescript
// WRONG - Magic hides composition order
export const tasksHandler = createAutoHandler('tasks', {
  schema: taskSchema,
  callbacks: tasksCallbacks,
});
```

### DON'T: Inline Everything

```typescript
// WRONG - Hard to test, hard to reuse
export const tasksHandler = {
  create: async (params) => {
    // Validation inline
    const validated = taskSchema.parse(params.data);
    // Callbacks inline
    const { computed_field, ...data } = validated;
    // Error handling inline
    try {
      return await supabase.from('tasks').insert(data);
    } catch (e) {
      console.error(e);
      throw e;
    }
  },
};
```

### DO: Explicit Composition

```typescript
// CORRECT - Clear, testable, maintainable
export const createTasksHandler = () => {
  return withErrorLogging(
    withLifecycleCallbacks(
      withValidation(baseHandler, taskSchema),
      tasksCallbacks
    )
  );
};
```
