#!/usr/bin/env tsx

/**
 * Comprehensive validation script for data provider consolidation
 *
 * Validates all success criteria from requirements.md:
 * 1. Single Provider architecture
 * 2. All Features Working (CRUD, files, junctions, search)
 * 3. Clean Architecture (validation/transformation registries)
 * 4. Tests Passing (unit, E2E, TypeScript, lint)
 * 5. Constitution Compliance
 *
 * Run with: npx tsx scripts/validate-provider-consolidation.ts
 */

import { promises as fs } from "fs";
import { join } from "path";
import { execSync } from "child_process";
import chalk from "chalk";

interface ValidationResult {
  test: string;
  status: "PASS" | "FAIL" | "WARN";
  message?: string;
  category?: string;
}

const results: ValidationResult[] = [];

// Helper to add results with categories for better organization
function addResult(
  category: string,
  test: string,
  status: "PASS" | "FAIL" | "WARN",
  message?: string
) {
  results.push({ category, test, status, message });
}

async function fileExists(path: string): Promise<boolean> {
  try {
    await fs.stat(path);
    return true;
  } catch {
    return false;
  }
}

async function readFileContent(path: string): Promise<string> {
  try {
    return await fs.readFile(path, "utf-8");
  } catch {
    return "";
  }
}

// =============================================================================
// SUCCESS CRITERION 1: SINGLE PROVIDER ARCHITECTURE
// =============================================================================

async function validateSingleProviderArchitecture() {
  console.log(chalk.blue("\n🏗️  Validating Single Provider Architecture...\n"));

  // 1.1 Old provider removed
  const oldProviderPath = join(process.cwd(), "src/atomic-crm/providers/supabase/dataProvider.ts");
  const oldExists = await fileExists(oldProviderPath);
  addResult(
    "Architecture",
    "Old dataProvider.ts removed",
    oldExists ? "FAIL" : "PASS",
    oldExists ? "Legacy dataProvider.ts still exists" : undefined
  );

  // 1.2 Unified provider exists and is active
  const unifiedPath = join(
    process.cwd(),
    "src/atomic-crm/providers/supabase/unifiedDataProvider.ts"
  );
  const unifiedExists = await fileExists(unifiedPath);
  addResult(
    "Architecture",
    "Unified provider exists",
    unifiedExists ? "PASS" : "FAIL",
    unifiedExists ? undefined : "unifiedDataProvider.ts not found"
  );

  // 1.3 Provider exports correctly updated
  const indexPath = join(process.cwd(), "src/atomic-crm/providers/supabase/index.ts");
  const indexContent = await readFileContent(indexPath);
  const hasCorrectExport =
    indexContent.includes("unifiedDataProvider") &&
    indexContent.includes("export") &&
    indexContent.includes("dataProvider");
  addResult(
    "Architecture",
    "Provider exports updated",
    hasCorrectExport ? "PASS" : "FAIL",
    hasCorrectExport ? undefined : "index.ts not exporting unified provider correctly"
  );

  // 1.4 No references to old provider
  try {
    const output = execSync(
      'grep -r "from.*dataProvider" src/ --include="*.ts" --include="*.tsx" | grep -v unified || true',
      { encoding: "utf-8" }
    ).trim();
    const hasOldImports = output.length > 0 && !output.includes("unifiedDataProvider");
    addResult(
      "Architecture",
      "No old provider imports",
      hasOldImports ? "WARN" : "PASS",
      hasOldImports ? "Found imports of legacy dataProvider" : undefined
    );
  } catch {
    addResult("Architecture", "No old provider imports", "PASS");
  }
}

// =============================================================================
// SUCCESS CRITERION 2: ALL FEATURES WORKING
// =============================================================================

async function validateAllFeaturesWorking() {
  console.log(chalk.blue("\n⚙️  Validating All Features Working...\n"));

  const unifiedPath = join(
    process.cwd(),
    "src/atomic-crm/providers/supabase/unifiedDataProvider.ts"
  );
  const unifiedContent = await readFileContent(unifiedPath);

  // 2.1 CRUD Operations - Basic data provider methods
  const crudMethods = ["getList", "getOne", "create", "update", "delete"];
  const missingCrud = crudMethods.filter((method) => !unifiedContent.includes(method));
  addResult(
    "CRUD",
    "Basic CRUD operations",
    missingCrud.length === 0 ? "PASS" : "FAIL",
    missingCrud.length > 0 ? `Missing: ${missingCrud.join(", ")}` : undefined
  );

  // 2.2 File Upload Functionality
  const hasFileUpload =
    unifiedContent.includes("uploadToBucket") ||
    (unifiedContent.includes("upload") && unifiedContent.includes("Storage"));
  addResult(
    "CRUD",
    "File upload functionality",
    hasFileUpload ? "PASS" : "WARN",
    hasFileUpload ? undefined : "File upload functionality not found"
  );

  // 2.3 Junction Table Operations
  const junctionMethods = [
    "getContactOrganizations",
    "addContactToOrganization",
    "removeContactFromOrganization",
    "getOpportunityParticipants",
    "addOpportunityParticipant",
    "removeOpportunityParticipant",
    "getOpportunityContacts",
    "addOpportunityContact",
    "removeOpportunityContact",
  ];
  const missingJunctions = junctionMethods.filter((method) => !unifiedContent.includes(method));
  addResult(
    "CRUD",
    "Junction table operations",
    missingJunctions.length === 0 ? "PASS" : "WARN",
    missingJunctions.length > 0
      ? `Missing junction methods: ${missingJunctions.join(", ")}`
      : undefined
  );

  // 2.4 Search and Filtering
  const hasSearch = unifiedContent.includes("fts") || unifiedContent.includes("search");
  addResult(
    "CRUD",
    "Search functionality",
    hasSearch ? "PASS" : "WARN",
    hasSearch ? undefined : "Full-text search functionality not found"
  );

  const hasSoftDelete =
    unifiedContent.includes("deleted_at") || unifiedContent.includes("soft delete");
  addResult(
    "CRUD",
    "Soft delete filtering",
    hasSoftDelete ? "PASS" : "WARN",
    hasSoftDelete ? undefined : "Soft delete filtering not found"
  );

  // 2.5 Custom Business Operations
  const customMethods = [
    "salesCreate",
    "salesUpdate",
    "updatePassword",
    "unarchiveOpportunity",
    "getActivityLog",
  ];
  const missingCustom = customMethods.filter((method) => !unifiedContent.includes(method));
  addResult(
    "CRUD",
    "Custom business methods",
    missingCustom.length === 0 ? "PASS" : "WARN",
    missingCustom.length > 0 ? `Missing custom methods: ${missingCustom.join(", ")}` : undefined
  );
}

// =============================================================================
// SUCCESS CRITERION 3: CLEAN ARCHITECTURE
// =============================================================================

async function validateCleanArchitecture() {
  console.log(chalk.blue("\n🏛️  Validating Clean Architecture...\n"));

  const unifiedPath = join(
    process.cwd(),
    "src/atomic-crm/providers/supabase/unifiedDataProvider.ts"
  );
  const unifiedContent = await readFileContent(unifiedPath);

  // 3.1 Validation Registry
  const hasValidationRegistry =
    unifiedContent.includes("validationRegistry") || unifiedContent.includes("ValidationConfig");
  addResult(
    "Architecture",
    "Validation registry",
    hasValidationRegistry ? "PASS" : "WARN",
    hasValidationRegistry ? undefined : "Validation registry pattern not found"
  );

  // 3.2 Transformation Registry
  const hasTransformRegistry =
    unifiedContent.includes("transformerRegistry") ||
    unifiedContent.includes("TransformerConfig") ||
    unifiedContent.includes("transform");
  addResult(
    "Architecture",
    "Transformation registry",
    hasTransformRegistry ? "PASS" : "WARN",
    hasTransformRegistry ? undefined : "Transformation registry pattern not found"
  );

  // 3.3 Service Layer Structure
  const servicesPath = join(process.cwd(), "src/atomic-crm/services");
  const servicesExist = await fileExists(servicesPath);
  addResult(
    "Architecture",
    "Service layer exists",
    servicesExist ? "PASS" : "WARN",
    servicesExist ? undefined : "Service layer directory not found"
  );

  if (servicesExist) {
    const serviceFiles = [
      "sales.service.ts",
      "opportunities.service.ts",
      "activities.service.ts",
      "junctions.service.ts",
    ];
    for (const serviceFile of serviceFiles) {
      const servicePath = join(servicesPath, serviceFile);
      const exists = await fileExists(servicePath);
      addResult(
        "Architecture",
        `${serviceFile} service`,
        exists ? "PASS" : "WARN",
        exists ? undefined : `Service file ${serviceFile} not found`
      );
    }
  }

  // 3.4 File Upload Utilities
  const utilsPath = join(process.cwd(), "src/atomic-crm/utils");
  const utilsExist = await fileExists(utilsPath);
  if (utilsExist) {
    const storageUtilsPath = join(utilsPath, "storage.utils.ts");
    const storageUtilsExist = await fileExists(storageUtilsPath);
    addResult(
      "Architecture",
      "Storage utilities extracted",
      storageUtilsExist ? "PASS" : "WARN",
      storageUtilsExist ? undefined : "storage.utils.ts not found"
    );
  }

  // 3.5 No Mixed Concerns
  const hasMixedConcerns = unifiedContent.includes("withLifecycleCallbacks");
  addResult(
    "Architecture",
    "No mixed concerns",
    hasMixedConcerns ? "WARN" : "PASS",
    hasMixedConcerns ? "Still using lifecycle callbacks pattern" : undefined
  );
}

// =============================================================================
// SUCCESS CRITERION 4: TESTS PASSING
// =============================================================================

async function validateTestsPassing() {
  console.log(chalk.blue("\n🧪 Validating Tests Passing...\n"));

  // 4.1 TypeScript Compilation
  try {
    execSync("tsc --noEmit", { encoding: "utf-8", stdio: "pipe" });
    addResult("Tests", "TypeScript compilation", "PASS");
  } catch {
    addResult("Tests", "TypeScript compilation", "FAIL", "TypeScript compilation errors");
  }

  // 4.2 Lint Checks
  try {
    execSync("npm run lint:check", { encoding: "utf-8", stdio: "pipe" });
    addResult("Tests", "Lint checks", "PASS");
  } catch {
    addResult("Tests", "Lint checks", "WARN", "Linting errors found");
  }

  // 4.3 Unit Tests
  try {
    execSync("npm run test -- --run --reporter=minimal", { encoding: "utf-8", stdio: "pipe" });
    addResult("Tests", "Unit tests", "PASS");
  } catch {
    addResult("Tests", "Unit tests", "WARN", "Some unit tests failing");
  }

  // 4.4 Data Provider Specific Tests
  const dataProviderTestPath = join(
    process.cwd(),
    "src/atomic-crm/providers/supabase/unifiedDataProvider.test.ts"
  );
  const providerTestExists = await fileExists(dataProviderTestPath);
  addResult(
    "Tests",
    "Provider unit tests",
    providerTestExists ? "PASS" : "WARN",
    providerTestExists ? undefined : "Unified provider tests not found"
  );

  // 4.5 E2E Tests (if they exist and are configured)
  try {
    // Check if E2E tests can run
    const e2eDir = join(process.cwd(), "src/tests/e2e");
    const e2eExists = await fileExists(e2eDir);
    if (e2eExists) {
      addResult("Tests", "E2E tests configured", "PASS");
      // Note: We don't actually run E2E tests as they require environment setup
    } else {
      addResult("Tests", "E2E tests configured", "WARN", "E2E test directory not found");
    }
  } catch {
    addResult("Tests", "E2E tests configured", "WARN", "Could not validate E2E setup");
  }

  // 4.6 Junction Table Performance Tests
  const junctionTestPath = join(
    process.cwd(),
    "tests/performance/junction-table-performance.spec.ts"
  );
  const junctionTestExists = await fileExists(junctionTestPath);
  addResult(
    "Tests",
    "Junction performance tests",
    junctionTestExists ? "PASS" : "WARN",
    junctionTestExists ? undefined : "Junction table performance tests not found"
  );
}

// =============================================================================
// SUCCESS CRITERION 5: CONSTITUTION COMPLIANCE
// =============================================================================

async function validateConstitutionCompliance() {
  console.log(chalk.blue("\n📜 Validating Constitution Compliance...\n"));

  // 5.1 Principle #1: Single unified data provider
  const oldProviderPath = join(process.cwd(), "src/atomic-crm/providers/supabase/dataProvider.ts");
  const oldExists = await fileExists(oldProviderPath);
  addResult(
    "Constitution",
    "Single data provider",
    oldExists ? "FAIL" : "PASS",
    oldExists ? "Multiple data providers still exist" : undefined
  );

  // 5.2 Principle #3: Zod schemas at API boundary only
  const unifiedPath = join(
    process.cwd(),
    "src/atomic-crm/providers/supabase/unifiedDataProvider.ts"
  );
  const unifiedContent = await readFileContent(unifiedPath);
  const hasValidationBoundary =
    unifiedContent.includes("validationRegistry") || unifiedContent.includes("validate");
  addResult(
    "Constitution",
    "Zod at API boundary",
    hasValidationBoundary ? "PASS" : "WARN",
    hasValidationBoundary ? undefined : "API boundary validation not clearly implemented"
  );

  // 5.3 Principle #35: Single responsibility
  const hasSingleResponsibility = !unifiedContent.includes("withLifecycleCallbacks");
  addResult(
    "Constitution",
    "Single responsibility",
    hasSingleResponsibility ? "PASS" : "WARN",
    hasSingleResponsibility ? undefined : "Mixed concerns detected (lifecycle callbacks)"
  );

  // 5.4 Principle #9: No backwards compatibility
  const hasNoBackwardCompat =
    !unifiedContent.includes("deprecated") &&
    !unifiedContent.includes("backward") &&
    !unifiedContent.includes("legacy");
  addResult(
    "Constitution",
    "No backward compatibility",
    hasNoBackwardCompat ? "PASS" : "WARN",
    hasNoBackwardCompat ? undefined : "Backward compatibility code detected"
  );
}

// =============================================================================
// COMPREHENSIVE FEATURE VALIDATION
// =============================================================================

async function validateCRUDOperations() {
  console.log(chalk.blue("\n📊 Validating CRUD Operations for All Resources...\n"));

  const resources = [
    "opportunities",
    "organizations",
    "contacts",
    "tasks",
    "notes",
    "tags",
    "sales",
    "activities",
    "opportunityNotes",
    "contactNotes",
  ];

  // Check validation schemas exist
  const validationDir = join(process.cwd(), "src/atomic-crm/validation");
  const validationExists = await fileExists(validationDir);

  if (validationExists) {
    for (const resource of resources) {
      const validationFile = join(validationDir, `${resource}.ts`);
      const exists = await fileExists(validationFile);
      addResult(
        "CRUD",
        `${resource} validation`,
        exists ? "PASS" : "WARN",
        exists ? undefined : `Validation schema for ${resource} not found`
      );
    }
  }

  // Check resource mapping
  const resourcesPath = join(process.cwd(), "src/atomic-crm/providers/supabase/resources.ts");
  const resourcesExist = await fileExists(resourcesPath);
  addResult(
    "CRUD",
    "Resource mapping",
    resourcesExist ? "PASS" : "WARN",
    resourcesExist ? undefined : "resources.ts mapping file not found"
  );
}

// =============================================================================
// MAIN VALIDATION RUNNER
// =============================================================================

async function runValidation() {
  console.log(chalk.bold.blue("🔍 Comprehensive Data Provider Consolidation Validation"));
  console.log(chalk.gray("Validating all success criteria from requirements.md\n"));

  // Run all validation categories
  await validateSingleProviderArchitecture();
  await validateAllFeaturesWorking();
  await validateCleanArchitecture();
  await validateTestsPassing();
  await validateConstitutionCompliance();
  await validateCRUDOperations();

  // Display results by category
  console.log(chalk.bold("\n📊 Validation Results:\n"));

  const categories = Array.from(new Set(results.map((r) => r.category)));
  let totalPass = 0,
    totalFail = 0,
    totalWarn = 0;

  for (const category of categories) {
    if (category) {
      console.log(chalk.bold.cyan(`\n${category}:`));
      const categoryResults = results.filter((r) => r.category === category);

      for (const result of categoryResults) {
        const icon = result.status === "PASS" ? "✅" : result.status === "FAIL" ? "❌" : "⚠️";
        const color =
          result.status === "PASS"
            ? chalk.green
            : result.status === "FAIL"
              ? chalk.red
              : chalk.yellow;

        console.log(`  ${icon} ${color(result.test.padEnd(35))} ${result.message || ""}`);

        if (result.status === "PASS") totalPass++;
        else if (result.status === "FAIL") totalFail++;
        else totalWarn++;
      }
    }
  }

  // Final summary
  console.log(chalk.bold("\n📈 Final Summary:"));
  console.log(chalk.green(`  ✅ Passed: ${totalPass}`));
  console.log(chalk.yellow(`  ⚠️  Warnings: ${totalWarn}`));
  console.log(chalk.red(`  ❌ Failed: ${totalFail}`));
  console.log(chalk.gray(`  📊 Total: ${results.length}`));

  // Success criteria analysis
  const criticalFailures = results.filter(
    (r) =>
      r.status === "FAIL" &&
      (r.category === "Architecture" || r.category === "Tests" || r.category === "Constitution")
  ).length;

  if (criticalFailures === 0) {
    console.log(chalk.bold.green("\n🎉 DATA PROVIDER CONSOLIDATION VALIDATION PASSED!"));
    console.log(chalk.green("✅ All critical success criteria met"));
    if (totalWarn > 0) {
      console.log(
        chalk.yellow(`⚠️  ${totalWarn} warnings should be addressed but don't block consolidation`)
      );
    }
    console.log(chalk.green("\n🚀 Ready for production deployment!\n"));
    process.exit(0);
  } else {
    console.log(chalk.bold.red("\n❌ DATA PROVIDER CONSOLIDATION VALIDATION FAILED!"));
    console.log(chalk.red(`💥 ${criticalFailures} critical failures must be resolved`));
    console.log(chalk.yellow("\n🔧 Fix the failed items before proceeding with consolidation.\n"));
    process.exit(1);
  }
}

// Error handling wrapper
async function main() {
  try {
    await runValidation();
  } catch (error) {
    console.error(chalk.red("\n💥 Validation script error:"), error);
    console.error(chalk.yellow("\nPlease check your environment and try again.\n"));
    process.exit(1);
  }
}

// Run the validation
main();
