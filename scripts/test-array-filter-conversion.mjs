#!/usr/bin/env node

/**
 * Test script for array filter conversion to PostgREST format
 * Tests the transformArrayFilters function from unifiedDataProvider.ts
 *
 * Requirements from testing-plan.md Phase 0:
 * - Test single values remain unchanged
 * - Test arrays convert to IN operator format
 * - Test empty array handling
 * - Test comma escaping in string values
 * - Test mixed operator preservation
 * - Output clear pass/fail results showing actual vs expected query formats
 */

// Standalone implementation of the functions from unifiedDataProvider.ts
// These are JavaScript versions of the TypeScript functions

/**
 * Escape values for PostgREST according to official documentation
 * PostgREST uses BACKSLASH escaping, NOT doubled quotes!
 */
function escapeForPostgREST(value) {
  const str = String(value);
  // Check for PostgREST reserved characters: , . " ' : ( ) space
  const needsQuoting = /[,."':() ]/.test(str);

  if (!needsQuoting) {
    return str;
  }

  // IMPORTANT: Escape backslashes first, then quotes
  let escaped = str.replace(/\\/g, '\\\\');  // Backslash → \\
  escaped = escaped.replace(/"/g, '\\"');    // Quote → \"
  return `"${escaped}"`;
}

/**
 * Transform array filter values to PostgREST operators
 * Handles conversion of React Admin array filters to appropriate PostgREST syntax
 *
 * @example
 * // JSONB array fields (tags, email, phone)
 * { tags: [1, 2, 3] } → { "tags@cs": "{1,2,3}" }
 *
 * // Regular enum/text fields
 * { status: ["active", "pending"] } → { "status@in": "(active,pending)" }
 */
function transformArrayFilters(filter) {
  if (!filter || typeof filter !== 'object') {
    return filter;
  }

  const transformed = {};

  // Fields that are stored as JSONB arrays in PostgreSQL
  // These use the @cs (contains) operator
  const jsonbArrayFields = ['tags', 'email', 'phone'];

  for (const [key, value] of Object.entries(filter)) {
    // Skip null/undefined values
    if (value === null || value === undefined) {
      continue;
    }

    // Preserve existing PostgREST operators (keys containing @)
    if (key.includes('@')) {
      transformed[key] = value;
      continue;
    }

    // Handle array values
    if (Array.isArray(value)) {
      // Skip empty arrays
      if (value.length === 0) {
        continue;
      }

      if (jsonbArrayFields.includes(key)) {
        // JSONB array contains - format: {1,2,3}
        // This checks if the JSONB array contains any of the specified values
        transformed[`${key}@cs`] = `{${value.map(escapeForPostgREST).join(',')}}`;
      } else {
        // Regular IN operator - format: (val1,val2,val3)
        // This checks if the field value is in the list
        transformed[`${key}@in`] = `(${value.map(escapeForPostgREST).join(',')})`;
      }
    } else {
      // Regular non-array value
      transformed[key] = value;
    }
  }

  return transformed;
}

// Test framework
class TestRunner {
  constructor() {
    this.tests = [];
    this.passed = 0;
    this.failed = 0;
  }

  test(name, testFn) {
    this.tests.push({ name, testFn });
  }

  assertEqual(actual, expected, message = '') {
    const actualStr = JSON.stringify(actual, null, 2);
    const expectedStr = JSON.stringify(expected, null, 2);

    if (actualStr !== expectedStr) {
      throw new Error(`
${message}
Expected: ${expectedStr}
Actual:   ${actualStr}
`);
    }
  }

  async run() {
    console.log('🧪 Running Array Filter Conversion Tests\n');
    console.log('=' .repeat(60));

    for (const { name, testFn } of this.tests) {
      try {
        await testFn();
        console.log(`✅ PASS: ${name}`);
        this.passed++;
      } catch (error) {
        console.log(`❌ FAIL: ${name}`);
        console.log(`   Error: ${error.message}`);
        this.failed++;
      }
    }

    console.log('\n' + '=' .repeat(60));
    console.log(`📊 Test Results: ${this.passed} passed, ${this.failed} failed`);

    if (this.failed > 0) {
      console.log(`\n❌ ${this.failed} test(s) failed`);
      process.exit(1);
    } else {
      console.log(`\n✅ All tests passed!`);
    }
  }
}

const runner = new TestRunner();

// Test 1: Single values remain unchanged
runner.test('Single value remains unchanged', () => {
  const input = { stage: 'qualified' };
  const expected = { stage: 'qualified' };
  const actual = transformArrayFilters(input);

  runner.assertEqual(actual, expected, 'Single values should pass through unchanged');
});

// Test 2: Array converts to IN operator
runner.test('Array converts to IN operator', () => {
  const input = { stage: ['qualified', 'proposal'] };
  const expected = { 'stage@in': '(qualified,proposal)' };
  const actual = transformArrayFilters(input);

  runner.assertEqual(actual, expected, 'Arrays should convert to IN operator format');
});

// Test 3: Empty array removes filter
runner.test('Empty array removes filter', () => {
  const input = { stage: [] };
  const expected = {};
  const actual = transformArrayFilters(input);

  runner.assertEqual(actual, expected, 'Empty arrays should be removed from filters');
});

// Test 4: String with comma gets escaped with quotes
runner.test('String with comma gets escaped with quotes', () => {
  const input = { category: ['Tech, Inc.', 'Sales Co'] };
  const expected = { 'category@in': '("Tech, Inc.","Sales Co")' };
  const actual = transformArrayFilters(input);

  runner.assertEqual(actual, expected, 'Comma-containing strings should be quoted');
});

// Test 5: Double quotes use BACKSLASH escaping
runner.test('Double quotes use BACKSLASH escaping', () => {
  const input = { name: ['he said "hi"', 'normal'] };
  const expected = { 'name@in': '("he said \\"hi\\"",normal)' };
  const actual = transformArrayFilters(input);

  runner.assertEqual(actual, expected, 'Double quotes should be escaped with backslashes');
});

// Test 6: Backslashes are doubled
runner.test('Backslashes are doubled', () => {
  const input = { path: ['C:\\Users\\Name', 'normal'] };
  const expected = { 'path@in': '("C:\\\\Users\\\\Name",normal)' };
  const actual = transformArrayFilters(input);

  runner.assertEqual(actual, expected, 'Backslashes should be doubled');
});

// Test 7: Mixed operators preserved
runner.test('Mixed operators preserved', () => {
  const input = {
    stage: ['qualified', 'proposal'],
    'amount@gte': 10000
  };
  const expected = {
    'stage@in': '(qualified,proposal)',
    'amount@gte': 10000
  };
  const actual = transformArrayFilters(input);

  runner.assertEqual(actual, expected, 'Existing PostgREST operators should be preserved');
});

// Test 8: JSONB array fields use contains operator
runner.test('JSONB array fields use contains operator', () => {
  const input = { tags: [1, 2, 3] };
  const expected = { 'tags@cs': '{1,2,3}' };
  const actual = transformArrayFilters(input);

  runner.assertEqual(actual, expected, 'JSONB array fields should use @cs operator with {} format');
});

// Test 9: Email JSONB field handling
runner.test('Email JSONB field handling', () => {
  const input = { email: ['john@example.com', 'jane@test.com'] };
  const expected = { 'email@cs': '{"john@example.com","jane@test.com"}' };
  const actual = transformArrayFilters(input);

  runner.assertEqual(actual, expected, 'Email JSONB field should use @cs operator');
});

// Test 10: Phone JSONB field handling
runner.test('Phone JSONB field handling', () => {
  const input = { phone: ['+1-555-123-4567', '+1-555-987-6543'] };
  const expected = { 'phone@cs': '{+1-555-123-4567,+1-555-987-6543}' };
  const actual = transformArrayFilters(input);

  runner.assertEqual(actual, expected, 'Phone JSONB field should use @cs operator');
});

// Test 11: Null and undefined values are skipped
runner.test('Null and undefined values are skipped', () => {
  const input = {
    stage: ['qualified'],
    category: null,
    priority: undefined,
    amount: 0  // Zero should be kept
  };
  const expected = {
    'stage@in': '(qualified)',
    amount: 0
  };
  const actual = transformArrayFilters(input);

  runner.assertEqual(actual, expected, 'Null/undefined should be skipped, zero should be kept');
});

// Test 12: Special characters requiring quotes
runner.test('Special characters requiring quotes', () => {
  const input = { stage: ['stage:with:colons', 'stage with spaces', 'stage.with.dots'] };
  const expected = { 'stage@in': '("stage:with:colons","stage with spaces","stage.with.dots")' };
  const actual = transformArrayFilters(input);

  runner.assertEqual(actual, expected, 'Special characters should trigger quoting');
});

// Test 13: Numeric arrays
runner.test('Numeric arrays', () => {
  const input = { id: [1, 2, 3, 42] };
  const expected = { 'id@in': '(1,2,3,42)' };
  const actual = transformArrayFilters(input);

  runner.assertEqual(actual, expected, 'Numeric arrays should work without quotes');
});

// Test 14: Boolean arrays
runner.test('Boolean arrays', () => {
  const input = { active: [true, false] };
  const expected = { 'active@in': '(true,false)' };
  const actual = transformArrayFilters(input);

  runner.assertEqual(actual, expected, 'Boolean arrays should work without quotes');
});

// Test 15: Escaping edge case test
runner.test('Direct escapeForPostgREST function test', () => {
  // Test the escaping function directly
  const tests = [
    { input: 'simple', expected: 'simple' },
    { input: 'with,comma', expected: '"with,comma"' },
    { input: 'with "quotes"', expected: '"with \\"quotes\\""' },
    { input: 'C:\\path\\to\\file', expected: '"C:\\\\path\\\\to\\\\file"' },
    { input: 'special:chars()', expected: '"special:chars()"' },
    { input: 'with space', expected: '"with space"' },
  ];

  for (const { input, expected } of tests) {
    const actual = escapeForPostgREST(input);
    if (actual !== expected) {
      throw new Error(`escapeForPostgREST("${input}") expected "${expected}", got "${actual}"`);
    }
  }
});

// Test 16: Complex real-world scenario
runner.test('Complex real-world scenario', () => {
  const input = {
    stage: ['qualified', 'proposal', 'negotiation'],
    priority: ['high', 'critical'],
    category: ['Tech, Software', 'Healthcare'],
    tags: [1, 2, 3],
    'amount@gte': 10000,
    'created_at@gte': '2023-01-01',
    customer_organization_id: [123, 456, 789]
  };
  const expected = {
    'stage@in': '(qualified,proposal,negotiation)',
    'priority@in': '(high,critical)',
    'category@in': '("Tech, Software",Healthcare)',
    'tags@cs': '{1,2,3}',
    'amount@gte': 10000,
    'created_at@gte': '2023-01-01',
    'customer_organization_id@in': '(123,456,789)'
  };
  const actual = transformArrayFilters(input);

  runner.assertEqual(actual, expected, 'Complex real-world filter scenario should work correctly');
});

// Test 17: Edge case - mixed string/number arrays
runner.test('Mixed string/number arrays', () => {
  const input = { mixed: [1, 'two', 3, 'four with space'] };
  const expected = { 'mixed@in': '(1,two,3,"four with space")' };
  const actual = transformArrayFilters(input);

  runner.assertEqual(actual, expected, 'Mixed string/number arrays should work correctly');
});

// Test 18: URLs and special characters
runner.test('URLs and special characters', () => {
  const input = { website: ['https://example.com', 'http://test.org:8080/path'] };
  const expected = { 'website@in': '("https://example.com","http://test.org:8080/path")' };
  const actual = transformArrayFilters(input);

  runner.assertEqual(actual, expected, 'URLs with special characters should be properly quoted');
});

// Run all tests
await runner.run();