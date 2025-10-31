#!/usr/bin/env node

/**
 * Test script to verify string escaping in array filter transformation
 * Tests the transformArrayFilters function with special characters
 */

// Simulate the transformArrayFilters function from unifiedDataProvider.ts
function transformArrayFilters(filter) {
  if (!filter || typeof filter !== 'object') {
    return filter;
  }

  const transformed = {};
  const jsonbArrayFields = ['tags', 'email', 'phone'];

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
        transformed[`${key}@cs`] = `{${value.join(',')}}`;
      } else {
        transformed[`${key}@in`] = `(${value.join(',')})`;
      }
    } else {
      transformed[key] = value;
    }
  }

  return transformed;
}

// Test cases for string escaping
const testCases = [
  {
    name: 'Simple strings without special characters',
    input: { category: ['enterprise', 'mid_market'] },
    expected: { 'category@in': '(enterprise,mid_market)' },
  },
  {
    name: 'Strings with commas (WILL BREAK)',
    input: { category: ['Tech, Inc.', 'Sales Co'] },
    expected: { 'category@in': '(Tech, Inc.,Sales Co)' }, // This is WRONG format
    shouldFail: true,
  },
  {
    name: 'Strings with quotes',
    input: { category: [`O'Reilly`, `Bob's Company`] },
    expected: { 'category@in': `(O'Reilly,Bob's Company)` },
    shouldFail: true, // May cause SQL issues
  },
  {
    name: 'Strings with parentheses',
    input: { category: ['Company (USA)', 'Org (EU)'] },
    expected: { 'category@in': '(Company (USA),Org (EU))' },
    shouldFail: true, // Nested parentheses may confuse parser
  },
  {
    name: 'Strings with backslashes',
    input: { category: ['Path\\to\\file', 'Another\\path'] },
    expected: { 'category@in': '(Path\\to\\file,Another\\path)' },
  },
  {
    name: 'Mixed special characters',
    input: { category: [`"Tech, Inc." (USA)`, `O'Reilly & Co.`] },
    expected: { 'category@in': `("Tech, Inc." (USA),O'Reilly & Co.)` },
    shouldFail: true,
  },
  {
    name: 'JSONB array field with special characters',
    input: { tags: ['tag,with,commas', 'normal-tag'] },
    expected: { 'tags@cs': '{tag,with,commas,normal-tag}' }, // This is WRONG
    shouldFail: true,
  },
];

console.log('🔍 Testing String Escaping in Array Filters\n');
console.log('=' .repeat(60));

let passCount = 0;
let failCount = 0;
let criticalIssues = [];

testCases.forEach(test => {
  const result = transformArrayFilters(test.input);
  const resultStr = JSON.stringify(result);
  const expectedStr = JSON.stringify(test.expected);
  const passed = resultStr === expectedStr;

  if (test.shouldFail && !passed) {
    console.log(`✅ ${test.name}`);
    console.log(`   Expected failure confirmed - needs escaping implementation`);
    criticalIssues.push(test.name);
  } else if (!test.shouldFail && passed) {
    console.log(`✅ ${test.name}`);
    passCount++;
  } else if (test.shouldFail && passed) {
    console.log(`⚠️  ${test.name}`);
    console.log(`   Unexpectedly passed - may still have issues`);
    criticalIssues.push(test.name);
  } else {
    console.log(`❌ ${test.name}`);
    console.log(`   Expected: ${expectedStr}`);
    console.log(`   Got:      ${resultStr}`);
    failCount++;
  }
  console.log();
});

console.log('=' .repeat(60));
console.log('\n📊 Test Summary:');
console.log(`   Passed: ${passCount}`);
console.log(`   Failed: ${failCount}`);
console.log(`   Critical Issues: ${criticalIssues.length}`);

if (criticalIssues.length > 0) {
  console.log('\n⚠️  CRITICAL ISSUES FOUND:');
  console.log('   The following cases will cause PostgREST query failures:');
  criticalIssues.forEach(issue => {
    console.log(`   - ${issue}`);
  });

  console.log('\n🔧 RECOMMENDED FIX:');
  console.log('   Implement proper escaping in transformArrayFilters:');
  console.log('   1. For IN operator: Quote strings containing special chars');
  console.log('   2. For JSONB: Escape commas and quotes properly');
  console.log('   3. Consider using JSON.stringify for complex values');
}

// Demonstrate the correct escaping approach
console.log('\n💡 Correct Escaping Examples:');
console.log('   Input: ["Tech, Inc.", "Sales Co"]');
console.log('   Current (WRONG): (Tech, Inc.,Sales Co)');
console.log('   Correct: ("Tech, Inc.","Sales Co")');
console.log();
console.log('   Input: ["O\'Reilly", "Bob\'s"]');
console.log('   Current (RISKY): (O\'Reilly,Bob\'s)');
console.log('   Correct: ("O\'Reilly","Bob\'s") or escape quotes');

// Test what PostgREST actually expects
console.log('\n📝 PostgREST Expected Formats:');
console.log('   Simple values: field=in.(val1,val2,val3)');
console.log('   Quoted values: field=in.("val,1","val 2","val\'3")');
console.log('   JSONB arrays: field@cs={val1,val2} or {"val1","val2"}');