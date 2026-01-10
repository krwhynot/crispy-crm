#!/usr/bin/env node

/**
 * CORRECT PostgREST escaping based on official documentation
 *
 * PostgREST uses BACKSLASH escaping, not doubled quotes!
 * Also, the operator syntax is different than we thought.
 */

function transformArrayFiltersCorrect(filter) {
  if (!filter || typeof filter !== "object") {
    return filter;
  }

  const transformed = {};
  const jsonbArrayFields = ["tags", "email", "phone"];

  /**
   * Escape a value for PostgREST IN operator according to official docs:
   * 1. If value contains reserved chars (comma, quotes, parens, space, period, colon)
   *    then wrap in quotes
   * 2. Escape internal quotes with backslash
   * 3. Escape backslashes with double backslash
   */
  function escapeForPostgREST(value) {
    const str = String(value);

    // Check if value needs quoting (contains PostgREST reserved characters)
    const needsQuoting = /[,."':() ]/.test(str);

    if (!needsQuoting) {
      return str;
    }

    // Escape backslashes first (must be done before quotes)
    let escaped = str.replace(/\\/g, "\\\\");

    // Then escape double quotes with backslash
    escaped = escaped.replace(/"/g, '\\"');

    // Wrap in quotes
    return `"${escaped}"`;
  }

  /**
   * Format array for PostgREST IN operator
   * Should produce: field=in.(val1,val2,"val,3")
   */
  function formatINOperator(values) {
    const escaped = values.map(escapeForPostgREST);
    return `(${escaped.join(",")})`;
  }

  /**
   * Format array for PostgREST JSONB contains operator
   * Should produce: field@cs={val1,val2,"val,3"}
   */
  function formatJSONBOperator(values) {
    const escaped = values.map(escapeForPostgREST);
    return `{${escaped.join(",")}}`;
  }

  for (const [key, value] of Object.entries(filter)) {
    if (value === null || value === undefined) {
      continue;
    }

    // Skip if already has PostgREST operator
    if (key.includes("@") || key.includes("=")) {
      transformed[key] = value;
      continue;
    }

    if (Array.isArray(value)) {
      if (value.length === 0) {
        continue;
      }

      if (jsonbArrayFields.includes(key)) {
        // JSONB array fields use @cs operator
        transformed[`${key}@cs`] = formatJSONBOperator(value);
      } else {
        // Regular fields use =in. operator (NOT @in!)
        // But our current implementation uses @in, so we keep that for now
        // The base provider will need to convert this to the correct format
        transformed[`${key}@in`] = formatINOperator(value);
      }
    } else {
      transformed[key] = value;
    }
  }

  return transformed;
}

// Test cases based on PostgREST documentation
const testCases = [
  {
    name: "Simple values without special chars",
    input: { stage: ["qualified", "proposal"] },
    expected: { "stage@in": "(qualified,proposal)" },
  },
  {
    name: "Values with commas (PostgREST example)",
    input: { name: ["Hebdon,John", "Williams,Mary"] },
    expected: { "name@in": '("Hebdon,John","Williams,Mary")' },
  },
  {
    name: "Values with double quotes",
    input: { description: ['he said "hi"', "normal"] },
    expected: { "description@in": '("he said \\"hi\\"",normal)' },
  },
  {
    name: "Values with backslashes",
    input: { path: ["C:\\Users\\Name", "normal"] },
    expected: { "path@in": '("C:\\\\Users\\\\Name",normal)' },
  },
  {
    name: "Values with parentheses",
    input: { company: ["Tech (USA)", "Sales (EU)"] },
    expected: { "company@in": '("Tech (USA)","Sales (EU)")' },
  },
  {
    name: "Values with single quotes (no special handling)",
    input: { company: ["O'Reilly", "Bob's Co"] },
    expected: { "company@in": `("O'Reilly","Bob's Co")` },
  },
  {
    name: "Values with spaces",
    input: { company: ["Tech Company", "Sales Org"] },
    expected: { "company@in": '("Tech Company","Sales Org")' },
  },
  {
    name: "Mixed special characters",
    input: { company: ["Tech, Inc. (USA)", "O'Reilly & Co."] },
    expected: { "company@in": '("Tech, Inc. (USA)","O\'Reilly & Co.")' },
  },
  {
    name: "JSONB field with special chars",
    input: { tags: ["tag,comma", 'tag"quote', "normal"] },
    expected: { "tags@cs": '{"tag,comma","tag\\"quote",normal}' },
  },
  {
    name: "Period and colon (PostgREST reserved)",
    input: { domain: ["example.com:8080", "test.org"] },
    expected: { "domain@in": '("example.com:8080","test.org")' },
  },
];

console.log("🔍 Testing CORRECT PostgREST Escaping Implementation\n");
console.log("Based on official PostgREST documentation:\n");
console.log("- Use backslash escaping (NOT doubled quotes)");
console.log("- Quote values containing: , . : ( ) \" ' space");
console.log("- Escape internal quotes with backslash");
console.log("- Escape backslashes with double backslash\n");
console.log("=".repeat(60));

let passCount = 0;
let failCount = 0;

testCases.forEach((test) => {
  const result = transformArrayFiltersCorrect(test.input);
  const resultStr = JSON.stringify(result);
  const expectedStr = JSON.stringify(test.expected);
  const passed = resultStr === expectedStr;

  if (passed) {
    console.log(`✅ ${test.name}`);
    const key = Object.keys(result)[0];
    console.log(`   Result: ${result[key]}`);
    passCount++;
  } else {
    console.log(`❌ ${test.name}`);
    const key = Object.keys(test.expected)[0];
    console.log(`   Expected: ${test.expected[key]}`);
    console.log(`   Got:      ${result[key] || "undefined"}`);
    failCount++;
  }
  console.log();
});

console.log("=".repeat(60));
console.log("\n📊 Test Summary:");
console.log(`   Passed: ${passCount}/${testCases.length}`);
console.log(`   Failed: ${failCount}/${testCases.length}`);

if (passCount === testCases.length) {
  console.log("\n✅ All tests passed! Implementation follows PostgREST spec.");
}

console.log("\n⚠️  IMPORTANT NOTES:");
console.log("1. PostgREST uses backslash escaping, NOT PostgreSQL doubled quotes");
console.log('2. The actual operator is "=in." not "@in" in URLs');
console.log("3. Our implementation uses @in which the base provider must convert");
console.log("4. URL encoding happens at the HTTP layer (quotes become %22)");

console.log("\n🔧 Implementation for unifiedDataProvider.ts:");
console.log(`
function escapeForPostgREST(value) {
  const str = String(value);
  const needsQuoting = /[,."':() ]/.test(str);

  if (!needsQuoting) {
    return str;
  }

  let escaped = str.replace(/\\\\/g, '\\\\\\\\');  // Escape backslashes
  escaped = escaped.replace(/"/g, '\\\\"');      // Escape quotes
  return \`"\${escaped}"\`;
}

// In transformArrayFilters:
const escaped = values.map(escapeForPostgREST);
transformed[\`\${key}@in\`] = \`(\${escaped.join(',')})\`;
`);
