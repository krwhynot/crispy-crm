#!/usr/bin/env node

/**
 * Fixed version of transformArrayFilters with proper string escaping
 */

function transformArrayFiltersFixed(filter) {
  if (!filter || typeof filter !== 'object') {
    return filter;
  }

  const transformed = {};
  const jsonbArrayFields = ['tags', 'email', 'phone'];

  /**
   * Escape a value for PostgREST IN operator
   * Values containing special characters need to be quoted
   */
  function escapeForIN(value) {
    // Convert to string
    const str = String(value);

    // Check if value needs quoting (contains comma, quote, parenthesis, or space)
    if (/[,'"() ]/.test(str)) {
      // Escape internal quotes by doubling them (PostgreSQL standard)
      const escaped = str.replace(/"/g, '""');
      return `"${escaped}"`;
    }

    return str;
  }

  /**
   * Escape a value for PostgREST JSONB contains operator
   * JSONB arrays need special handling for quotes
   */
  function escapeForJSONB(value) {
    const str = String(value);

    // For JSONB, if the value contains special characters, quote it
    if (/[,{}"]/.test(str)) {
      // Escape quotes by doubling them
      const escaped = str.replace(/"/g, '""');
      return `"${escaped}"`;
    }

    return str;
  }

  for (const [key, value] of Object.entries(filter)) {
    if (value === null || value === undefined) {
      continue;
    }

    if (key.includes('@')) {
      transformed[key] = value;
      continue;
    }

    if (Array.isArray(value)) {
      if (value.length === 0) {
        continue;
      }

      if (jsonbArrayFields.includes(key)) {
        // JSONB array contains - escape each value
        const escapedValues = value.map(v => escapeForJSONB(v));
        transformed[`${key}@cs`] = `{${escapedValues.join(',')}}`;
      } else {
        // Regular IN operator - escape each value
        const escapedValues = value.map(v => escapeForIN(v));
        transformed[`${key}@in`] = `(${escapedValues.join(',')})`;
      }
    } else {
      transformed[key] = value;
    }
  }

  return transformed;
}

// Test cases
const testCases = [
  {
    name: 'Simple strings',
    input: { category: ['enterprise', 'mid_market'] },
    expected: { 'category@in': '(enterprise,mid_market)' },
  },
  {
    name: 'Strings with commas',
    input: { category: ['Tech, Inc.', 'Sales Co'] },
    expected: { 'category@in': '("Tech, Inc.","Sales Co")' },
  },
  {
    name: 'Strings with single quotes',
    input: { category: [`O'Reilly`, `Bob's Company`] },
    expected: { 'category@in': `(O'Reilly,Bob's Company)` },
  },
  {
    name: 'Strings with double quotes',
    input: { category: [`"Enterprise"`, `"Mid-Market"`] },
    expected: { 'category@in': `("""Enterprise""","""Mid-Market""")` },
  },
  {
    name: 'Strings with parentheses',
    input: { category: ['Company (USA)', 'Org (EU)'] },
    expected: { 'category@in': '("Company (USA)","Org (EU)")' },
  },
  {
    name: 'Strings with spaces',
    input: { category: ['Tech Company', 'Sales Organization'] },
    expected: { 'category@in': '("Tech Company","Sales Organization")' },
  },
  {
    name: 'Mixed special characters',
    input: { category: [`Tech, Inc. (USA)`, `O'Reilly & Co.`] },
    expected: { 'category@in': `("Tech, Inc. (USA)",O'Reilly & Co.)` },
  },
  {
    name: 'JSONB array with special characters',
    input: { tags: ['tag,with,commas', 'normal-tag', '"quoted"'] },
    expected: { 'tags@cs': '{"tag,with,commas",normal-tag,"""quoted"""}' },
  },
  {
    name: 'Numbers and strings mixed',
    input: { priority: [1, 2, 'high', 'very high'] },
    expected: { 'priority@in': '(1,2,high,"very high")' },
  },
];

console.log('🔍 Testing Fixed String Escaping Implementation\n');
console.log('=' .repeat(60));

let passCount = 0;
let failCount = 0;

testCases.forEach(test => {
  const result = transformArrayFiltersFixed(test.input);
  const resultStr = JSON.stringify(result);
  const expectedStr = JSON.stringify(test.expected);
  const passed = resultStr === expectedStr;

  if (passed) {
    console.log(`✅ ${test.name}`);
    console.log(`   Result: ${result[Object.keys(result)[0]]}`);
    passCount++;
  } else {
    console.log(`❌ ${test.name}`);
    console.log(`   Expected: ${test.expected[Object.keys(test.expected)[0]]}`);
    console.log(`   Got:      ${result[Object.keys(result)[0]]}`);
    failCount++;
  }
  console.log();
});

console.log('=' .repeat(60));
console.log('\n📊 Test Summary:');
console.log(`   Passed: ${passCount}/${testCases.length}`);
console.log(`   Failed: ${failCount}/${testCases.length}`);

if (passCount === testCases.length) {
  console.log('\n✅ All tests passed! The escaping implementation is correct.');

  console.log('\n📝 Implementation Notes:');
  console.log('   1. Values with commas, quotes, spaces, or parentheses are quoted');
  console.log('   2. Double quotes are escaped by doubling them (PostgreSQL standard)');
  console.log('   3. Single quotes do NOT need escaping in PostgREST syntax');
  console.log('   4. JSONB arrays use similar escaping rules');
}

// Show the actual implementation that should be added
console.log('\n🔧 Code to Add to unifiedDataProvider.ts:');
console.log(`
function escapeForIN(value) {
  const str = String(value);
  if (/[,'"() ]/.test(str)) {
    const escaped = str.replace(/"/g, '""');
    return \`"\${escaped}"\`;
  }
  return str;
}

function escapeForJSONB(value) {
  const str = String(value);
  if (/[,{}"]/.test(str)) {
    const escaped = str.replace(/"/g, '""');
    return \`"\${escaped}"\`;
  }
  return str;
}
`);