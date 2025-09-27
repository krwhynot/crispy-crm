#!/usr/bin/env node
/**
 * Test script to understand and debug filter formats
 * Simulates how filters are sent from React Admin components
 * and how they should be transformed for PostgREST
 */

console.log('=== Testing Filter Format Transformations ===\n');

// Simulate filters from different React Admin components
const testCases = [
  {
    name: 'Single tag filter (from ToggleFilterButton)',
    input: { "tags@cs": "{1}" },
    expected: { "tags@cs": "{1}" },
    description: 'Single tag selection - already in correct PostgREST format'
  },
  {
    name: 'Multi-select filter (from MultiSelectInput)',
    input: { tags: [1, 2, 3] },
    expected: { "tags@cs": "{1,2,3}" },
    description: 'Array of IDs from multi-select - needs transformation'
  },
  {
    name: 'String array filter',
    input: { status: ['active', 'pending', 'qualified'] },
    expected: { "status@in": "(active,pending,qualified)" },
    description: 'Array of strings for enum field - needs IN operator'
  },
  {
    name: 'Mixed filter with arrays and regular fields',
    input: {
      name: 'John',
      tags: [1, 2],
      status: 'active',
      amount: 1000
    },
    expected: {
      name: 'John',
      "tags@cs": "{1,2}",
      status: 'active',
      amount: 1000
    },
    description: 'Mixed filter types - only arrays need transformation'
  },
  {
    name: 'Empty array filter',
    input: { tags: [] },
    expected: {},
    description: 'Empty array should be removed from filter'
  }
];

// Function to transform array filters for PostgREST
function transformArrayFilters(filter) {
  if (!filter || typeof filter !== 'object') {
    return filter;
  }

  const transformed = {};

  for (const [key, value] of Object.entries(filter)) {
    // Skip null/undefined values
    if (value === null || value === undefined) {
      continue;
    }

    // Check if this is already a PostgREST operator (contains @)
    if (key.includes('@')) {
      transformed[key] = value;
      continue;
    }

    // Handle array values
    if (Array.isArray(value)) {
      if (value.length === 0) {
        // Skip empty arrays
        continue;
      }

      // Determine the field type based on the key
      // For JSONB array fields (like tags), use @cs (contains)
      // For regular fields, use @in
      const jsonbArrayFields = ['tags', 'email', 'phone'];

      if (jsonbArrayFields.includes(key)) {
        // JSONB array contains - format: {1,2,3}
        transformed[`${key}@cs`] = `{${value.join(',')}}`;
      } else {
        // Regular IN operator - format: (val1,val2,val3)
        // Handle string values that may need quoting
        const formattedValues = value.map(v =>
          typeof v === 'string' && !v.match(/^\d+$/) ? v : String(v)
        );
        transformed[`${key}@in`] = `(${formattedValues.join(',')})`;
      }
    } else {
      // Regular non-array value
      transformed[key] = value;
    }
  }

  return transformed;
}

// Run tests
console.log('Test Results:\n');
testCases.forEach((testCase, index) => {
  console.log(`${index + 1}. ${testCase.name}`);
  console.log(`   Description: ${testCase.description}`);
  console.log(`   Input:      `, JSON.stringify(testCase.input));

  const result = transformArrayFilters(testCase.input);
  console.log(`   Output:     `, JSON.stringify(result));
  console.log(`   Expected:   `, JSON.stringify(testCase.expected));

  const passed = JSON.stringify(result) === JSON.stringify(testCase.expected);
  console.log(`   Result:      ${passed ? '✅ PASS' : '❌ FAIL'}`);
  console.log();
});

// Show the transformation logic summary
console.log('=== Transformation Rules ===\n');
console.log('1. Arrays for JSONB fields (tags, email, phone):');
console.log('   [1, 2, 3] → "field@cs": "{1,2,3}"');
console.log();
console.log('2. Arrays for regular fields:');
console.log('   ["a", "b"] → "field@in": "(a,b)"');
console.log();
console.log('3. Empty arrays are removed from filter');
console.log('4. Existing PostgREST operators (@ syntax) are preserved');
console.log('5. Non-array values pass through unchanged');