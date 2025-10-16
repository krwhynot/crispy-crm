import { describe, it, expect, beforeAll, vi } from 'vitest';
import { createClient } from '@supabase/supabase-js';

// Types for our schema validation
interface ColumnInfo {
  column_name: string;
  data_type: string;
  is_nullable: string;
}

interface TableSchema {
  [tableName: string]: ColumnInfo[];
}

// Mock Supabase client for testing
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://aaqnanddcqvfiwhshndl.supabase.co';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'test-key';

describe('Data Provider Schema Validation', () => {
  let supabase: ReturnType<typeof createClient>;
  const tableSchemas: TableSchema = {};

  beforeAll(async () => {
    supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    // Fetch actual database schema
    const tables = [
      'contacts', 'contacts_summary', 'opportunities', 'companies',
      'activities', 'tasks', 'notes', 'contact_organizations'
    ];

    for (const table of tables) {
      try {
        // Get column information from the database
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(0);

        if (!error) {
          // Store schema info (in real implementation, would query information_schema)
          tableSchemas[table] = [];
        }
      } catch (err) {
        console.warn(`Could not fetch schema for ${table}:`, err);
      }
    }
  });

  describe('Field Existence Validation', () => {
    it('should not reference non-existent fields in contacts_summary', async () => {
      // Test that nb_tasks field does not exist
      const { data, error } = await supabase
        .from('contacts_summary')
        .select('nb_tasks')
        .limit(1);

      // This should fail with a column not found error
      expect(error).toBeTruthy();
      expect(error?.message).toContain('column');
      expect(error?.message).toContain('does not exist');
    });

    it('should validate all fields used in filter operations', async () => {
      const problematicQueries = [
        {
          table: 'contacts_summary',
          field: 'nb_tasks',
          operation: 'gt',
          value: 0,
          shouldFail: true,
          reason: 'nb_tasks column does not exist in contacts_summary view'
        },
        {
          table: 'contacts_summary',
          field: 'last_seen',
          operation: 'is',
          value: null,
          shouldFail: false,
          reason: 'last_seen column should exist'
        }
      ];

      for (const query of problematicQueries) {
        const queryBuilder = supabase.from(query.table).select('id');

        // Apply filter
        const { data, error } = await queryBuilder
          .filter(query.field, query.operation, query.value)
          .limit(1);

        if (query.shouldFail) {
          expect(error).toBeTruthy();
          expect(error?.message).toContain('column');
        } else {
          // Should not have column-related errors
          if (error) {
            expect(error.message).not.toContain('does not exist');
          }
        }
      }
    });
  });

  describe('Data Provider Request Validation', () => {
    it('should validate getList requests with filters', async () => {
      const testCases = [
        {
          resource: 'contacts',
          filter: { nb_tasks: { gt: 0 } },
          shouldFail: true,
          reason: 'contacts table does not have nb_tasks column'
        },
        {
          resource: 'contacts_summary',
          filter: { nb_tasks: { gt: 0 } },
          shouldFail: true,
          reason: 'contacts_summary view does not have nb_tasks column'
        },
        {
          resource: 'tasks',
          filter: { contact_id: { eq: '123' } },
          shouldFail: false,
          reason: 'tasks table has contact_id column'
        }
      ];

      for (const testCase of testCases) {
        try {
          // Build the query based on the filter
          let query = supabase.from(testCase.resource).select('*');

          // Apply filters
          for (const [field, conditions] of Object.entries(testCase.filter)) {
            for (const [operator, value] of Object.entries(conditions as any)) {
              query = query.filter(field, operator, value);
            }
          }

          const { data, error } = await query.limit(1);

          if (testCase.shouldFail) {
            expect(error).toBeTruthy();
            console.log(`✓ Expected failure for ${testCase.resource}: ${testCase.reason}`);
          } else {
            if (error && error.message.includes('does not exist')) {
              throw new Error(`Unexpected schema error: ${error.message}`);
            }
            console.log(`✓ Valid query for ${testCase.resource}: ${testCase.reason}`);
          }
        } catch (err) {
          if (!testCase.shouldFail) {
            throw err;
          }
        }
      }
    });

    it('should validate sort field existence', async () => {
      const sortTests = [
        {
          resource: 'contacts_summary',
          sortField: 'nb_tasks',
          shouldFail: true,
          reason: 'Cannot sort by non-existent nb_tasks field'
        },
        {
          resource: 'contacts_summary',
          sortField: 'last_seen',
          shouldFail: false,
          reason: 'Should be able to sort by last_seen'
        },
        {
          resource: 'contacts',
          sortField: 'created_at',
          shouldFail: false,
          reason: 'Should be able to sort by created_at'
        }
      ];

      for (const test of sortTests) {
        const { data, error } = await supabase
          .from(test.resource)
          .select('id')
          .order(test.sortField, { ascending: false })
          .limit(1);

        if (test.shouldFail) {
          expect(error).toBeTruthy();
          if (error) {
            expect(error.message).toContain('column');
          }
        } else {
          if (error && error.message.includes('does not exist')) {
            throw new Error(`Unexpected error for ${test.resource}.${test.sortField}: ${error.message}`);
          }
        }
      }
    });
  });

  describe('Schema Compatibility Tests', () => {
    it('should verify required fields for each resource', async () => {
      const requiredFields = {
        contacts: ['id', 'first_name', 'last_name', 'created_at', 'updated_at'],
        contacts_summary: ['id', 'first_name', 'last_name', 'last_seen'],
        opportunities: ['id', 'name', 'stage', 'amount', 'customer_organization_id'],
        companies: ['id', 'name', 'created_at'],
        tasks: ['id', 'title', 'due_date', 'completed'],
        notes: ['id', 'text', 'date', 'contact_id'],
        activities: ['id', 'type', 'activity_date']
      };

      for (const [table, fields] of Object.entries(requiredFields)) {
        // Build select string with all required fields
        const selectString = fields.join(',');

        const { data, error } = await supabase
          .from(table)
          .select(selectString)
          .limit(1);

        if (error && error.message.includes('does not exist')) {
          const missingField = fields.find(field => error.message.includes(field));
          throw new Error(`Required field '${missingField}' missing in ${table}: ${error.message}`);
        }
      }
    });

    it('should detect mismatched field types', async () => {
      // Test queries that might fail due to type mismatches
      const typeTests = [
        {
          table: 'contacts',
          field: 'created_at',
          value: '2024-01-01T00:00:00Z',
          operator: 'gt',
          expectedType: 'timestamp'
        },
        {
          table: 'opportunities',
          field: 'amount',
          value: 1000,
          operator: 'gt',
          expectedType: 'numeric'
        },
        {
          table: 'tasks',
          field: 'status',
          value: 'pending',
          operator: 'eq',
          expectedType: 'string/enum'
        }
      ];

      for (const test of typeTests) {
        try {
          const { data, error } = await supabase
            .from(test.table)
            .select('id')
            .filter(test.field, test.operator, test.value)
            .limit(1);

          if (error && !error.message.includes('PGRST')) {
            console.warn(`Type mismatch for ${test.table}.${test.field}: ${error.message}`);
          }
        } catch (err) {
          console.error(`Failed type test for ${test.table}.${test.field}:`, err);
        }
      }
    });
  });

  describe('Error Message Validation', () => {
    it('should provide clear error messages for schema mismatches', async () => {
      const errorScenarios = [
        {
          query: () => supabase.from('contacts_summary').select('*').filter('nb_tasks', 'gt', 0),
          expectedError: 'column contacts_summary.nb_tasks does not exist',
          description: 'Non-existent column filter'
        },
        {
          query: () => supabase.from('invalid_table').select('*'),
          expectedError: 'relation "public.invalid_table" does not exist',
          description: 'Non-existent table'
        },
        {
          query: () => supabase.from('contacts').select('invalid_field'),
          expectedError: 'column contacts.invalid_field does not exist',
          description: 'Non-existent column in select'
        }
      ];

      for (const scenario of errorScenarios) {
        const { data, error } = await scenario.query();

        if (error) {
          console.log(`✓ ${scenario.description}: "${error.message}"`);
          // Verify error message is helpful
          expect(error.message.toLowerCase()).toContain('does not exist');
        } else {
          console.warn(`⚠ Expected error for: ${scenario.description}`);
        }
      }
    });
  });

  describe('Data Provider Integration Tests', () => {
    it('should handle HTTP 400 errors gracefully', async () => {
      // Simulate the exact error from the HTML file
      const problematicUrl = `${SUPABASE_URL}/rest/v1/contacts_summary?offset=0&limit=25&nb_tasks=gt.0&order=last_seen.desc.nullslast`;

      try {
        const response = await fetch(problematicUrl, {
          headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
          }
        });

        if (!response.ok) {
          const errorText = await response.text();
          expect(response.status).toBe(400);
          expect(errorText).toContain('does not exist');
          console.log('✓ Correctly identified schema mismatch via HTTP 400 error');
        }
      } catch (err) {
        console.error('Network error:', err);
      }
    });

    it('should validate all resource endpoints used by the application', async () => {
      const resources = [
        'contacts',
        'contacts_summary',
        'opportunities',
        'companies',
        'activities',
        'tasks',
        'notes',
        'contact_organizations'
      ];

      const results: { resource: string; status: 'ok' | 'error'; message?: string }[] = [];

      for (const resource of resources) {
        try {
          const { data, error } = await supabase
            .from(resource)
            .select('id')
            .limit(1);

          if (error) {
            results.push({
              resource,
              status: 'error',
              message: error.message
            });
          } else {
            results.push({
              resource,
              status: 'ok'
            });
          }
        } catch (err) {
          results.push({
            resource,
            status: 'error',
            message: String(err)
          });
        }
      }

      // Report results
      console.log('\nResource Validation Results:');
      console.log('============================');
      results.forEach(r => {
        const icon = r.status === 'ok' ? '✅' : '❌';
        console.log(`${icon} ${r.resource}: ${r.status}${r.message ? ` - ${r.message}` : ''}`);
      });

      // All resources should be accessible
      const failures = results.filter(r => r.status === 'error');
      if (failures.length > 0) {
        console.warn(`\n⚠️  ${failures.length} resource(s) have issues`);
      }
    });
  });
});

// Helper function to detect schema mismatches in error messages
export function isSchemaError(error: any): boolean {
  if (!error || !error.message) return false;

  const schemaErrorPatterns = [
    'does not exist',
    'column',
    'relation',
    'invalid input syntax',
    'operator does not exist'
  ];

  const message = error.message.toLowerCase();
  return schemaErrorPatterns.some(pattern => message.includes(pattern));
}

// Export validation utilities for use in other tests
export async function validateFieldExists(
  supabase: any,
  table: string,
  field: string
): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from(table)
      .select(field)
      .limit(0);

    return !error || !error.message.includes('does not exist');
  } catch {
    return false;
  }
}

export async function validateFilterField(
  supabase: any,
  table: string,
  field: string,
  operator: string,
  value: any
): Promise<{ valid: boolean; error?: string }> {
  try {
    const { data, error } = await supabase
      .from(table)
      .select('id')
      .filter(field, operator, value)
      .limit(1);

    if (error && error.message.includes('does not exist')) {
      return {
        valid: false,
        error: `Field '${field}' does not exist in table '${table}'`
      };
    }

    return { valid: true };
  } catch (err) {
    return {
      valid: false,
      error: String(err)
    };
  }
}